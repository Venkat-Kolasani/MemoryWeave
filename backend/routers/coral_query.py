"""
coral_query.py

/coral-query  —  Coral-powered hybrid retrieval + Fireworks LLM grounding.
/coral-schema —  Return registered Coral table schemas (used by Settings page).
/coral-mcp-config — MCP server block for Claude Desktop / Cursor.
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
    from coral.queries import (
        AUTH_PIPELINE_OWNERSHIP,
        DEPLOYMENT_HISTORY_CONTEXT,
        FULL_OPERATIONAL_CONTEXT,
        INCIDENT_DETAIL,
        OPERATIONAL_CONTEXT_OVERVIEW,
        PATEL_ABSENCE_RISK,
        PAYMENT_RECOVERY_CONTEXT,
        SYSTEMS_WITHOUT_BACKUP,
    )
    from services.coral_service import (
        check_mcp_available,
        get_coral_service,
        get_mcp_config,
        sanitize_sql_param,
    )
    from services.fireworks_config import fireworks_client_kwargs, get_fireworks_model
except ModuleNotFoundError:
    from backend.coral.queries import (
        AUTH_PIPELINE_OWNERSHIP,
        DEPLOYMENT_HISTORY_CONTEXT,
        FULL_OPERATIONAL_CONTEXT,
        INCIDENT_DETAIL,
        OPERATIONAL_CONTEXT_OVERVIEW,
        PATEL_ABSENCE_RISK,
        PAYMENT_RECOVERY_CONTEXT,
        SYSTEMS_WITHOUT_BACKUP,
    )
    from backend.services.coral_service import (
        check_mcp_available,
        get_coral_service,
        get_mcp_config,
        sanitize_sql_param,
    )
    from backend.services.fireworks_config import (
        fireworks_client_kwargs,
        get_fireworks_model,
    )

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
    "have",
    "has",
    "had",
    "owns",
    "owned",
    "whose",
    "which",
    "there",
    "their",
    "they",
    "them",
    "been",
    "being",
    "were",
    "was",
    "any",
    "all",
    "some",
    "many",
    "most",
    "such",
    "only",
    "just",
    "also",
    "than",
    "then",
    "not",
    "no",
    "yes",
    "out",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "weekend",
    "today",
    "tomorrow",
    "yesterday",
    "happened",
    "happen",
    "happens",
    "pipeline",
    "service",
    "services",
    "system",
    "systems",
    "owner",
    "owners",
    "backup",
    "incident",
    "incidents",
    "recover",
    "recovery",
    "failure",
    "failures",
    "history",
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
    github_knowledge_cross_join: list[dict[str, Any]]
    github_mode: str
    coral_available: bool


SYSTEM_PROMPT = """You are an operational intelligence assistant for an engineering organization.
You have access to cross-source data retrieved via Coral SQL JOINs across:
- Neo4j knowledge graph (people, systems, workflows, incidents)
- Incident postmortem reports
- Slack operational discussions
- GitHub issues (MemoryWeave repository)

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
        for w in re.sub(r"[^\w\s-]", "", lower).split()
        if w not in STOP_WORDS and len(w) > 1
    ]
    return words[0] if words else None


def _extract_incident_id(question: str) -> Optional[str]:
    """Pull incident id like P-4021 from natural-language questions."""
    match = re.search(r"\bp-\d{4}\b", question, flags=re.IGNORECASE)
    return match.group(0).upper() if match else None


def _resolve_coral_query(
    question: str,
) -> tuple[list[dict[str, Any]], str, str]:
    """
    Map demo/sample questions to dedicated Coral SQL templates.

    Returns (rows, sql_used, context_note).
    """
    lower = question.lower()

    if re.search(
        r"backup\s+owner|no\s+backup|sole\s+owner|single\s+point|bus\s+factor",
        lower,
    ):
        return (
            coral.systems_without_backup(),
            SYSTEMS_WITHOUT_BACKUP.strip(),
            "Intent: systems without a documented backup owner",
        )

    if re.search(
        r"recover.*payment|payment.*recover|payment\s+service\s+fail|payment\s+fail",
        lower,
    ) or ("payment" in lower and "recover" in lower):
        return (
            coral.payment_recovery_context(),
            PAYMENT_RECOVERY_CONTEXT.strip(),
            "Intent: payment service recovery (graph + incidents + Slack)",
        )

    if re.search(r"auth\s+pipeline|owns?\s+.*auth|who\s+owns.*auth", lower) or (
        "auth" in lower and "own" in lower
    ):
        return (
            coral.auth_pipeline_ownership(),
            AUTH_PIPELINE_OWNERSHIP.strip(),
            "Intent: auth pipeline ownership and backup coverage",
        )

    incident_id = _extract_incident_id(question)
    if incident_id or re.search(r"what\s+happened.*incident", lower):
        iid = incident_id or "P-4021"
        safe_id = sanitize_sql_param(iid)
        return (
            coral.incident_detail(safe_id),
            INCIDENT_DETAIL.format(incident_id=safe_id).strip(),
            f"Intent: incident detail for {iid}",
        )

    if re.search(r"deploy|deployment\s+history|q4\s+deploy", lower):
        return (
            coral.deployment_history_context(),
            DEPLOYMENT_HISTORY_CONTEXT.strip(),
            "Intent: deployment history (Deploy System + Slack)",
        )

    if re.search(r"patel.*monday|monday.*patel|patel.*out|out.*patel", lower):
        return (
            coral.patel_absence_risk(),
            PATEL_ABSENCE_RISK.strip(),
            "Intent: Patel absence / bus-factor risk",
        )

    if re.search(
        r"github|git\s*hub|memoryweave\s+issue|issue.*memoryweave|repo\s+issue",
        lower,
    ):
        return (
            coral.github_knowledge_cross_join(),
            coral.github_knowledge_cross_join_sql(),
            "Intent: knowledge graph × GitHub issues cross-source JOIN",
        )

    return [], "", ""


def _run_coral_retrieval(
    question: str,
) -> tuple[list[dict[str, Any]], str, Optional[str], bool, str]:
    """
    Execute Coral SQL for a question.

    Returns (rows, sql_used, keyword_or_none, used_broad_context, context_note).
    """
    intent_rows, intent_sql, intent_note = _resolve_coral_query(question)
    if intent_sql:
        return intent_rows, intent_sql, None, False, intent_note

    keyword = _extract_keyword(question)
    if keyword:
        safe_keyword = sanitize_sql_param(keyword)
        rows = coral.full_context(safe_keyword)
        sql_used = FULL_OPERATIONAL_CONTEXT.format(keyword=safe_keyword)
        return rows, sql_used, keyword, False, f"Keyword filter: {keyword}"

    rows = coral.operational_overview()
    return (
        rows,
        OPERATIONAL_CONTEXT_OVERVIEW.strip(),
        None,
        True,
        "No specific entity keyword matched — using highest-risk graph overview.",
    )


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

    try:
        rows, sql_used, keyword, used_broad_context, user_context_note = (
            _run_coral_retrieval(req.question)
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=f"Coral query failed: {exc}") from exc

    context = _format_coral_context(rows)
    raw = ""

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


@router.get("/coral-mcp-config")
async def coral_mcp_config() -> dict[str, Any]:
    """
    MCP server config for Claude Desktop / Cursor (parallel to production CLI subprocess).

    Used by SettingsPage copy-paste setup.
    """
    mcp_ok = check_mcp_available()
    return {
        "available": mcp_ok,
        "cli_available": coral.available,
        "config": get_mcp_config(),
        "instructions": (
            "Add the `config` object to your MCP client settings (Claude Desktop, Cursor, "
            "or any MCP host), then restart the client. Ask natural-language questions — "
            "Coral exposes SQL tools over knowledge_nodes, knowledge_edges, incident_reports, "
            "slack_messages, and github.issues without loading raw files into the model context."
        ),
    }


@router.get("/coral-schema")
async def coral_schema() -> dict[str, Any]:
    """
    Return Coral catalog metadata for MemoryWeave sources.
    Used by SettingsPage to display connected SQL tables + column names.
    """
    schema = coral.get_schema()
    github_mode = coral.github_mode() if coral.available else "unknown"
    github_label = (
        "github_issues (Live GitHub API — github.issues)"
        if github_mode == "api"
        else "github_issues (JSONL fallback — memoryweave_demo.github_issues)"
    )
    schema["github_mode"] = github_mode
    schema["sources_registered"] = [
        "knowledge_nodes (Graph snapshot JSONL)",
        "knowledge_edges (Graph snapshot JSONL)",
        "incident_reports (Markdown → JSONL)",
        "slack_messages (JSON export)",
        github_label,
    ]
    schema["available"] = coral.available
    return schema


@router.get("/coral-report", response_model=CoralReportResponse)
async def coral_report() -> CoralReportResponse:
    """
    Cross-source analytics for the Reports page.
    Runs Coral SQL queries (bus factor, teams, incidents, workflows, GitHub × graph).
    """
    if not coral.available:
        return CoralReportResponse(
            bus_factor=[],
            team_concentration=[],
            incident_resolvers=[],
            undocumented_workflows=[],
            github_knowledge_cross_join=[],
            github_mode="unknown",
            coral_available=False,
        )

    def _safe_call(fn: Any) -> list[dict[str, Any]]:
        try:
            return fn()
        except Exception:
            return []

    mode = coral.github_mode()
    return CoralReportResponse(
        bus_factor=_safe_call(coral.bus_factor),
        team_concentration=_safe_call(coral.team_concentration),
        incident_resolvers=_safe_call(coral.incident_resolvers),
        undocumented_workflows=_safe_call(coral.undocumented_workflows),
        github_knowledge_cross_join=_safe_call(coral.github_knowledge_cross_join),
        github_mode=mode,
        coral_available=True,
    )
