# MemoryWeave — Project Status

## Last Updated
2026-05-26

## Current Phase
Phase 1 — Frontend scaffold

## What's Been Built
### Frontend
- [x] Vite + React 18 project (`frontend/`)
- [x] CSS design tokens + keyframes (`src/index.css`)
- [x] App.jsx route table (react-router-dom)
- [x] Zustand store — full data state + async actions (`src/stores/appStore.js`)
- [x] API service layer with mocks (`src/services/api.js`)
- [x] mockData.js — Acme Corp demo dataset
- [x] Page stubs + LandingPage, OverviewPage, GraphPage, RiskPage, AssistantPage (full)
- [x] Icon, Badge, Button, StatCard atoms
- [x] DashboardShell, Sidebar, TopBar, Nav layout components
- [x] MiniKnowledgeGraph + DashboardPreview graph components
- [x] Full LandingPage.jsx — all 11 sections
- [x] RiskPage.jsx — dependency inventory, heatmap, bottlenecks
- [x] AssistantPage.jsx — chat UI with structured responses + context panel

### Backend
- [ ] FastAPI skeleton with CORS
- [ ] Neo4j schema
- [ ] ChromaDB integration

## What's In Progress
AssistantPage complete — remaining app pages (Sources, Workflows)

## What's Next
1. SourcesPage (integration cards)
2. WorkflowsPage (workflow cards + timeline drawer)

## Known Issues / Blockers
None

## API Endpoints Status
| Endpoint | Status | Notes |
|----------------|-------------|------------------------|
| GET /graph | Mock only | Via api.js → MOCK_GRAPH_NODES/EDGES |
| GET /stats | Mock only | Via api.js → MOCK_STATS |
| GET /risk-report | Mock only | Via api.js → MOCK_RISK_ITEMS |
| POST /query | Mock only | 1500ms delay, structured response |

## Environment
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Neo4j: http://localhost:7474
- ChromaDB: http://localhost:8001
