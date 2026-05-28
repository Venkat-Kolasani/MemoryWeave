"""
main.py

MemoryWeave FastAPI backend entry point.
CORS enabled for hackathon demo (set ALLOWED_ORIGINS for production Vercel URL).

Used by: uvicorn (e.g. uvicorn main:app --reload --port 8000)
Depends on: routers/graph, risk, query, ingest
"""

import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(_BACKEND_DIR / ".env", override=True)

from routers import graph, ingest, query, risk
from routers.coral_query import router as coral_router

app = FastAPI(
    title="MemoryWeave API",
    description="Organizational memory and operational intelligence platform",
    version="1.0.0",
)

DEFAULT_ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://memory-weave-ai.vercel.app",
}

_allowed = os.getenv("ALLOWED_ORIGINS", "").strip()
if _allowed == "*":
    _cors_origins = ["*"]
    _cors_allow_credentials = False
else:
    configured_origins = {o.strip() for o in _allowed.split(",") if o.strip()}
    _cors_origins = sorted(DEFAULT_ALLOWED_ORIGINS | configured_origins)
    _cors_allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(risk.router)
app.include_router(query.router)
app.include_router(ingest.router)
app.include_router(coral_router)


def _neo4j_env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


def _verify_neo4j_on_startup() -> None:
    """Log Neo4j connectivity (no secrets). Helps debug Render vs local .env mismatches."""
    uri = _neo4j_env("NEO4J_URI", "bolt://localhost:7687")
    from services.neo4j_service import neo4j_username

    user = neo4j_username()
    password = _neo4j_env("NEO4J_PASSWORD", "memoryweave")

    host = urlparse(uri).hostname or uri
    print(f"[neo4j] URI host={host} user={user} password_len={len(password)}")

    try:
        from services.neo4j_service import Neo4jService

        neo4j = Neo4jService()
        neo4j.driver.verify_connectivity()
        with neo4j.driver.session() as session:
            count = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        neo4j.close()
        print(f"[neo4j] Connected OK — {count} nodes in database")
    except Exception as exc:
        print(f"[neo4j] Connection FAILED: {exc}")


def _ensure_chroma_seeded() -> None:
    """
    Populate in-memory Chroma on first boot.
    Disabled when CHROMA_STARTUP_POPULATE=false (required on Render free 512MB —
    onnx model download during startup causes OOM).
    """
    if _neo4j_env("CHROMA_STARTUP_POPULATE", "true").lower() in {"0", "false", "no"}:
        print("[chroma] Startup populate disabled (CHROMA_STARTUP_POPULATE=false)")
        return

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


def _ensure_coral_on_startup() -> None:
    """Register Coral SQL sources and cache health status (no SQL on /health)."""
    try:
        from services.coral_setup import ensure_coral_sources
        from services.coral_service import probe_coral_health

        result = ensure_coral_sources()
        print(f"[coral] setup {result.get('status')}: {result.get('reason', result.get('detail', ''))}")
        status = probe_coral_health(run_sql_smoke_test=False)
        print(f"[coral] health probe: {status}")
    except Exception as exc:
        print(f"[coral] setup skipped or failed: {exc}")


@app.on_event("startup")
async def on_startup() -> None:
    """Log startup, verify Neo4j, optionally seed Chroma, register Coral sources."""
    print("MemoryWeave backend starting...")
    _verify_neo4j_on_startup()
    _ensure_chroma_seeded()
    _ensure_coral_on_startup()


@app.get("/")
async def root() -> dict[str, str]:
    """Health check and service metadata."""
    return {"status": "ok", "version": "1.0.0", "service": "MemoryWeave"}


@app.get("/health")
async def health() -> dict:
    """Extended health — Neo4j node count and Chroma chunk count (no secrets)."""
    neo4j_status = "error"
    node_count = 0
    chroma_count = 0

    try:
        from services.neo4j_service import Neo4jService

        neo4j = Neo4jService()
        neo4j.driver.verify_connectivity()
        with neo4j.driver.session() as session:
            node_count = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        neo4j.close()
        neo4j_status = "ok"
    except Exception as exc:
        neo4j_status = f"error: {exc}"

    try:
        from services.chroma_service import ChromaService

        chroma = ChromaService()
        chroma_count = chroma.collection.count()
    except Exception:
        pass

    from services.coral_service import get_coral_health_status

    return {
        "status": "ok",
        "neo4j": neo4j_status,
        "neo4j_nodes": node_count,
        "chroma_chunks": chroma_count,
        "chroma_startup_populate": _neo4j_env("CHROMA_STARTUP_POPULATE", "true"),
        "coral": get_coral_health_status(),
    }


@app.get("/health/deep")
async def health_deep() -> dict:
    """Deep health — Coral SQL smoke test in a thread (slow; not for liveness probes)."""
    import asyncio
    from functools import partial

    from services.coral_service import get_coral_health_status, probe_coral_health

    loop = asyncio.get_running_loop()
    coral_status = await loop.run_in_executor(
        None,
        partial(probe_coral_health, run_sql_smoke_test=True),
    )

    return {
        "status": "ok",
        "coral": coral_status,
        "coral_cached": get_coral_health_status(),
    }
