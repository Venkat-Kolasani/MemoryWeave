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

## 5. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

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
