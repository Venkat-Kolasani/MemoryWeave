"""
fireworks_config.py

Central Fireworks.ai configuration — single-model default for hackathon credit limits.
Uses serverless kimi-k2p5 by default (override via FIREWORKS_MODEL in .env).

Used by: agents/ (Codex), routers/query.py, routers/ingest.py
Depends on: FIREWORKS_* env vars from .env
"""

import os
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv

_BACKEND_ENV = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(_BACKEND_ENV, override=True)

# Default serverless model — must exist on your Fireworks account (list via GET /inference/v1/models).
# Llama 3.1 70B is not available on all accounts; kimi-k2p5 is a reliable serverless fallback.
DEFAULT_MODEL = "accounts/fireworks/models/kimi-k2p5"
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


def validate_fireworks_api_key(api_key: Optional[str] = None) -> str:
    """
    Ensure FIREWORKS_API_KEY looks like a real dashboard key.

    Fireworks returns 404 "Model not found" for some invalid keys — not 401 —
    which is easy to misread as a model ID problem.
    """
    key = (api_key or get_fireworks_api_key() or "").strip()
    if not key:
        raise ValueError(
            "FIREWORKS_API_KEY is not set. Add your full key to backend/.env "
            "(from https://fireworks.ai/account/api-keys)."
        )
    if len(key) < 20:
        raise ValueError(
            f"FIREWORKS_API_KEY looks too short ({len(key)} chars). "
            "Paste the full key from the Fireworks dashboard — not a placeholder."
        )
    return key


def fireworks_client_kwargs() -> dict:
    """
    Kwargs for OpenAI client pointed at Fireworks.

    Usage (Codex):
        from openai import OpenAI
        client = OpenAI(**fireworks_client_kwargs())
        model = get_fireworks_model("query")
    """
    api_key = validate_fireworks_api_key()

    return {
        "api_key": api_key,
        "base_url": get_fireworks_base_url(),
    }
