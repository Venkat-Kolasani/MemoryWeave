# MemoryWeave

### The Digital Twin of Human Capital

> AI-powered organizational memory. Makes institutional knowledge queryable before it walks out the door.

**Live Demo:** [memory-weave-ai.vercel.app](https://memory-weave-ai.vercel.app)  
**API:** [memoryweave-r6r4.onrender.com](https://memoryweave-r6r4.onrender.com)  
**Logo (SVG):** [docs/assets/memoryweave-logo.svg](docs/assets/memoryweave-logo.svg) — for hackathon / social uploads

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
        github_issues table     (Live GitHub API or JSONL fallback)
  → Cross-source SQL JOINs → LLM query synthesis (/coral-query)
  → React frontend (Graph + Risk still read live Neo4j over Bolt)
```

Legacy path (fallback): `/query` → Neo4j Cypher + Chroma embeddings → manual merge → Fireworks.

---

## Coral Integration

MemoryWeave uses [Coral](https://withcoral.com) as its cross-source SQL retrieval layer.

Instead of separate API calls to Neo4j (Cypher), ChromaDB (embeddings), and file parsers that get merged manually inside the agent — MemoryWeave exposes **5 SQL tables** via Coral and runs **cross-source JOINs** from FastAPI.

### SQL Tables

| Table | Source Type | Contents |
|-------|-------------|----------|
| `knowledge_nodes` | Graph JSONL (Neo4j-aligned) | People, systems, incidents, workflows |
| `knowledge_edges` | Graph JSONL | OWNS, KNOWS, RESOLVES, AFFECTS relationships |
| `incident_reports` | Markdown → JSONL | P0/P1/P2 postmortem documents |
| `slack_messages` | JSON export | 50 operational Slack messages |
| `github_issues` | **Live GitHub API** (or JSONL fallback) | Issues/PRs from [Venkat-Kolasani/MemoryWeave](https://github.com/Venkat-Kolasani/MemoryWeave) |

With `GITHUB_TOKEN` set, Coral registers **`github.issues`** (live REST API) and **UNION**s it with **`memoryweave_demo.github_issues`** (demo supplement JSONL aligned to the Acme graph). Cross-join rows include `issue_source`: `live_github_api` vs `demo_supplement`. Without a token, only the JSONL supplement is used.

On **Render**, graph tables are served from JSONL snapshots (`backend/coral/data/`) aligned with the same Acme seed as Aura. **Graph** and **Risk** pages still query live Neo4j over Bolt.

### The Cross-Source JOIN

```sql
-- One query. Three source types. Coral handles everything below.
SELECT n.name, n.team, e.rel_type, e.to_name, e.weight
FROM knowledge_nodes n          -- Neo4j AuraDB
JOIN knowledge_edges e          -- Neo4j AuraDB
  ON n.id = e.from_id
WHERE n.type = 'Person'
ORDER BY e.weight DESC
```

See the **Live Cross-Source SQL** card on the [Reports](https://memory-weave-ai.vercel.app/reports) page for this query with live result rows.

### Coral Features Used

| Feature | How MemoryWeave uses it |
|---------|-------------------------|
| SQL over graph database | `knowledge_nodes` + `knowledge_edges` from Neo4j |
| SQL over Markdown files | `incident_reports` from demo postmortems |
| SQL over JSON files | `slack_messages` from Slack export |
| SQL over GitHub API | `github.issues` for MemoryWeave repo (when `GITHUB_TOKEN` set) |
| Cross-source JOIN | Graph + incidents + Slack + **GitHub** in `/coral-report` and `/coral-query` |
| Schema learning | Automatic column detection on first query per source |
| Caching | 300s TTL on repeated Coral queries |
| CLI integration | `coral sql` via subprocess in `coral_service.py` |
| MCP server | `coral mcp` config on [Settings](https://memory-weave-ai.vercel.app/settings) |

### API Endpoints (Coral-powered)

| Endpoint | Description |
|----------|-------------|
| `POST /coral-query` | Natural language → SQL → structured answer |
| `GET /coral-schema` | Schema catalog of all 5 registered tables (+ `github_mode`) |
| `GET /coral-report` | Full cross-source analytics (bus factor, team concentration, incident chains) |
| `GET /coral-mcp-config` | MCP server config for Claude Desktop integration |

### How to reproduce locally

See **[docs/CORAL_LOCAL.md](docs/CORAL_LOCAL.md)** for full setup.

Quick start:

```bash
brew install withcoral/tap/coral      # macOS
# or: see docs/CORAL_LOCAL.md for Linux / Docker
coral --version                       # verify install
cd backend
export NEO4J_URI=... NEO4J_USER=... NEO4J_PASSWORD=...
export GITHUB_TOKEN=ghp_...           # optional — enables live github.issues
bash coral/install_sources.sh         # register all 5 sources
coral sql --format table "SELECT schema_name, table_name FROM coral.tables WHERE table_name IN ('knowledge_nodes','knowledge_edges','incident_reports','slack_messages','github_issues','issues')"
```

---

## Tech Stack

| Layer | Stack |
|--------|--------|
| **Frontend** | React 18, Vite, React Router, Zustand, custom SVG knowledge graph |
| **Backend** | FastAPI, Python 3.11+, Fireworks.ai (`kimi-k2p5` default) |
| **Data** | Neo4j, ChromaDB, NetworkX (bus-factor / risk scoring), **Coral SQL** (cross-source reads) |
| **Infra** | Docker Compose (local Neo4j), Vercel + Render (production) |

---

## Key Features

1. **Knowledge Graph** — interactive SVG: people, systems, workflows, incidents (pan/zoom)
2. **Dependency Risk** — bus-factor scoring and risk inventory (live Neo4j)
3. **AI Assistant** — Coral SQL JOIN + Fireworks grounding (`/coral-query`); `/query` fallback
4. **Reports** — Live Cross-Source SQL demo + Coral analytics (bus factor, incidents, teams)
5. **Settings** — Coral SQL catalog, JOIN examples, and **MCP** copy-paste config
6. **Extraction Pipeline** — 3-pass LLM ingest from Slack, incidents, runbooks
7. **Workflows** — operational procedures with documentation status (demo data)

---

## Docs

- [CORAL_LOCAL.md](docs/CORAL_LOCAL.md) — **local Coral CLI + MCP reproduction**
- [CORAL-DEMO-SCRIPT.md](docs/CORAL-DEMO-SCRIPT.md) — **3-minute judge demo script**
- [CORAL_LOCAL.md](docs/CORAL_LOCAL.md) — Coral setup and reproduction
- [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) — build log and API status
- [FIXES_AND_LEARNINGS.md](docs/FIXES_AND_LEARNINGS.md) — debugging notes
- [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) — local dev guide
- [DEPLOY.md](docs/DEPLOY.md) — Render + Vercel production deploy
