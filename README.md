# MemoryWeave

### The Digital Twin of Human Capital

> AI-powered organizational memory. Makes institutional knowledge queryable before it walks out the door.

**Live Demo:** [memory-weave-ai.vercel.app](https://memory-weave-ai.vercel.app)  
**API:** [memoryweave-1.onrender.com](https://memoryweave-1.onrender.com)

Deploy guide: **[docs/DEPLOY.md](docs/DEPLOY.md)**

---

## The Problem

When experienced engineers leave, teams lose critical workflows, incident recovery procedures, and operational context that took years to build. Existing tools store documents but cannot reconstruct how your organization actually functions.

## Demo Scenario: The Patel Problem

Acme Corp — 20-person SaaS startup. **A. Patel** (Engineering Lead) has resolved **8 of 12** P0 payment incidents and holds a **95% bus factor** on the payment service.

**MemoryWeave answers:** *"What breaks when Patel doesn't come in Monday?"*

Try it on the **Assistant** page (Coral SQL mode on by default), or explore the **Knowledge Graph**, **Reports**, and **Risk** views.

---

## Quick Start (local)

```bash
cp backend/.env.example backend/.env   # FIREWORKS_API_KEY, Neo4j credentials
cp frontend/.env.example frontend/.env # VITE_API_URL=http://127.0.0.1:8000

docker compose up -d neo4j
chroma run --path ./chroma_data --port 8001   # separate terminal

# Coral CLI (required for /coral-query, /coral-report, /coral-schema)
brew install withcoral/tap/coral
# or: curl -fsSL https://withcoral.com/install.sh | sh

cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python data/seed.py              # Acme graph → Neo4j (16 nodes)
python data/populate_chroma.py   # 58 knowledge chunks
bash coral/install_sources.sh    # Register 4 Coral SQL tables

uvicorn main:app --reload --host 127.0.0.1 --port 8000

cd ../frontend && npm i && npm run dev   # http://localhost:5173
```

Verify Coral tables:

```bash
cd backend
coral sql --format table "SELECT schema_name, table_name FROM coral.tables WHERE schema_name IN ('memoryweave_graph','memoryweave_demo') ORDER BY 1, 2"
```

Full setup (Fireworks model selection, port conflicts): **[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)**

---

## Architecture

```
Input (Slack / GitHub / Incidents / Docs)
  → POST /ingest
  → 3-Pass LLM Extraction (Fireworks llama-v3p1-70b-instruct)
  → Neo4j (knowledge graph) + ChromaDB (vector search)
  → Coral SQL Layer
        knowledge_nodes table   (graph — JSONL snapshot / Neo4j-aligned)
        knowledge_edges table   (relationships)
        incident_reports table  (Markdown postmortems → JSONL)
        slack_messages table    (Slack JSON export)
  → Cross-source SQL JOINs → LLM query synthesis (/coral-query)
  → React frontend (Graph + Risk still read live Neo4j over Bolt)
```

Legacy path (fallback): `/query` → Neo4j Cypher + Chroma embeddings → manual merge → Fireworks.

---

## Tech Stack

| Layer | Stack |
|--------|--------|
| **Frontend** | React 18, Vite, React Router, Zustand, custom SVG knowledge graph |
| **Backend** | FastAPI, Python 3.11+, Fireworks.ai (`kimi-k2p5` default) |
| **Data** | Neo4j, ChromaDB, NetworkX (bus-factor / risk scoring), **Coral SQL** (cross-source reads) |
| **Infra** | Docker Compose (local Neo4j), Vercel + Render (production) |

---

## Coral SQL Integration

MemoryWeave uses [Coral](https://github.com/coraldata/coral) as the data retrieval layer for its AI agent. Instead of querying Neo4j and ChromaDB separately and merging responses manually, Coral provides a single SQL interface across all sources.

### Registered SQL Tables

| Table | Source | Description |
|-------|--------|-------------|
| `memoryweave_graph.knowledge_nodes` | Graph snapshot (Acme seed, Neo4j-aligned) | People, systems, incidents, workflows |
| `memoryweave_graph.knowledge_edges` | Graph snapshot | OWNS, KNOWS, RESOLVES, AFFECTS, BACKUP_FOR relationships |
| `memoryweave_demo.incident_reports` | Markdown → JSONL | P0/P1 postmortem documents (P-4021, P-3882, P-3722) |
| `memoryweave_demo.slack_messages` | JSON export | 50+ operational Slack messages |

On **Render**, graph tables are served from packaged JSONL under `backend/coral/data/` (same Acme Corp seed as Neo4j Aura). The **Knowledge Graph** and **Risk** UI still query **live Neo4j** over Bolt; Coral SQL is the read layer for Assistant, Reports, and Settings.

### How Coral Powers MemoryWeave

**Before Coral:** `/query` called Neo4j (Cypher) + ChromaDB (embeddings) separately, merged results manually, and sent large raw chunks to the LLM context window.

**After Coral:** `/coral-query` runs a single SQL JOIN across all four tables. Coral handles auth, pagination, rate limits, and schema learning internally. Results are structured rows — not raw text blobs — then **Fireworks** synthesizes the natural-language answer.

```sql
-- Example: person → system ownership (powers risk / bus-factor analysis)
SELECT n.name, e.rel_type, e.to_name, e.weight
FROM memoryweave_graph.knowledge_nodes n
JOIN memoryweave_graph.knowledge_edges e ON n.id = e.from_id
WHERE n.type = 'Person'
ORDER BY e.weight DESC
```

### Coral Features Used

- SQL interface over graph nodes and edges (packaged JSONL; Neo4j HTTP when configured locally)
- SQL interface over Markdown-derived incident reports
- SQL interface over JSON Slack exports
- Cross-source JOIN across graph + incidents + Slack
- Schema learning (automatic column detection via `coral.tables` / manifests)
- Caching (Coral internal TTL on repeated queries)
- CLI integration via subprocess in FastAPI (`backend/services/coral_service.py`)

---

## Key Features

1. **Knowledge Graph** — interactive SVG: people, systems, workflows, incidents (pan/zoom)
2. **Dependency Risk** — bus-factor scoring and risk inventory (live Neo4j)
3. **AI Assistant** — Coral SQL JOIN + Fireworks grounding (`/coral-query`); `/query` fallback
4. **Reports** — Coral analytics: bus factor, team concentration, incident chains, workflows
5. **Settings** — Coral catalog: registered SQL tables and cross-source JOIN examples
6. **Extraction Pipeline** — 3-pass LLM ingest from Slack, incidents, runbooks
7. **Workflows** — operational procedures with documentation status (demo data)

---

## Docs

- [CORAL-DEMO-SCRIPT.md](docs/CORAL-DEMO-SCRIPT.md) — **3-minute judge demo script**
- [CORAL_INTEGRATION.md](docs/CORAL_INTEGRATION.md) — architecture and integration notes
- [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) — build log and API status
- [FIXES_AND_LEARNINGS.md](docs/FIXES_AND_LEARNINGS.md) — debugging notes
- [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) — local dev guide
- [DEPLOY.md](docs/DEPLOY.md) — Render + Vercel production deploy
