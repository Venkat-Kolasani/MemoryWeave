# MemoryWeave — Project Status

## Last Updated
2026-05-28

## Current Phase
Phase 4 — Frontend wired to live backend

## What's Been Built
### Frontend
- [x] Vite + React 18 project (`frontend/`)
- [x] CSS design tokens + keyframes (`src/index.css`)
- [x] App.jsx route table (react-router-dom) — all 10 routes wired
- [x] Zustand store — full data state + async actions (`src/stores/appStore.js`)
- [x] **API service layer — live fetch** (`src/services/api.js` → `http://localhost:8000`)
- [x] mockData.js — fallback seed data when API unavailable
- [x] Icon, Badge, Button, StatCard atoms
- [x] DashboardShell, Sidebar, TopBar, Nav layout components
- [x] MiniKnowledgeGraph + DashboardPreview graph components
- [x] Full LandingPage.jsx — all 11 sections + 4 capability blocks
- [x] OverviewPage.jsx — fetches live stats, graph, risk on mount
- [x] GraphPage.jsx — fetches live graph on mount
- [x] RiskPage.jsx — fetches live risk report on mount
- [x] AssistantPage.jsx — chat UI with live `/query` + error fallback
- [x] SourcesPage.jsx — 8 source cards with status badges and stats
- [x] WorkflowsPage, ReportsPage, SettingsPage — DashboardShell placeholders
- [x] All navigation + routing verified end-to-end

### Backend
- [x] FastAPI skeleton with CORS (`backend/main.py`)
- [x] Demo seed JSON + Acme extraction corpus (50 Slack msgs, 3 incidents, 2 runbooks)
- [x] Fireworks.ai single-model config (`services/fireworks_config.py`, llama-v3p1-70b)
- [x] Neo4j schema + seed script (`neo4j_service.py`, `data/seed.py`)
- [x] ChromaDB service + populate script (`chroma_service.py`, `data/populate_chroma.py`)
- [x] **GET /graph → live Neo4j** (`routers/graph.py`)
- [x] **GET /stats → Neo4j node counts** (partial; some fields hardcoded)
- [x] **POST /ingest → background extraction pipeline** (`routers/ingest.py`, `agents/pipeline.py`)
- [x] **GET /risk-report → live Neo4j + NetworkX** (`services/risk_scorer.py`)
- [x] **POST /query → Chroma + Neo4j hybrid retrieval** (`services/retriever.py`, `routers/query.py`)

## What's In Progress
- Fix Fireworks API model/key for full LLM synthesis (fallback works for demo)
- Compute `/stats` undocumented/risk/query counters from live data
- Production deploy + Loom demo

## What's Next
1. Fix Fireworks credentials/model access
2. WorkflowsPage full implementation
3. Deploy (Vercel + Railway)
4. Node LTS build verification (`npm run build`)
5. Automated tests

## Known Issues / Blockers
- `/stats` returns live Neo4j node count but `undocumented`, `risks`, `queries` are placeholder values.
- `/ingest` requires Neo4j + Chroma + `FIREWORKS_API_KEY`; runs as background task.
- Chroma server must be running (`chroma run --port 8001`) for `/query` and ingest indexing.
- Fireworks may return 404 for configured model — `/query` uses grounded retrieval fallback.
- `npm run build` may hang on Node v25; use Node 20/22 LTS.

## API Endpoints Status
| Endpoint | Status | Frontend wired |
|----------------|-------------|----------------|
| GET /graph | **Live** | Yes — Overview, Graph |
| GET /stats | **Live** | Yes — Overview |
| GET /risk-report | **Live** | Yes — Overview, Risk |
| POST /query | **Live** | Yes — Assistant |
| POST /ingest | **Live** | Yes — `ingestFile()` in api.js |

## Data Store Scripts
| Script | Status | Notes |
|----------------|-------------|------------------------|
| `python backend/data/seed.py` | Verified | 15 nodes, 21 relationships |
| `python backend/data/populate_chroma.py` | Verified | 58 chunks indexed |

## Environment
- Frontend: http://localhost:5173 (`VITE_API_URL=http://localhost:8000`)
- Backend: http://localhost:8000
- Neo4j: http://localhost:7474
- ChromaDB: http://localhost:8001
