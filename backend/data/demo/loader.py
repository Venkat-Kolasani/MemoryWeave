"""
loader.py

Loads JSON seed files from data/demo/ for mock API responses.
Mirrors frontend/src/data/mockData.js shapes exactly.

Used by: routers/graph.py, routers/risk.py, routers/query.py
"""

import json
from pathlib import Path
from typing import Any

DEMO_DIR = Path(__file__).parent


def load_demo_json(filename: str) -> Any:
    """Load and parse a JSON file from the demo data directory."""
    path = DEMO_DIR / filename
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)
