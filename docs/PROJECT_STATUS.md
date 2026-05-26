# MemoryWeave — Project Status

## Last Updated
2026-05-26

## Current Phase
Phase 3 — Backend data stores implemented (routes still mock-backed)

## What's Been Built
### Frontend
- [x] Vite + React 18 project (`frontend/`)
- [x] CSS design tokens + keyframes (`src/index.css`)
- [x] App.jsx route table (react-router-dom) — all 10 routes wired
- [x] Zustand store — full data state + async actions (`src/stores/appStore.js`)
- [x] API service layer with mocks (`src/services/api.js`)
- [x] mockData.js — Acme Corp demo dataset
- [x] Icon, Badge, Button, StatCard atoms
- [x] DashboardShell, Sidebar, TopBar, Nav layout components
- [x] MiniKnowledgeGraph + DashboardPreview graph components
- [x] Full LandingPage.jsx — all 11 sections + 4 capability blocks
- [x] OverviewPage.jsx — stats, mini graph, risk signals, extractions
- [x] GraphPage.jsx — interactive SVG graph with filters + detail panel
- [x] RiskPage.jsx — dependency inventory, heatmap, bottlenecks
- [x] AssistantPage.jsx — chat UI with structured responses + context panel
- [x] SourcesPage.jsx — 8 source cards with status badges and stats
- [x] WorkflowsPage, ReportsPage, SettingsPage — DashboardShell placeholders
- [x] All navigation + routing verified end-to-end

### Backend
- [x] FastAPI skeleton with CORS (`backend/main.py`)
- [x] Routers: GET /graph, GET /risk-report, GET /stats, POST /query, POST /ingest
- [x] Demo seed JSON in `backend/data/demo/` (mirrors mockData.js)
- [x] Acme Corp extraction corpus: 50 Slack messages, 3 incident MDs, deploy + auth runbooks
- [x] Fireworks.ai single-model config (`services/fireworks_config.py`, llama-v3p1-70b for extraction + query)
- [x] Neo4j schema + Acme Corp graph seed script (`backend/services/neo4j_service.py`, `backend/data/seed.py`)
- [x] ChromaDB integration + demo corpus population pipeline (`backend/services/chroma_service.py`, `backend/data/populate_chroma.py`)

## Phase 2 Checklist (Complete)
- [x] P2-01 — React Router routes for all pages (`/`, `/dashboard`, `/graph`, `/workflows`, `/risk`, `/assistant`, `/sources`, `/reports`, `/settings`)
- [x] P2-02 — Sidebar `useLocation()` active state (highlights current route, updates on browser back)
- [x] P2-03 — Sidebar logo → `/`; all 8 nav items → correct routes
- [x] P2-04 — Landing CTAs: Request Demo, View Architecture → `/dashboard`
- [x] P2-05 — DashboardPreview click → `/dashboard`
- [x] P2-06 — Overview Expand → `/graph`; View all → `/risk`
- [x] P2-07 — Landing capability blocks: Graph → `/graph`, Risk → `/risk`, Assistant → `/assistant`, Sources → `/sources`
- [x] P2-08 — Assistant suggestion chips + Enter key send via `store.sendMessage()`
- [x] P2-09 — Zustand store init from `MOCK_INITIAL_MESSAGES` + `MOCK_STATS`
- [x] P2-10 — All dashboard pages wrapped in `DashboardShell`

## What's In Progress
- Wire backend routes to Neo4j and ChromaDB services (current FastAPI routes still return demo JSON fixtures)

## What's Next
1. Start Neo4j locally, then run `python backend/data/seed.py`
2. Wire `/graph`, `/stats`, `/risk-report`, and `/query` to Neo4j/ChromaDB services
3. Codex: agents + Fireworks.ai live query path
4. WorkflowsPage full implementation

## Known Issues / Blockers
- Neo4j and ChromaDB are external services. In this workspace on 2026-05-26, Neo4j was not listening on `localhost:7687`, and Docker/Neo4j CLI were not available, so live Neo4j seeding could not be completed here.
- The Neo4j seed intentionally produces 15 visualization nodes (5 people, 5 systems, 3 workflows, 2 incidents) to match the existing frontend graph contract and the task's stated verification target. The Chroma pipeline indexes the broader demo corpus, including all incident markdown files present under `backend/data/demo/incidents/`.

## API Endpoints Status
| Endpoint | Status | Notes |
|----------------|-------------|------------------------|
| GET /graph | Mock (backend live) | `backend/routers/graph.py` → graph.json |
| GET /stats | Mock (backend live) | `backend/routers/risk.py` → stats.json |
| GET /risk-report | Mock (backend live) | `backend/routers/risk.py` → risk_report.json |
| POST /query | Mock (backend live) | `backend/routers/query.py` → query_response.json |
| POST /ingest | Mock (backend live) | Returns `{ status: processing, job_id: demo-001 }` |

## Data Store Scripts
| Script | Status | Notes |
|----------------|-------------|------------------------|
| `python backend/data/seed.py` | Implemented | Clears Neo4j, creates constraints/indexes, seeds 15 Acme graph nodes and 21 relationships. Requires Neo4j at `bolt://localhost:7687` with `neo4j/memoryweave`. |
| `python backend/data/populate_chroma.py` | Verified locally | Indexed 58 chunks into `memoryweave_knowledge`: 9 Slack, 20 incident, 29 docs. Search assertion for `payment service recovery patel` passed. |

## Verification Log
- `backend/.venv/bin/python` does not currently have `neo4j` or `chromadb` installed, though both packages are listed in `backend/requirements.txt`. System Python 3.13.9 has `neo4j==5.28.1` and `chromadb==1.0.8`.
- Source compile check passed for `backend/services/neo4j_service.py`, `backend/services/chroma_service.py`, `backend/data/seed.py`, and `backend/data/populate_chroma.py`.
- ChromaDB verification: started temporary server with `chroma run --host localhost --port 8001 --path ./.chroma-memoryweave`; ran `python backend/data/populate_chroma.py`; saw `Search test passed` and `Indexed 58 chunks: 9 from Slack, 20 from incidents, 29 from docs`; `ChromaService.get_stats()` returned count `58` across `messages.json`, `P-3722.md`, `P-3882.md`, `P-4021.md`, `auth-service.md`, and `deploy-runbook.md`.
- Neo4j verification blocked: `python backend/data/seed.py` failed with connection refused to `localhost:7687`; no process was listening on ports `7687`, `7474`, or `8001` before starting temporary Chroma; Docker daemon was unavailable.

## Environment
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Neo4j: http://localhost:7474
- ChromaDB: http://localhost:8001
