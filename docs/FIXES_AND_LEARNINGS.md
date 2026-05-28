# MemoryWeave — Fixes & Learnings

## Coral Integration Branch — Strategy Doc
**Date:** 2026-05-28
**Phase:** Phase 6 — Coral-bean hackathon

### What Happened
Started `Coral-integration` branch to add [Coral](https://withcoral.com) as the cross-source SQL read layer for MemoryWeave while keeping `main` stable for the live Vercel + Render demo.

### Root Cause
N/A — planned enhancement for a second submission track (Pirates of the Coral-bean).

### How It Was Fixed
N/A — documented approach in `docs/CORAL_INTEGRATION.md`; implementation follows in subsequent prompts on this branch.

### What I Learned
MemoryWeave’s Neo4j graph UI and Patel bus-factor story are the product differentiator; Coral strengthens the **Assistant** and judge demo with one SQL join across Slack, incidents, and org data — aligned with hackathon scoring for MCP and cross-source queries.

### Relevant for Interview
Shows how to extend an existing MVP for a sponsor hackathon without forking the entire architecture: additive read path, branch isolation, clear “why Coral” narrative.

---

## Initial Entry — Log Created
**Date:** 2026-05-26
**Phase:** Phase 1

### What Happened
Project initialized. This log will track all critical failures and fixes.

### Root Cause
N/A

### How It Was Fixed
N/A

### What I Learned
Documenting failures in real-time is far more accurate than reconstructing from memory.

### Relevant for Interview
Shows disciplined engineering habits and self-awareness about failure modes.

## Neo4j + ChromaDB Store Implementation
**Date:** 2026-05-26
**Phase:** Phase 3

### What Happened
Implemented the MemoryWeave data-store layer:

- `backend/services/neo4j_service.py` for Neo4j schema creation, graph upserts, relationship linking, frontend graph reads, entity reads, and risk aggregation.
- `backend/data/seed.py` for deterministic Acme Corp demo graph seeding.
- `backend/services/chroma_service.py` for ChromaDB collection management, document insertion, semantic search, and stats.
- `backend/data/populate_chroma.py` for chunking Slack messages, incident markdown, and docs into the `memoryweave_knowledge` collection.

### Root Cause
The frontend and backend were still backed by static fixtures. The project needed real local data-store population scripts before route wiring and RAG query work could proceed.

### How It Was Fixed
Added idempotent Neo4j `MERGE` operations and schema constraints, plus a 21-relationship Acme graph where A. Patel has the highest risk score and the relationship set mirrors the frontend mock graph. Added a Chroma ingestion pipeline using `DefaultEmbeddingFunction` only, with no `sentence-transformers` or PyTorch import.

### Verification
- Python source compile checks passed for the four new files.
- ChromaDB was verified by starting a temporary local server on `localhost:8001`, indexing 58 chunks, and passing the semantic search assertion for `payment service recovery patel`.
- Neo4j live verification passed after local Docker Neo4j was started: seed completed with 15 nodes, 21 relationships, and A. Patel risk score 95. A follow-up query confirmed the live Neo4j edge set matches the frontend mock graph.

### What I Learned
Keep demo seed contracts aligned with the frontend visualization shape. The task text mentioned 5 incidents, but also required 15 total nodes and frontend mock-edge compatibility; the implemented Neo4j seed follows the 15-node verification contract while Chroma indexes every incident markdown file available in the corpus.

## Live API Wiring — Graph + Ingest (Day 3)
**Date:** 2026-05-27
**Phase:** Phase 3 — MVP checkpoint

### What Happened
Merged commit `10471f7` wiring backend routes to live data stores:
- `GET /graph` reads nodes/edges directly from Neo4j.
- `GET /stats` returns live node count from Neo4j (other stat fields still hardcoded).
- `POST /ingest` runs a 3-pass Fireworks extraction pipeline (`extractor.py` + `pipeline.py`) and persists to Neo4j + ChromaDB.
- `/risk-report` and `/query` remain mock-backed; frontend `api.js` still uses in-browser mocks.

### Root Cause
Data-store services existed but were disconnected from FastAPI routes and the UI — the demo couldn't show live graph or ingestion without this wiring layer.

### How It Was Fixed
Added `agents/extractor.py` (Fireworks JSON extraction) and `agents/pipeline.py` (chunk → 3-pass → store). Updated `graph.py`, `risk.py` (stats only), and `ingest.py` to call `Neo4jService` / `ChromaService` with graceful fallbacks.

### Verification
- TestClient: `/graph` → 15 nodes, 21 edges; `/stats` → nodes=15.
- Neo4j Docker container healthy on `localhost:7687`.

### What I Learned
Wire one vertical slice end-to-end before polishing all endpoints. Graph + ingest first gives a credible MVP demo; query/RAG and frontend fetch switch are the next highest-leverage items.

### Relevant for Interview
Demonstrates incremental integration: services → routes → agents → (next) frontend, rather than big-bang wiring at the end.

## Live Risk + Hybrid Query Wiring
**Date:** 2026-05-28
**Phase:** Phase 3 — risk + query checkpoint

### What Happened
Implemented the two remaining live backend endpoints:
- `GET /risk-report` now computes bus-factor risk from Neo4j with NetworkX in `services/risk_scorer.py`.
- `POST /query` now retrieves semantic context from ChromaDB and graph context from Neo4j in `services/retriever.py`, then attempts Fireworks structured JSON synthesis.

### Root Cause
The risk and assistant routes were still returning static fixtures. The demo needed the backend to prove real graph scoring and grounded retrieval before the frontend mock switch.

### How It Was Fixed
Added weighted ownership graph construction from `KNOWS`, incident `RESOLVES`/`AFFECTS`, workflow `OWNS`/`DEPENDS_ON`, and system dependency relationships. Added query entity matching with aliases such as "payment service" → "Payment API", graph neighborhood formatting, risk-context injection for broad bus-factor questions, strict JSON response normalization, and a retrieval fallback when Fireworks is unavailable.

### Verification
- Seed passed: 15 nodes, 21 relationships, A. Patel seed risk 95.
- Chroma population passed: 58 chunks indexed and search assertion passed.
- `/risk-report` passed required checks: Payment API owner A. Patel, score 100, at least 2 bottlenecks, Engineering heatmap 86.
- `/query` passed required HTTP checks for payment recovery, undocumented expertise, and P-4021 incident questions.
- Backend project `py_compile` passed outside `.venv`.

### Open Issues
- Fireworks rejected the configured model/key locally (`404 Model not found/inaccessible`; model listing returned `401 Unauthorized`), so verified query responses used the retrieval fallback rather than true LLM synthesis.
- Local `pip check` fails on `grpcio 1.80.0` platform metadata.
- Local frontend `npm run build` hangs under Node v25.3.0; retest with Node LTS.

### What I Learned
For hackathon demos, retrieval fallbacks are worth the extra hour: they keep the product demonstrable when provider credentials or model access fail, while still making the dependency problem visible in logs and docs.

## Fireworks 404 Misdiagnosed as Wrong Model
**Date:** 2026-05-28
**Phase:** Phase 4 — pre-deploy verification
**Severity:** High

### What Happened
`/query` and `test_fireworks.py` returned `404 Model not found` for every Llama model ID, including valid Fireworks catalog names.

### Root Cause
Two separate issues stacked: (1) `backend/.env` on disk still held a 12-character placeholder key while the editor showed an unsaved `fw_…` key; (2) after the real key was saved, the account only had access to serverless models like `kimi-k2p5`, not `llama-v3p1-70b-instruct`.

### How It Was Fixed
Added `validate_fireworks_api_key()`, `scripts/test_fireworks.py`, and switched default model to `accounts/fireworks/models/kimi-k2p5` in `fireworks_config.py` and `.env.example`.

### What I Learned
Fireworks often returns 404 (not 401) for bad keys or inaccessible models — always list models with `GET /inference/v1/models` before blaming the model string.

### Relevant for Interview
Shows systematic API debugging: verify env load → verify auth → list allowed resources → then change config.

## localhost:8000 Routed to Wrong Docker App
**Date:** 2026-05-28
**Phase:** Phase 4
**Severity:** High

### What Happened
`curl http://localhost:8000/query` returned `{"detail":"Not Found"}` while uvicorn logged MemoryWeave as running.

### Root Cause
Another Docker container bound `*:8000`; MemoryWeave uvicorn bound `127.0.0.1:8000`. macOS routed `localhost` to the Docker service, not uvicorn.

### How It Was Fixed
Set `VITE_API_URL=http://127.0.0.1:8000` in `frontend/.env` / `.env.example` and documented the conflict in `LOCAL_SETUP.md`.

### Relevant for Interview
Classic local dev port collision — always compare `lsof -i :8000` and test both `localhost` vs `127.0.0.1`.

## Phase 5 UI Verification Pass
**Date:** 2026-05-28
**Phase:** Phase 5 — polish
**Severity:** Medium

### What Happened
Pre-deploy checklist found several UI/UX gaps: graph legend showed total counts during filters, edges used OR-filter logic (orphan edges visible), risk stat cards were hardcoded, assistant warnings rendered inside the badge grid, graph loading skeleton never appeared, and font stack included `system-ui`.

### Root Cause
Phase 1–2 mock-first implementation left placeholder stats and simplified graph filter logic; Zustand seeded `MOCK_GRAPH_NODES` on boot so `graphNodes.length === 0` was never true.

### How It Was Fixed
- **Graph:** `isGraphLoading` flag; empty initial graph; edge visibility requires both endpoints to match filter; legend counts scoped to active filter; dynamic subtitle from live node/edge counts.
- **Risk:** Stat cards derive from live `riskItems`; table sorted by score descending.
- **Assistant:** Warnings moved to full-width red alert boxes below the related-entity grid; context panel reads `knowledgeStats` from `/stats`.
- **Global:** Removed `system-ui` from `--font-sans`; added oklch hex fallback comments; `inherit` font on form controls.

### Verification
- `npm run build` succeeded (Vite 6, 66 modules).
- Manual curl to `http://127.0.0.1:8000/query` returns structured LLM JSON without `llm_error`.

### Relevant for Interview
Demonstrates moving from mock-first UI to production-honest dashboard behavior without rewriting the design system.
