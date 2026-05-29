# MemoryWeave — Project Status

## Last Updated
2026-05-29 (branch: `main`)

## Current Phase
Phase 6 — **Coral integration complete** on `main`  
Production demo: Vercel + Render + Neo4j Aura — submission-ready

## Coral integration
See **[CORAL_INTEGRATION.md](CORAL_INTEGRATION.md)** and **[CORAL_LOCAL.md](CORAL_LOCAL.md)**.

- [x] Coral source specs over Acme demo corpus (Slack JSONL, incidents JSONL, graph manifests / JSONL)
- [x] `coral_service.py` + `/coral-query`, `/coral-schema`, `/coral-report`, `/coral-mcp-config`
- [x] Assistant: Coral SQL primary (default on), auto-fallback to `/query`, SQL metadata on bubbles
- [x] Production Docker + Coral CLI install (`backend/Dockerfile`, `render.yaml`)
- [x] Boot-time Coral source registration (`services/coral_setup.py`, `CORAL_AUTO_SETUP`)
- [x] Judge-visible cross-source SQL demo (Reports **Live Cross-Source SQL** card + intent routing)
- [x] MCP + CLI documented (`docs/CORAL_LOCAL.md`, Settings MCP section, README Coral block)
- [x] Submission README Coral integration section + [CORAL-DEMO-SCRIPT.md](CORAL-DEMO-SCRIPT.md)

## What's Been Built
### Frontend
- [x] Vite + React 18 project (`frontend/`)
- [x] CSS design tokens + keyframes (`src/index.css`)
- [x] App.jsx route table (react-router-dom) — all 10 routes wired
- [x] Zustand store — full data state + async actions (`src/stores/appStore.js`)
- [x] **API service layer — live fetch** (`src/services/api.js` → production Render URL on Vercel)
- [x] mockData.js — fallback seed data when API unavailable
- [x] Icon, Badge, Button, StatCard atoms
- [x] DashboardShell, Sidebar, TopBar, Nav layout components
- [x] MiniKnowledgeGraph + DashboardPreview graph components
- [x] Full LandingPage.jsx — all 11 sections + 4 capability blocks
- [x] OverviewPage.jsx — fetches live stats, graph, risk on mount
- [x] GraphPage.jsx — fetches live graph on mount
- [x] RiskPage.jsx — fetches live risk report on mount
- [x] AssistantPage.jsx — Coral `/coral-query` primary, `/query` fallback, sample pills
- [x] SourcesPage.jsx — 8 source cards with status badges and stats
- [x] WorkflowsPage.jsx — Acme Corp workflow cards (hardcoded demo data)
- [x] ReportsPage.jsx — **Live Cross-Source SQL** card + `/coral-report` analytics
- [x] SettingsPage.jsx — `/coral-schema` + **MCP Integration** copy-paste config
- [x] `frontend/vercel.json` — SPA rewrites (Vercel Root Directory = `frontend`)
- [x] All navigation + routing verified end-to-end

### Backend
- [x] FastAPI skeleton with CORS (`backend/main.py`)
- [x] Demo seed JSON + Acme extraction corpus (50 Slack msgs, 3 incidents, 2 runbooks)
- [x] Fireworks.ai config (`fireworks_config.py`, default `kimi-k2p5`; live LLM synthesis)
- [x] Neo4j schema + seed script (`neo4j_service.py`, `data/seed.py` — 16 nodes)
- [x] ChromaDB service + populate script (`chroma_service.py`, `data/populate_chroma.py`)
- [x] **GET /graph → live Neo4j** (`routers/graph.py`)
- [x] **GET /stats → Neo4j node counts** (partial; some fields hardcoded)
- [x] **POST /ingest → background extraction pipeline** (`routers/ingest.py`, `agents/pipeline.py`)
- [x] **GET /risk-report → live Neo4j + NetworkX** (`services/risk_scorer.py`)
- [x] **POST /query → Chroma + Neo4j hybrid retrieval** (`services/retriever.py`, `routers/query.py`)
- [x] **Coral SQL layer** (`services/coral_service.py`, `routers/coral_query.py`)
- [x] Render deploy Docker + Coral CLI (`backend/Dockerfile`, `render.yaml`)
- [x] Production Chroma in-memory (`CHROMA_MODE=inmemory`, `CHROMA_STARTUP_POPULATE=false` on Render)

## What's In Progress
- None — hackathon submission polish only

## What's Next
1. Record 3-minute demo video (see [CORAL-DEMO-SCRIPT.md](CORAL-DEMO-SCRIPT.md))
2. Compute `/stats` undocumented/risk/query counters from live data
3. Optional: sync Coral JSONL after `/ingest` uploads
4. Automated tests

## Known Issues / Blockers
- `/stats` returns live Neo4j node count but `undocumented`, `risks`, `queries` are placeholder values.
- Render free tier cold start (~1–4 min idle); warm `/health` before demos.
- MCP `available: false` on Render (expected) — MCP for local Claude Desktop; production uses CLI `coral sql`.
- Graph Coral tables on Render use JSONL snapshots (Aura HTTP blocked); UI graph uses live Bolt.
- `npm run build` may hang on Node v25; use Node 20/22 LTS.

## API Endpoints Status
| Endpoint | Status | Frontend wired |
|----------|--------|----------------|
| GET /graph | **Live** | Yes — Overview, Graph |
| GET /stats | **Live** | Yes — Overview |
| GET /risk-report | **Live** | Yes — Overview, Risk |
| POST /query | **Live** | Yes — Assistant (fallback) |
| POST /coral-query | **Live** | Yes — Assistant (primary) |
| GET /coral-schema | **Live** | Yes — Settings |
| GET /coral-report | **Live** | Yes — Reports |
| GET /coral-mcp-config | **Live** | Yes — Settings |
| POST /ingest | **Live** | Yes — `ingestFile()` in api.js |

## Data Store Scripts
| Script | Status | Notes |
|--------|--------|-------|
| `python backend/data/seed.py` | Verified | 16 nodes (incl. P-3722) |
| `python backend/data/populate_chroma.py` | Verified | 58 chunks indexed |
| `bash backend/coral/install_sources.sh` | Verified | 4 Coral SQL tables |
| `python backend/data/export_coral_graph.py` | Verified | Regenerate graph JSONL |

## Environment
- Frontend: https://memory-weave-ai.vercel.app
- Backend: https://memoryweave-1.onrender.com
- Local frontend: http://localhost:5173 (`VITE_API_URL=http://127.0.0.1:8000`)
- Local backend: http://127.0.0.1:8000
- Neo4j Aura: production graph + risk
- ChromaDB: http://localhost:8001 (local) or in-memory (Render)
