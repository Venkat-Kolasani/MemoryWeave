# MemoryWeave — Project Status

## Last Updated
2026-05-26

## Current Phase
Phase 2 — Frontend complete (mock-backed)

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
- [ ] FastAPI skeleton with CORS
- [ ] Neo4j schema
- [ ] ChromaDB integration

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
Nothing — Phase 2 frontend complete

## What's Next
1. FastAPI skeleton with CORS
2. Wire api.js to real endpoints (Phase 4)
3. WorkflowsPage full implementation

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
