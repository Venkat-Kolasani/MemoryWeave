# MemoryWeave

### The Digital Twin of Human Capital

> AI-powered organizational memory. Makes institutional knowledge queryable before it walks out the door.

**Live Demo:** [memory-weave-ai.vercel.app](https://memory-weave-ai.vercel.app)  
**API:** [memoryweave.onrender.com](https://memoryweave.onrender.com)

Deploy guide: **[docs/DEPLOY.md](docs/DEPLOY.md)**

---

## The Problem

When experienced engineers leave, teams lose critical workflows, incident recovery procedures, and operational context that took years to build. Existing tools store documents but cannot reconstruct how your organization actually functions.

## Demo Scenario: The Patel Problem

Acme Corp — 20-person SaaS startup. **A. Patel** (Engineering Lead) has resolved **8 of 12** P0 payment incidents and holds a **95% bus factor** on the payment service.

**MemoryWeave answers:** *"What breaks when Patel doesn't come in Monday?"*

Try it on the **Assistant** page after seeding, or explore the **Knowledge Graph** and **Risk** views.

---

## Quick Start (local)

```bash
cp backend/.env.example backend/.env   # FIREWORKS_API_KEY, Neo4j credentials
cp frontend/.env.example frontend/.env # VITE_API_URL=http://127.0.0.1:8000

docker compose up -d neo4j
chroma run --path ./chroma_data --port 8001   # separate terminal

cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python data/seed.py              # Acme graph: 15 nodes, 21 edges
python data/populate_chroma.py   # 58 knowledge chunks

uvicorn main:app --reload --host 127.0.0.1 --port 8000

cd ../frontend && npm i && npm run dev   # http://localhost:5173
```

Full setup (Fireworks model selection, port conflicts): **[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)**

---

## Architecture

```
Input (Slack / GitHub / Incidents / Docs)
  → POST /ingest
  → 3-Pass LLM Extraction (Fireworks.ai)
      Pass 1: entity extraction per chunk
      Pass 2: relationship inference across chunks
      Pass 3: knowledge compression for top entities
  → Neo4j (knowledge graph) + ChromaDB (vector search)
  → Hybrid retrieval (semantic + graph)
  → LLM query synthesis
  → React frontend
```

---

## Tech Stack

| Layer | Stack |
|--------|--------|
| **Frontend** | React 18, Vite, React Router, Zustand, custom SVG knowledge graph |
| **Backend** | FastAPI, Python 3.11+, Fireworks.ai (`kimi-k2p5` default) |
| **Data** | Neo4j, ChromaDB, NetworkX (bus-factor / risk scoring) |
| **Infra** | Docker Compose (local Neo4j), Vercel + Render (production) |

---

## Key Features

1. **Knowledge Graph** — interactive SVG: people, systems, workflows, incidents (pan/zoom)
2. **Dependency Risk** — bus-factor scoring and risk inventory
3. **AI Assistant** — natural-language queries grounded in org history
4. **Extraction Pipeline** — 3-pass LLM ingest from Slack, incidents, runbooks
5. **Workflows** — operational procedures with documentation status (demo data)

---

## Docs

- [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) — build log and API status
- [FIXES_AND_LEARNINGS.md](docs/FIXES_AND_LEARNINGS.md) — debugging notes
- [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) — local dev guide
- [DEPLOY.md](docs/DEPLOY.md) — Render + Vercel production deploy
- [CORAL_INTEGRATION.md](docs/CORAL_INTEGRATION.md) — Coral hackathon integration (branch `Coral-integration`)


