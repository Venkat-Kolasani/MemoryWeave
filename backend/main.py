"""
main.py

MemoryWeave FastAPI backend entry point.
CORS enabled for hackathon demo (set ALLOWED_ORIGINS for production Vercel URL).

Used by: uvicorn (e.g. uvicorn main:app --reload --port 8000)
Depends on: routers/graph, risk, query, ingest
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(_BACKEND_DIR / ".env", override=True)

from routers import graph, ingest, query, risk

app = FastAPI(
    title="MemoryWeave API",
    description="Organizational memory and operational intelligence platform",
    version="1.0.0",
)

_allowed = os.getenv("ALLOWED_ORIGINS", "*").strip()
_cors_origins = ["*"] if _allowed == "*" else [o.strip() for o in _allowed.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(risk.router)
app.include_router(query.router)
app.include_router(ingest.router)


def _ensure_chroma_seeded() -> None:
    """Populate in-memory Chroma on first boot (Render) or empty collection."""
    try:
        from data.populate_chroma import populate
        from services.chroma_service import ChromaService

        chroma = ChromaService()
        if chroma.collection.count() > 0:
            print(f"[chroma] Collection ready ({chroma.collection.count()} chunks)")
            return

        print("[chroma] Populating ChromaDB with demo data...")
        counts = populate(chroma)
        print(f"[chroma] Indexed {counts['total']} chunks")
    except Exception as exc:
        print(f"[chroma] Startup populate skipped or failed: {exc}")


@app.on_event("startup")
async def on_startup() -> None:
    """Log startup and seed Chroma when empty (in-memory production mode)."""
    print("MemoryWeave backend starting...")
    _ensure_chroma_seeded()


@app.get("/")
async def root() -> dict[str, str]:
    """Health check and service metadata."""
    return {"status": "ok", "version": "1.0.0", "service": "MemoryWeave"}
