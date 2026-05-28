"""
extractor.py
Fireworks.ai-powered entity and relationship extraction.
Uses Fireworks serverless model via OpenAI-compatible SDK (see fireworks_config.py).
Single model handles all 3 extraction passes.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI

from services.fireworks_config import get_fireworks_model, validate_fireworks_api_key, get_fireworks_base_url

_env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(_env_path, override=True)

# Fireworks uses OpenAI SDK with a different base_url and API key.
client = OpenAI(
    base_url=get_fireworks_base_url(),
    api_key=validate_fireworks_api_key(),
)
MODEL = get_fireworks_model("extraction")


def call_llm(system: str, user: str, max_tokens: int = 1000) -> str:
    """
    Make a Fireworks API call using the OpenAI-compatible interface.
    response_format=json_object forces valid JSON output — no markdown fences.
    Retries once on any exception. Raises on second failure.
    Returns raw response text string.
    """
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            if attempt == 1:
                raise RuntimeError(f"Fireworks API failed after 2 attempts: {e}") from e
            print(f"[extractor] attempt 1 failed: {e} - retrying...")

    return ""


def parse_json_safe(text: str) -> Optional[dict]:
    """
    Parse JSON from LLM response.
    Strips markdown fences defensively even though response_format should prevent them.
    Returns None on parse failure — callers must handle gracefully.
    """
    if text is None:
        return None
    cleaned = (
        text.strip()
        .removeprefix("```json")
        .removeprefix("```")
        .removesuffix("```")
        .strip()
    )
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"[extractor] JSON parse error: {e} | raw[:200]: {text[:200]}")
        return None


def extract_entities(text_chunk: str) -> dict:
    """
    Pass 1 — Entity extraction.
    Extracts people, systems, workflows, incidents, and relationships from one text chunk.
    Returns structured dict. Falls back to empty structure on any failure.

    Called once per chunk during ingestion pipeline.
    """
    system = (
        "You are an organizational knowledge extraction agent. "
        "Extract entities and relationships from the provided organizational text. "
        "You must return ONLY a JSON object matching this exact schema — no other text:\n"
        "{\n"
        '  "people": [{"name": "string", "role_hint": "string"}],\n'
        '  "systems": [{"name": "string", "type_hint": "string"}],\n'
        '  "workflows": [{"name": "string", "description_hint": "string"}],\n'
        '  "incidents": [{"id": "string", "description_hint": "string"}],\n'
        '  "relationships": [{"from": "string", "to": "string", "type": "string", "confidence": 0.0}]\n'
        "}\n"
        "Valid relationship types: OWNS, RESOLVES, KNOWS, DEPENDS_ON, AFFECTS\n"
        "Only include relationships with confidence > 0.5. "
        "If nothing is found, return empty arrays — never omit keys."
    )
    empty = {
        "people": [],
        "systems": [],
        "workflows": [],
        "incidents": [],
        "relationships": [],
    }
    try:
        result = call_llm(
            system, f"Extract entities from this organizational text:\n\n{text_chunk}"
        )
        parsed = parse_json_safe(result)
    except Exception as e:
        print(f"[extractor] entity extraction failed: {e}")
        return empty

    if not parsed:
        return empty

    return {**empty, **parsed}


def infer_relationships(entity_summary: dict) -> list[dict]:
    """
    Pass 2 — Relationship inference.
    Takes aggregated entity co-occurrence counts across all chunks.
    Infers higher-order ownership and dependency patterns.
    Returns list of inferred relationships.

    entity_summary shape: { entity_name: { mentions: int, co_mentions: {other_entity: count} } }
    """
    system = (
        "You are an organizational dependency analyst. "
        "Given entity co-occurrence patterns from organizational data, identify who owns what, "
        "who is the de-facto resolver for each system, and which systems are tightly coupled. "
        "Focus on frequency signals: high co-mention count = strong relationship. "
        "Return ONLY a JSON object: "
        '{"inferred": [{"from": "str", "to": "str", "type": "str", "weight": 1.0, "reasoning": "str"}]}'
    )
    try:
        result = call_llm(
            system,
            f"Entity co-occurrence patterns:\n{json.dumps(entity_summary, indent=2)}",
            max_tokens=1500,
        )
        parsed = parse_json_safe(result)
    except Exception as e:
        print(f"[extractor] relationship inference failed: {e}")
        return []

    return parsed.get("inferred", []) if parsed else []


def compress_knowledge(entity_name: str, all_mentions: list[str]) -> dict:
    """
    Pass 3 — Knowledge compression.
    Synthesizes a canonical operational description for a high-centrality entity
    from all its raw mentions across ingested documents.
    Called only for top-5 most-mentioned entities per ingestion run.

    Returns structured knowledge summary stored as Neo4j node property.
    """
    system = (
        "You are an organizational knowledge curator. "
        f"Synthesize a canonical operational description for '{entity_name}' "
        "based on how it is described and mentioned across organizational data. "
        "Return ONLY a JSON object with these exact keys:\n"
        '{"summary": "string", "procedures": ["string"], '
        '"dependencies": ["string"], "expertise_areas": ["string"], "risk_notes": ["string"]}'
    )
    fallback = {
        "summary": "",
        "procedures": [],
        "dependencies": [],
        "expertise_areas": [],
        "risk_notes": [],
    }

    # Cap at 20 mentions to control token cost.
    mentions_text = "\n---\n".join(all_mentions[:20])
    try:
        result = call_llm(
            system,
            f"All mentions of '{entity_name}':\n\n{mentions_text}",
            max_tokens=1200,
        )
        parsed = parse_json_safe(result)
    except Exception as e:
        print(f"[extractor] knowledge compression failed for {entity_name}: {e}")
        return fallback

    return {**fallback, **parsed} if parsed else fallback
