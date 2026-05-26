"""
fireworks_config.py

Central Fireworks.ai configuration — single-model default for hackathon credit limits.
Uses llama-v3p1-70b-instruct for extraction (C3-03) and query (C3-05).

Used by: agents/ (Codex), routers/query.py, routers/ingest.py
Depends on: FIREWORKS_* env vars from .env
"""

import os
from typing import Literal, Optional

# Default open model — extraction + query share this to conserve credits
DEFAULT_MODEL = "accounts/fireworks/models/llama-v3p1-70b-instruct"
DEFAULT_BASE_URL = "https://api.fireworks.ai/inference/v1"

ModelPurpose = Literal["extraction", "query", "default"]


def get_fireworks_model(purpose: ModelPurpose = "default") -> str:
    """
    Resolve Fireworks model id for a given purpose.

    Single-model setup: set FIREWORKS_MODEL once; extraction and query both use it
    unless FIREWORKS_MODEL_EXTRACTION / FIREWORKS_MODEL_QUERY are explicitly set.
    """
    primary = os.getenv("FIREWORKS_MODEL", DEFAULT_MODEL)

    if purpose == "extraction":
        return os.getenv("FIREWORKS_MODEL_EXTRACTION", primary)
    if purpose == "query":
        return os.getenv("FIREWORKS_MODEL_QUERY", primary)
    return primary


def get_fireworks_base_url() -> str:
    """Fireworks OpenAI-compatible API base URL."""
    return os.getenv("FIREWORKS_BASE_URL", DEFAULT_BASE_URL)


def get_fireworks_api_key() -> Optional[str]:
    """API key from environment; None if not configured."""
    return os.getenv("FIREWORKS_API_KEY")


def fireworks_client_kwargs() -> dict:
    """
    Kwargs for OpenAI client pointed at Fireworks.

    Usage (Codex):
        from openai import OpenAI
        client = OpenAI(**fireworks_client_kwargs())
        model = get_fireworks_model("query")
    """
    api_key = get_fireworks_api_key()
    if not api_key:
        raise ValueError("FIREWORKS_API_KEY is not set")

    return {
        "api_key": api_key,
        "base_url": get_fireworks_base_url(),
    }
