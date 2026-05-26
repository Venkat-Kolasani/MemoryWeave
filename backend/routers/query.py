"""
query.py

Natural-language assistant query endpoint.
Mock responses mirror MOCK_QUERY_RESPONSE; live path uses Fireworks.ai open models.

Used by: main.py
Depends on: data/demo/loader.py, query_response.json
"""

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from data.demo.loader import load_demo_json

router = APIRouter(tags=["query"])


class QueryRequest(BaseModel):
    """POST /query request body — matches frontend api.sendQuery."""

    question: str = Field(..., min_length=1, description="Natural-language question")


class QueryResponse(BaseModel):
    """Structured assistant response — matches MOCK_QUERY_RESPONSE shape."""

    type: str = "structured"
    content: str
    steps: list[str]
    related: dict[str, Any]


@router.post("/query", response_model=QueryResponse)
async def post_query(body: QueryRequest) -> QueryResponse:
    """
    Answer an operational intelligence question.
    Phase 1: mock template with question interpolated into content.
    Phase 4: Fireworks.ai chat completion + RAG context from ChromaDB/Neo4j.
    """
    # CODEX: replace this with real implementation (C3-05):
    #   - ChromaDB semantic search for relevant chunks
    #   - Neo4j graph context for entity relationships
    #   - from openai import OpenAI
    #   - from services.fireworks_config import fireworks_client_kwargs, get_fireworks_model
    #       client = OpenAI(**fireworks_client_kwargs())
    #       model = get_fireworks_model("query")  # llama-v3p1-70b (single-model setup)

    template = load_demo_json("query_response.json")
    content = (
        f'Based on your organization\'s operational data, here is what I found '
        f'regarding "{body.question}":'
    )

    return QueryResponse(
        type=template.get("type", "structured"),
        content=content,
        steps=template["steps"],
        related=template["related"],
    )
