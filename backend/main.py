"""
main.py

MemoryWeave FastAPI backend entry point.
All route handlers return hardcoded mock data until Codex tasks run.
CORS enabled for all origins (hackathon only — lock down for production).

Used by: uvicorn (e.g. uvicorn main:app --reload --port 8000)
Depends on: routers/graph, risk, query, ingest
"""

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import graph, ingest, query, risk

load_dotenv()

app = FastAPI(
    title="MemoryWeave API",
    description="Organizational memory and operational intelligence platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(risk.router)
app.include_router(query.router)
app.include_router(ingest.router)


@app.on_event("startup")
async def on_startup() -> None:
    """Log startup — visible when running uvicorn."""
    print("MemoryWeave backend starting...")


@app.get("/")
async def root() -> dict[str, str]:
    """Health check and service metadata."""
    return {"status": "ok", "version": "1.0.0", "service": "MemoryWeave"}
