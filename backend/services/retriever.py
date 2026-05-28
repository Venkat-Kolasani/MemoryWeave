"""
retriever.py

Hybrid retrieval combining ChromaDB semantic search and Neo4j graph traversal.
For each question: find relevant text chunks and relevant entity relationships.
Both contexts are merged and passed to the LLM for grounded synthesis.
"""

from __future__ import annotations

import re
from collections import OrderedDict
from typing import Any, Optional

from services.chroma_service import ChromaService
from services.neo4j_service import Neo4jService


RISK_TERMS = {
    "risk",
    "undocumented",
    "expertise",
    "bus factor",
    "single owner",
    "single-owner",
    "sole owner",
    "backup",
    "tribal",
}


def get_known_entities(neo4j: Neo4jService) -> list[dict[str, Any]]:
    """
    Fetch all entity names and IDs from Neo4j for query entity matching.

    Returns [{ id, name, type, aliases }].
    """
    entities: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    with neo4j.driver.session() as session:
        for label in ["Person", "System", "Workflow", "Incident"]:
            result = session.run(
                f"""
                MATCH (n:{label})
                RETURN n.id AS id,
                       coalesce(n.name, n.title, n.id) AS name,
                       n.title AS title
                """
            )
            for row in result:
                entity_id = row["id"]
                name = row["name"]
                if not entity_id or not name:
                    continue

                key = (entity_id, label)
                if key in seen:
                    continue
                seen.add(key)

                aliases = _entity_aliases(name, entity_id, row["title"], label)
                entities.append(
                    {
                        "id": entity_id,
                        "name": name,
                        "type": label.lower(),
                        "aliases": aliases,
                    }
                )

    return entities


def match_entities_in_question(question: str, known_entities: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Find which known entities are mentioned in the question.

    Uses case-insensitive substring matching plus lightweight aliases such as
    "payment service" -> "Payment API".
    """
    question_lower = question.lower()
    normalized_question = _normalize(question)
    matched = []

    for entity in known_entities:
        names = [entity["name"], *entity.get("aliases", [])]
        for name in names:
            if not name:
                continue
            if name.lower() in question_lower or _normalize(name) in normalized_question:
                matched.append(entity)
                break

    return matched


def get_graph_context(matched_entities: list[dict[str, Any]], neo4j: Neo4jService) -> str:
    """
    Traverse each matched entity's immediate Neo4j neighborhood.

    Relationship lines are formatted as human-readable sentences for LLM context.
    """
    if not matched_entities:
        return ""

    context_lines = []
    with neo4j.driver.session() as session:
        for entity in matched_entities[:5]:
            result = session.run(
                """
                MATCH (n {id: $id})
                OPTIONAL MATCH (n)-[out]->(to)
                OPTIONAL MATCH (from)-[in]->(n)
                RETURN n.name AS entity_name,
                       collect(DISTINCT {
                         direction: 'out',
                         rel_type: type(out),
                         connected_name: coalesce(to.name, to.title, to.id),
                         connected_type: labels(to)[0],
                         connected_props: properties(to)
                       }) AS outgoing,
                       collect(DISTINCT {
                         direction: 'in',
                         rel_type: type(in),
                         connected_name: coalesce(from.name, from.title, from.id),
                         connected_type: labels(from)[0],
                         connected_props: properties(from)
                       }) AS incoming
                """,
                id=entity["id"],
            )
            record = result.single()
            if not record:
                continue

            from_name = record["entity_name"] or entity["name"]
            for rel in [*record["outgoing"], *record["incoming"]]:
                if not rel.get("rel_type"):
                    continue
                detail = _relationship_detail(rel.get("connected_props") or {})
                detail_str = f" ({detail})" if detail else ""
                if rel["direction"] == "out":
                    context_lines.append(
                        f"{from_name} {rel['rel_type']} {rel['connected_type']} "
                        f"'{rel['connected_name']}'{detail_str}"
                    )
                else:
                    context_lines.append(
                        f"{rel['connected_type']} '{rel['connected_name']}' "
                        f"{rel['rel_type']} {from_name}{detail_str}"
                    )

    return "\n".join(_dedupe(context_lines))


def hybrid_retrieve(question: str, neo4j: Neo4jService, chroma: ChromaService) -> dict[str, Any]:
    """
    Combine semantic search and graph traversal for a question.

    Returns { semantic_context, graph_context, sources }.
    """
    semantic_results = chroma.search(question, n_results=8)
    semantic_context = "\n\n".join(result["text"] for result in semantic_results[:5])

    known_entities = get_known_entities(neo4j)
    matched_entities = match_entities_in_question(question, known_entities)
    graph_context = get_graph_context(matched_entities, neo4j)

    risk_context = get_risk_context(question, neo4j)
    if risk_context:
        graph_context = "\n".join(part for part in [graph_context, risk_context] if part)

    return {
        "semantic_context": semantic_context,
        "graph_context": graph_context,
        "sources": _sources(semantic_results),
    }


def get_risk_context(question: str, neo4j: Neo4jService) -> str:
    """Add compact risk context for broad bus-factor/risk questions."""
    question_lower = question.lower()
    if not any(term in question_lower for term in RISK_TERMS):
        return ""

    lines = []
    with neo4j.driver.session() as session:
        for row in session.run(
            """
            MATCH (p:Person)-[r:KNOWS]->(s:System)
            OPTIONAL MATCH (p)-[:OWNS]->(w:Workflow)
            WITH p, s, r, collect(DISTINCT w.name) AS workflows
            RETURN p.name AS person,
                   p.team AS team,
                   p.role AS role,
                   p.risk_score AS risk_score,
                   s.name AS system,
                   coalesce(r.weight, r.confidence, 1.0) AS weight,
                   s.documented AS documented,
                   workflows
            ORDER BY risk_score DESC, weight DESC
            LIMIT 8
            """
        ):
            docs = "undocumented or partial" if _is_undocumented(row["documented"]) else "documented"
            workflow_text = (
                f"; owns workflows: {', '.join(row['workflows'])}"
                if row["workflows"]
                else ""
            )
            lines.append(
                f"Risk signal: {row['person']} ({row['role']}, {row['team']}) is primary on "
                f"{row['system']} with stored risk {int(row['risk_score'] or 0)}; "
                f"system documentation is {docs}{workflow_text}."
            )

        for row in session.run(
            """
            MATCH (p:Person)-[:OWNS]->(w:Workflow)
            WHERE w.documented = false
            RETURN p.name AS person, w.name AS workflow, w.owner AS owner
            ORDER BY person
            """
        ):
            lines.append(
                f"Risk signal: {row['workflow']} is undocumented and primarily owned by "
                f"{row['person'] or row['owner']}."
            )

    return "\n".join(_dedupe(lines))


def _sources(semantic_results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_source: OrderedDict[str, float] = OrderedDict()
    for result in semantic_results:
        metadata = result.get("metadata", {})
        source_name = metadata.get("source_name", "unknown")
        relevance = round(max(0, 1 - float(result.get("distance", 1))), 2)
        by_source[source_name] = max(by_source.get(source_name, 0), relevance)
        if len(by_source) >= 3:
            break

    return [
        {"source_name": source_name, "relevance": relevance}
        for source_name, relevance in by_source.items()
    ]


def _entity_aliases(name: str, entity_id: str, title: Optional[str], label: str) -> list[str]:
    aliases = {name, entity_id}
    if title:
        aliases.add(title)

    lower_name = name.lower()
    if label == "System":
        aliases.add(lower_name.replace(" ", "-"))
        aliases.add(lower_name.replace(" api", " service"))
        aliases.add(lower_name.replace(" service", " api"))
        if "payment" in lower_name:
            aliases.update({"payment", "payments", "payment-api", "payment service"})
        if "auth" in lower_name:
            aliases.update({"auth", "authentication", "auth-service", "auth pipeline"})
        if "deploy" in lower_name:
            aliases.update({"deploy", "deployment", "deploy pipeline", "deploy-system"})

    if label == "Incident" and re.match(r"p-\d+", lower_name):
        aliases.add(lower_name.replace("-", " "))

    return sorted(aliases)


def _relationship_detail(props: dict[str, Any]) -> str:
    for key in ("title", "description", "role", "severity", "duration", "owner"):
        if props.get(key):
            return str(props[key])
    return ""


def _normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _dedupe(lines: list[str]) -> list[str]:
    return list(OrderedDict.fromkeys(line for line in lines if line))


def _is_undocumented(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, bool):
        return not value
    return str(value).strip().lower() in {"no", "false", "undocumented", "incomplete", "partial"}
