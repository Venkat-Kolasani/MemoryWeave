# MemoryWeave — Local Development Setup

## Prerequisites

- Docker Desktop (for Neo4j)
- Python 3.9+ with `backend/.venv`

## 1. Backend Python environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add FIREWORKS_API_KEY
```

## 2. Neo4j

**Start (new install):**

```bash
# From repo root
docker compose up -d neo4j
```

**Or use existing container:**

```bash
docker start memoryweave-neo4j
```

- Browser: http://localhost:7474
- Bolt: `bolt://localhost:7687`
- Credentials: `neo4j` / `memoryweave` (see `backend/.env`)

**Seed the Acme Corp graph:**

```bash
python backend/data/seed.py
```

Expected: 15 nodes, 21 relationships, A. Patel with the highest risk score.

> If auth fails with `Unauthorized`, your container may have been created with a different password. Connect with the old password and run:
> `ALTER USER neo4j SET PASSWORD 'memoryweave' CHANGE NOT REQUIRED`

## 3. ChromaDB

**Start server (separate terminal):**

```bash
chroma run --host localhost --port 8001 --path ./.chroma-memoryweave
```

Or with project venv:

```bash
backend/.venv/bin/chroma run --host localhost --port 8001 --path ./.chroma-memoryweave
```

**Index demo corpus:**

```bash
python backend/data/populate_chroma.py
```

Expected: `Indexed 58 chunks` and `Search test passed`.

## 4. FastAPI backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Health check: http://localhost:8000/

Live endpoints (as of 2026-05-28):
- `GET /graph` — Neo4j (requires seeded graph)
- `GET /stats` — Neo4j node count
- `POST /ingest` — Fireworks extraction → Neo4j + Chroma (requires `FIREWORKS_API_KEY`, Chroma running)
- `GET /risk-report` — Neo4j + NetworkX bus-factor scoring
- `POST /query` — Chroma semantic search + Neo4j graph context + Fireworks synthesis path

Test graph: `curl http://localhost:8000/graph | python -m json.tool | head`
Test risk report: `curl http://localhost:8000/risk-report | python -m json.tool`
Test query:

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question":"How do we recover payment service failures?"}' \
  | python -m json.tool
```

> If Fireworks returns `Model not found`, `Unauthorized`, or another provider error, `/query` returns a grounded retrieval fallback for the demo questions. Fix `FIREWORKS_API_KEY` / model access before treating LLM synthesis as production-ready.

## 5. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

App: http://localhost:5173 — dashboard pages fetch live data from the backend on mount.

**End-to-end check:**
1. http://localhost:5173/graph — Neo4j nodes (15 after seed)
2. http://localhost:5173/risk — Payment API / A. Patel critical risk
3. http://localhost:5173/assistant — ask "How do we recover payment failures?"
4. http://localhost:5173/dashboard — live node count in stats

## Quick reference

| Service   | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:5173    |
| Backend   | http://localhost:8000    |
| Neo4j UI  | http://localhost:7474    |
| Chroma    | http://localhost:8001    |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Docker not running | Open Docker Desktop, wait for daemon, `docker compose up -d neo4j` |
| Neo4j auth error | Align `NEO4J_PASSWORD` in `backend/.env` with container (`docker inspect memoryweave-neo4j \| grep NEO4J_AUTH`) |
| Chroma connection refused | Start `chroma run` on port 8001 before `populate_chroma.py` |
| `ModuleNotFoundError: services` | Run scripts from repo root or ensure `backend/` is on `PYTHONPATH` |
