"""
pipeline.py
Orchestrates the full 3-pass extraction pipeline for a single ingested document.
Flow: chunk text → Pass 1 per chunk → aggregate → Pass 2 → Pass 3 top entities → store
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

from .extractor import compress_knowledge, extract_entities, infer_relationships

try:
    from services.chroma_service import ChromaService
    from services.neo4j_service import Neo4jService
except ModuleNotFoundError:
    from backend.services.chroma_service import ChromaService
    from backend.services.neo4j_service import Neo4jService


def chunk_text(text: str, max_chars: int = 500) -> list[str]:
    """
    Split text into chunks at sentence boundaries, max max_chars each.
    Skips chunks under 80 characters (too short to extract meaningful entities).
    Returns list of text strings.
    """
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) > max_chars and current:
            if len(current) >= 80:
                chunks.append(current.strip())
            current = sentence
        else:
            current = (current + " " + sentence).strip()

    if current and len(current) >= 80:
        chunks.append(current.strip())

    return chunks


def aggregate_entities(all_extracted: list[dict]) -> dict:
    """
    Aggregate entity mentions and co-occurrences across all chunk extractions.
    Returns: { entity_name: { mentions: int, co_mentions: {other: count}, raw_mentions: [str] } }
    Used as input to Pass 2 (relationship inference) and to rank entities for Pass 3.
    """
    aggregated = defaultdict(
        lambda: {"mentions": 0, "co_mentions": defaultdict(int), "raw_mentions": []}
    )

    for extracted in all_extracted:
        chunk_entities = []
        for person in extracted.get("people", []):
            name = person.get("name")
            if name:
                chunk_entities.append(name)
        for system in extracted.get("systems", []):
            name = system.get("name")
            if name:
                chunk_entities.append(name)
        for workflow in extracted.get("workflows", []):
            name = workflow.get("name")
            if name:
                chunk_entities.append(name)
        for incident in extracted.get("incidents", []):
            name = incident.get("id")
            if name:
                chunk_entities.append(name)

        for name in set(chunk_entities):
            aggregated[name]["mentions"] += 1
            for other in set(chunk_entities):
                if other != name:
                    aggregated[name]["co_mentions"][other] += 1

    return {
        name: {
            "mentions": data["mentions"],
            "co_mentions": dict(data["co_mentions"]),
            "raw_mentions": data["raw_mentions"],
        }
        for name, data in aggregated.items()
    }


def run_extraction_pipeline(
    file_content: str,
    source_type: str,
    source_name: str,
    neo4j: Neo4jService,
    chroma: ChromaService,
) -> dict:
    """
    Full extraction pipeline for one ingested document.

    Steps:
    1. Chunk the content into manageable pieces
    2. Pass 1: extract entities from each chunk
    3. Aggregate entity mentions across chunks
    4. Pass 2: infer higher-order relationships from aggregated patterns
    5. Pass 3: compress knowledge for top 5 most-mentioned entities
    6. Upsert entities + relationships into Neo4j
    7. Index chunks into ChromaDB for semantic search

    Returns: { entities_found: int, relationships_created: int, chunks_indexed: int }
    """
    print(f"[pipeline] Starting extraction: {source_name} ({source_type})")

    chunks = chunk_text(file_content)
    print(f"[pipeline] {len(chunks)} chunks created")

    all_extracted = []
    for i, chunk in enumerate(chunks):
        result = extract_entities(chunk)
        all_extracted.append(result)
        print(
            f"[pipeline] chunk {i + 1}/{len(chunks)}: "
            f"{len(result['people'])} people, {len(result['systems'])} systems, "
            f"{len(result['relationships'])} relationships"
        )

    aggregated = aggregate_entities(all_extracted)
    top_summary = dict(
        sorted(aggregated.items(), key=lambda x: x[1]["mentions"], reverse=True)[:20]
    )
    inferred = infer_relationships(top_summary) if top_summary else []
    print(f"[pipeline] Pass 2: {len(inferred)} inferred relationships")

    top_entities = sorted(
        aggregated.items(), key=lambda x: x[1]["mentions"], reverse=True
    )[:5]
    knowledge_summaries = {}
    for entity_name, _data in top_entities:
        entity_mentions = [
            chunk for chunk in chunks if entity_name.lower() in chunk.lower()
        ]
        if entity_mentions:
            knowledge_summaries[entity_name] = compress_knowledge(
                entity_name, entity_mentions
            )
            print(f"[pipeline] Pass 3: compressed knowledge for '{entity_name}'")

    entities_created = 0
    relationships_created = 0
    entity_types: dict[str, str] = {}

    for extraction in all_extracted:
        for person in extraction.get("people", []):
            name = person.get("name")
            if not name:
                continue
            neo4j.create_person(
                id=_entity_id(name),
                name=name,
                team="Unknown",
                role=person.get("role_hint", "Unknown") or "Unknown",
            )
            entity_types[name] = "person"
            entities_created += 1

        for system in extraction.get("systems", []):
            name = system.get("name")
            if not name:
                continue
            neo4j.create_system(
                id=_entity_id(name),
                name=name,
                system_type=system.get("type_hint", "Unknown") or "Unknown",
                criticality="Unknown",
                status="Unknown",
                description=knowledge_summaries.get(name, {}).get("summary", ""),
            )
            entity_types[name] = "system"
            entities_created += 1

        for workflow in extraction.get("workflows", []):
            name = workflow.get("name")
            if not name:
                continue
            neo4j.create_workflow(
                id=_entity_id(name),
                name=name,
                steps_count=0,
                documented=False,
                owner="Unknown",
                last_run="",
            )
            entity_types[name] = "workflow"
            entities_created += 1

        for incident in extraction.get("incidents", []):
            incident_id = incident.get("id")
            if not incident_id:
                continue
            neo4j.create_incident(
                id=_entity_id(incident_id),
                title=incident.get("description_hint", incident_id) or incident_id,
                severity="Unknown",
                date="",
                duration=0,
                resolved_by="Unknown",
            )
            entity_types[incident_id] = "incident"
            entities_created += 1

    for extraction in all_extracted:
        for rel in extraction.get("relationships", []):
            if _relationship_confidence(rel) <= 0.5:
                continue
            if _upsert_relationship(neo4j, rel, entity_types):
                relationships_created += 1

    for rel in inferred:
        if _upsert_relationship(neo4j, rel, entity_types, inferred=True):
            relationships_created += 1

    chroma_chunks = [
        {
            "id": f"{_safe_id(source_type)}_{_safe_id(source_name)}_{i}",
            "text": chunk,
            "source_type": source_type,
            "source_name": source_name,
            "author": "unknown",
            "timestamp": "",
            "entities": [],
        }
        for i, chunk in enumerate(chunks)
    ]
    chroma.add_documents(chroma_chunks)

    summary = {
        "entities_found": entities_created,
        "relationships_created": relationships_created,
        "chunks_indexed": len(chunks),
    }
    print(f"[pipeline] Done: {summary}")
    return summary


def _upsert_relationship(
    neo4j: Neo4jService,
    rel: dict[str, Any],
    entity_types: dict[str, str],
    inferred: bool = False,
) -> bool:
    rel_type = str(rel.get("type", "")).upper()
    from_name = rel.get("from")
    to_name = rel.get("to")
    if not from_name or not to_name:
        return False

    from_id = _entity_id(from_name)
    to_id = _entity_id(to_name)
    weight = float(rel.get("weight") or rel.get("confidence") or 1.0)

    try:
        if rel_type == "OWNS":
            if entity_types.get(to_name) == "workflow":
                neo4j.link_person_owns_workflow(from_id, to_id, weight=weight)
                return True
        elif rel_type == "RESOLVES":
            neo4j.link_person_resolves_incident(
                from_id, to_id, weight=weight, dashed=inferred
            )
            return True
        elif rel_type == "KNOWS":
            neo4j.link_person_knows_system(from_id, to_id, confidence=min(weight, 1.0))
            return True
        elif rel_type == "DEPENDS_ON":
            if entity_types.get(from_name) == "workflow":
                neo4j.link_workflow_depends_on_system(
                    from_id, to_id, weight=weight, dashed=inferred
                )
            else:
                neo4j.link_system_depends_on(
                    from_id, to_id, weight=weight, dashed=inferred
                )
            return True
        elif rel_type == "AFFECTS":
            neo4j.link_incident_affects_system(
                from_id, to_id, weight=weight, dashed=inferred
            )
            return True
    except Exception as e:
        print(f"[pipeline] relationship upsert skipped: {e}")

    return False


def _relationship_confidence(rel: dict) -> float:
    try:
        return float(rel.get("confidence", 0))
    except (TypeError, ValueError):
        return 0.0


def _entity_id(value: str) -> str:
    return _safe_id(value).replace(".", "")


def _safe_id(value: str) -> str:
    safe = re.sub(r"[^a-z0-9_]+", "_", value.lower().strip())
    return safe.strip("_") or "unknown"
