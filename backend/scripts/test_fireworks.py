"""
test_fireworks.py — one-shot Fireworks connectivity diagnostic.

Run from repo root:
  cd backend && source .venv/bin/activate && python scripts/test_fireworks.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(ENV_PATH, override=True)


def _key_from_env_file() -> str:
    """Read FIREWORKS_API_KEY directly from backend/.env (ignores stale shell env)."""
    if not ENV_PATH.is_file():
        return ""
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("FIREWORKS_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def main() -> int:
    file_key = _key_from_env_file()
    api_key = os.getenv("FIREWORKS_API_KEY")
    base_url = os.getenv("FIREWORKS_BASE_URL", "https://api.fireworks.ai/inference/v1")
    model = os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/kimi-k2p5")

    if file_key and file_key != api_key:
        print(
            "WARNING: backend/.env on disk differs from loaded env. "
            "Save the file in your editor (Cmd+S), then re-run."
        )
        api_key = file_key
        os.environ["FIREWORKS_API_KEY"] = file_key

    if not api_key:
        print("FIREWORKS_API_KEY is not set — check backend/.env")
        return 1

    if len(api_key.strip()) < 20:
        print(
            f"FIREWORKS_API_KEY is only {len(api_key.strip())} characters — "
            "paste the full key from https://fireworks.ai/account/api-keys"
        )
        return 1

    print(f"Model: {model}")
    client = OpenAI(api_key=api_key, base_url=base_url)
    messages = [{"role": "user", "content": "Reply with JSON: {\"ok\": true}"}]
    failed = False

    for label, kwargs in [
        ("with_json_format", {"response_format": {"type": "json_object"}}),
        ("plain", {}),
    ]:
        try:
            resp = client.chat.completions.create(
                model=model,
                max_tokens=64,
                messages=messages,
                **kwargs,
            )
            content = (resp.choices[0].message.content or "")[:120]
            print(f"OK [{label}]: {content}")
        except Exception as exc:
            failed = True
            status = getattr(exc, "status_code", None)
            print(f"FAIL [{label}] status={status}: {exc}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
