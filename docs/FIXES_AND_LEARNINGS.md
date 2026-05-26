# MemoryWeave — Fixes & Learnings

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
Added idempotent Neo4j `MERGE` operations and schema constraints, plus a 21-relationship Acme graph where A. Patel has the highest risk score and 8 direct connections. Added a Chroma ingestion pipeline using `DefaultEmbeddingFunction` only, with no `sentence-transformers` or PyTorch import.

### Verification
- Python source compile checks passed for the four new files.
- ChromaDB was verified by starting a temporary local server on `localhost:8001`, indexing 58 chunks, and passing the semantic search assertion for `payment service recovery patel`.
- Neo4j live verification could not complete in this workspace because no Neo4j process was listening on `localhost:7687`, and neither Docker nor a local `neo4j` binary was available to start it.

### What I Learned
Keep demo seed contracts aligned with the frontend visualization shape. The task text mentioned 5 incidents, but also required 15 total nodes and frontend mock-edge compatibility; the implemented Neo4j seed follows the 15-node verification contract while Chroma indexes every incident markdown file available in the corpus.
