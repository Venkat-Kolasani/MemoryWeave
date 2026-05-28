# MemoryWeave — Project Status

## Last Updated
2026-05-28

## Current Phase
Phase 3 — Live backend integration (risk + query checkpoint)

## What's Been Built
### Frontend
- [x] Vite + React 18 project (`frontend/`)
- [x] CSS design tokens + keyframes (`src/index.css`)
- [x] App.jsx route table (react-router-dom) — all 10 routes wired
- [x] Zustand store — full data state + async actions (`src/stores/appStore.js`)
- [x] API service layer with mocks (`src/services/api.js`) — **still mock-backed; Phase 4 switch pending**
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
- [x] Demo seed JSON + Acme extraction corpus (50 Slack msgs, 3 incidents, 2 runbooks)
- [x] Fireworks.ai single-model config (`services/fireworks_config.py`, llama-v3p1-70b)
- [x] Neo4j schema + seed script (`neo4j_service.py`, `data/seed.py`)
- [x] ChromaDB service + populate script (`chroma_service.py`, `data/populate_chroma.py`)
- [x] **GET /graph → live Neo4j** (`routers/graph.py`)
- [x] **GET /stats → Neo4j node counts** (partial; heatmap/risk counts still hardcoded)
- [x] **POST /ingest → 3-pass Fireworks extraction pipeline** (`agents/extractor.py`, `agents/pipeline.py`)
- [x] **GET /risk-report → live Neo4j + NetworkX bus-factor scoring** (`services/risk_scorer.py`)
- [x] **POST /query → Chroma + Neo4j hybrid retrieval + Fireworks synthesis path** (`services/retriever.py`, `routers/query.py`)

## What's In Progress
- Switch `frontend/src/services/api.js` from mocks to real fetch calls
- Resolve Fireworks access issue for `accounts/fireworks/models/llama-v3p1-70b-instruct`
- Add frontend real-fetch switch for graph, risk, stats, query

## What's Next
1. Enable real API calls in `api.js` (graph, stats, risk, query)
2. Fix Fireworks API key/model access so `/query` uses LLM synthesis instead of retrieval fallback
3. Compute `/stats` undocumented/risk/query counters from live data
4. WorkflowsPage full implementation
5. Deploy (Vercel + Railway) + Loom demo

## Known Issues / Blockers
- Frontend still reads `mockData.js` — backend live endpoints exist but UI won't use them until `api.js` Phase 4 switch.
- `/stats` returns live Neo4j node count but `undocumented`, `risks`, `queries` are placeholder values.
- `/ingest` requires Neo4j + Chroma + `FIREWORKS_API_KEY` running; uses Fireworks credits per upload.
- Chroma server must be running separately (`chroma run --port 8001`).
- Fireworks rejected the configured `accounts/fireworks/models/llama-v3p1-70b-instruct` call during verification (`404 Model not found/inaccessible`; model listing returned `401 Unauthorized`). `/query` now has a grounded retrieval fallback, but true LLM synthesis is blocked until credentials/model access are fixed.
- Local `pip check` reports `grpcio 1.80.0 is not supported on this platform` under Python 3.9/macOS, even though Chroma ran successfully. Prefer Python 3.11+ for production packaging.
- Local `npm run build` hangs under Node `v25.3.0`; use an LTS Node version (20 or 22) before production frontend release.

## API Endpoints Status
| Endpoint | Status | Notes |
|----------------|-------------|------------------------|
| GET /graph | **Live Neo4j** | 15 nodes, 21 edges from seeded graph |
| GET /stats | **Partial live** | Node count from Neo4j; other fields hardcoded |
| GET /risk-report | **Live Neo4j** | NetworkX bus-factor scoring; Payment API score 100 in seed |
| POST /query | **Live retrieval** | Chroma semantic context + Neo4j graph context; LLM path wired, fallback active until Fireworks access is fixed |
| POST /ingest | **Live pipeline** | Fireworks 3-pass extract → Neo4j + Chroma |

## Data Store Scripts
| Script | Status | Notes |
|----------------|-------------|------------------------|
| `python backend/data/seed.py` | Verified | 15 nodes, 21 relationships, Patel risk 95 |
| `python backend/data/populate_chroma.py` | Verified | 58 chunks indexed; search test passed |

## Verification Log (2026-05-27)
- Commit `10471f7`: Wire live graph and ingestion pipeline to Neo4j — merged to `main`.
- `py_compile` passed for `agents/extractor.py`, `agents/pipeline.py`, updated routers.
- TestClient: `GET /graph` → 200, 15 nodes / 21 edges; `GET /stats` → 200, nodes=15; `GET /risk-report` → 200, 5 risks.
- Docker Neo4j healthy on `localhost:7687`.

## Verification Log (2026-05-28)
- `python backend/data/seed.py` passed: 15 nodes, 21 relationships, A. Patel seed risk 95.
- `python backend/data/populate_chroma.py` passed: 58 chunks indexed; semantic search test passed.
- Backend `py_compile` passed for all project Python files outside `backend/.venv`.
- `GET /risk-report` over HTTP returned 4 live risk items; Payment API owner A. Patel, score 100, level critical; Engineering heatmap 86; 4 bottlenecks.
- Required `/risk-report` assertions passed: A. Patel is primary owner for Payment API, Payment API score >= 85, >=2 bottlenecks, Engineering heatmap > 60.
- Required `/query` HTTP checks passed on local port 8002:
  - Payment recovery query returned 6 steps, A. Patel, and sole-owner warning.
  - Undocumented expertise query returned A. Patel, T. Walsh, and warnings.
  - P-4021 query returned incident details and named A. Patel.
- Fireworks synthesis path attempted but local credentials/model access failed; responses above used the grounded retrieval fallback.
- `pip check` failed on local packaging metadata: `grpcio 1.80.0 is not supported on this platform`.
- `npm run build` did not complete locally under Node v25.3.0; Node LTS verification remains open.

## Environment
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Neo4j: http://localhost:7474
- ChromaDB: http://localhost:8001
