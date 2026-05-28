"""
coral_query.py

/coral-query  —  Coral-powered hybrid retrieval + Fireworks LLM grounding.
/coral-schema —  Return registered Coral table schemas (used by Settings page).
/coral-report —  Return cross-source analytics for Reports page.

Architecture before Coral:
  /query → Neo4j Cypher (1 call) + ChromaDB semantic search (1 call) → merge manually → LLM

Architecture after Coral:
  /coral-query → Coral SQL JOIN across all sources (1 call) → LLM
  Coral handles: auth, pagination, rate limits, caching, cross-source JOINs.

The /query endpoint is unchanged. Both endpoints run in parallel.
Frontend uses /coral-query for the new Coral-powered features.

Used by: main.py (router registration)
Depends on: services/coral_service.py, services/fireworks_config.py, coral/queries.py
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field

try:
    from coral.queries import FULL_OPERATIONAL_CONTEXT, OPERATIONAL_CONTEXT_OVERVIEW
    from services.coral_service import get_coral_service, sanitize_sql_param
    from services.fireworks_config import fireworks_client_kwargs, get_fireworks_model
except ModuleNotFoundError:
    from backend.coral.queries import FULL_OPERATIONAL_CONTEXT, OPERATIONAL_CONTEXT_OVERVIEW
    from backend.services.coral_service import get_coral_service, sanitize_sql_param
    from backend.services.fireworks_config import fireworks_client_kwargs, get_fireworks_model

router = APIRouter(tags=["coral"])
coral = get_coral_service()
MODEL = get_fireworks_model("query")

_fireworks_client: Optional[OpenAI] = None

KNOWN_ENTITIES = [
    "patel",
    "chen",
    "kim",
    "walsh",
    "brooks",
    "payment",
    "auth",
    "data bus",
    "deploy",
    "analytics",
    "p-4021",
    "p-3882",
    "p-3722",
    "rollback",
    "incident",
]

STOP_WORDS = {
    "what",
    "who",
    "how",
    "when",
    "where",
    "why",
    "which",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "do",
    "does",
    "did",
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "for",
    "with",
    "from",
    "into",
    "on",
    "at",
    "to",
    "of",
    "in",
    "it",
    "its",
    "if",
    "about",
    "tell",
    "me",
    "us",
    "we",
    "you",
    "can",
    "will",
    "would",
    "should",
    "could",
    "this",
    "that",
    "these",
    "those",
}


class CoralQueryRequest(BaseModel):
    """POST /coral-query body."""

    question: str = Field(..., min_length=1)


class CoralQueryResponse(BaseModel):
    """Structured Coral + LLM response."""

    answer: str
    steps: list[str]
    related: dict[str, Any]
    sources: list[str]
    coral_sql: str
    coral_rows: int
    retrieval_method: str


class CoralReportResponse(BaseModel):
    """GET /coral-report analytics bundle."""

    bus_factor: list[dict[str, Any]]
    team_concentration: list[dict[str, Any]]
    incident_resolvers: list[dict[str, Any]]
    undocumented_workflows: list[dict[str, Any]]
    coral_available: bool


SYSTEM_PROMPT = """You are an operational intelligence assistant for an engineering organization.
You have access to cross-source data retrieved via Coral SQL JOINs across:
- Neo4j knowledge graph (people, systems, workflows, incidents)
- Incident postmortem reports
- Slack operational discussions

Answer the user's question using ONLY the provided data context.
Return a JSON object with this exact structure — no other text, no markdown fences:
{
  "answer": "2-3 sentence direct answer",
  "steps": ["step 1", "step 2", "step 3"],
  "related": {
    "systems": ["system name"],
    "people": ["person name (role)"],
    "incidents": ["incident id (severity, duration)"],
    "warnings": ["RISK: description"]
  },
  "sources": ["knowledge_graph", "incident_reports", "slack_messages"]
}
If steps are not applicable, return "steps": [].
If warnings are not applicable, return "warnings": [].
Always include at least 1 item in "sources"."""


def _get_query_client() -> OpenAI:
    """Lazy Fireworks client — avoids crashing app import when API key is unset."""
    global _fireworks_client
    if _fireworks_client is None:
        _fireworks_client = OpenAI(**fireworks_client_kwargs())
    return _fireworks_client


def _extract_keyword(question: str) -> Optional[str]:
    """
    Extract the most likely entity keyword from the question.

    Returns None when no entity or content token is found (caller uses broad overview query).
    """
    lower = question.lower()
    for entity in KNOWN_ENTITIES:
        if entity in lower:
            return entity
    words = [
        w
        for w in re.sub(r"[^\w\s]", "", lower).split()
        if w not in STOP_WORDS and len(w) > 1
    ]
    return words[0] if words else None


def _format_coral_context(rows: list[dict[str, Any]], max_rows: int = 30) -> str:
    """Format Coral SQL results as a readable context block for LLM grounding."""
    if not rows:
        return "No relevant data found in the knowledge graph."
    lines = []
    for row in rows[:max_rows]:
        parts = [f"{k}: {v}" for k, v in row.items() if v not in (None, "", 0)]
        lines.append(" | ".join(parts))
    return "\n".join(lines)


def _empty_related() -> dict[str, list]:
    return {"systems": [], "people": [], "incidents": [], "warnings": []}


@router.post("/coral-query", response_model=CoralQueryResponse)
async def coral_query(req: CoralQueryRequest) -> CoralQueryResponse:
    """
    Coral-powered hybrid retrieval + LLM grounding.
    Uses Coral SQL over the knowledge graph (and related demo sources).
    """
    if not coral.available:
        raise HTTPException(
            status_code=503,
            detail="Coral CLI not available. Install: brew install withcoral/tap/coral",
        )

    try:
        client = _get_query_client()
    except ValueError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    keyword = _extract_keyword(req.question)
    used_broad_context = keyword is None

    try:
        if keyword:
            safe_keyword = sanitize_sql_param(keyword)
            rows = coral.full_context(safe_keyword)
            sql_used = FULL_OPERATIONAL_CONTEXT.format(keyword=safe_keyword)
        else:
            rows = coral.operational_overview()
            sql_used = OPERATIONAL_CONTEXT_OVERVIEW
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=f"Coral query failed: {exc}") from exc

    context = _format_coral_context(rows)
    raw = ""

    user_context_note = (
        "No specific entity keyword matched — using highest-risk graph overview."
        if used_broad_context
        else f"Keyword filter: {keyword}"
    )

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            max_tokens=1000,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Question: {req.question}\n\n"
                        f"{user_context_note}\n\n"
                        f"Coral SQL context ({len(rows)} rows across knowledge graph, "
                        f"incidents, and Slack):\n{context}"
                    ),
                },
            ],
        )
        raw = completion.choices[0].message.content or ""
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {
            "answer": raw if raw else "Unable to parse response.",
            "steps": [],
            "related": _empty_related(),
            "sources": ["knowledge_graph"],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM error: {exc}") from exc

    related = result.get("related", _empty_related())
    if not isinstance(related, dict):
        related = _empty_related()

    if used_broad_context:
        warnings = related.get("warnings")
        if not isinstance(warnings, list):
            warnings = []
        warnings.append(
            "No entity keyword matched your question — answer uses org-wide high-risk context."
        )
        related["warnings"] = warnings

    return CoralQueryResponse(
        answer=result.get("answer", ""),
        steps=result.get("steps") or [],
        related=related,
        sources=result.get("sources") or ["knowledge_graph"],
        coral_sql=sql_used.strip(),
        coral_rows=len(rows),
        retrieval_method="coral_sql_join",
    )


@router.get("/coral-schema")
async def coral_schema() -> dict[str, Any]:
    """
    Return Coral catalog metadata for MemoryWeave sources.
    Used by SettingsPage to display connected SQL tables + column names.
    """
    schema = coral.get_schema()
    schema["sources_registered"] = [
        "knowledge_nodes (Graph snapshot JSONL)",
        "knowledge_edges (Graph snapshot JSONL)",
        "incident_reports (Markdown → JSONL)",
        "slack_messages (JSON export)",
    ]
    schema["available"] = coral.available
    return schema


@router.get("/coral-report", response_model=CoralReportResponse)
async def coral_report() -> CoralReportResponse:
    """
    Cross-source analytics for the Reports page.
    Runs four Coral SQL queries (bus factor, teams, incidents, workflows).
    """
    if not coral.available:
        return CoralReportResponse(
            bus_factor=[],
            team_concentration=[],
            incident_resolvers=[],
            undocumented_workflows=[],
            coral_available=False,
        )

    def _safe_call(fn: Any) -> list[dict[str, Any]]:
        try:
            return fn()
        except Exception:
            return []

    return CoralReportResponse(
        bus_factor=_safe_call(coral.bus_factor),
        team_concentration=_safe_call(coral.team_concentration),
        incident_resolvers=_safe_call(coral.incident_resolvers),
        undocumented_workflows=_safe_call(coral.undocumented_workflows),
        coral_available=True,
    )
