---
title: "How I Built an Organizational Memory Agent with Coral SQL, Cursor, and a Bus-Factor Story"
subtitle: "One SQL layer across graph, incidents, Slack, and GitHub — no warehouse, no hand-merged RAG glue."
slug: memoryweave-coral-sql-cursor-hackathon
tags: coral, sql, cursor, ai-agents, fastapi, neo4j, hackathon, organizational-memory
coverImageURL: ""
canonical_url: https://memory-weave-ai.vercel.app
series: Pirates of the Coral-bean
---

When a senior engineer leaves, the company does not lose “documentation.” It loses *how things actually get done* — who owned the payment stack, which postmortems mattered, what was said in `#incidents` at 2 a.m. I built **MemoryWeave** for the Pirates of the Coral-bean hackathon to make that knowledge queryable *before* someone like **A. Patel** (our fictional Acme Corp lead with a 95% bus factor on payments) stops showing up on Monday.

This post is the route map: what we built, how **Coral** became the agent’s read layer, and how I used **Cursor** with **Composer** to ship it end to end — including the production surprises nobody puts in a README.

**Try it:** [memory-weave-ai.vercel.app](https://memory-weave-ai.vercel.app) · **Code:** [github.com/Venkat-Kolasani/MemoryWeave](https://github.com/Venkat-Kolasani/MemoryWeave)

---

## The bet: Coral as the read layer, not another database

The first version of MemoryWeave looked like a typical RAG app:

- Neo4j for the knowledge graph (Cypher)
- ChromaDB for semantic search on Slack and docs
- FastAPI merging both, then Fireworks for the answer

It worked locally. It was also the wrong shape for an **enterprise agent**: three retrieval paths, three failure modes, and no single place to ask “who owns what across systems and incidents?”

**Coral** changed the design. Instead of teaching the LLM to call Neo4j, parse markdown, and search vectors separately, we register heterogeneous sources as **SQL tables** and let Coral run **cross-source JOINs**. The LLM sees structured rows — not a wall of Slack pasted into context.

```
Slack / incidents / graph / GitHub
        ↓
   Coral SQL (CLI in production)
        ↓
   FastAPI (/coral-query, /coral-report)
        ↓
   React UI + Fireworks grounding
```

Graph and Risk pages still read **live Neo4j over Bolt** for visualization. Assistant, Reports, and Settings prove **Coral**.

---

## What we actually shipped

| Layer | Choice |
|--------|--------|
| Frontend | React + Vite on Vercel |
| API | FastAPI on Render (Docker) |
| Graph / risk | Neo4j Aura |
| Agent retrieval | Coral 0.4.1 (`coral sql` subprocess) |
| LLM | Fireworks (`kimi-k2p5` for `/coral-query`) |
| Legacy fallback | `/query` → Chroma + Neo4j (Assistant can fall back) |

### Five Coral sources

1. `memoryweave_graph.knowledge_nodes` — people, systems, incidents, workflows (JSONL aligned with our Neo4j seed)
2. `memoryweave_graph.knowledge_edges` — OWNS, KNOWS, RESOLVES, etc.
3. `memoryweave_demo.incident_reports` — postmortem-style JSONL
4. `memoryweave_demo.slack_messages` — 50-message engineering export
5. **GitHub issues** — live `github.issues` when `GITHUB_TOKEN` is set, plus a **hybrid UNION** with `memoryweave_demo.github_issues` JSONL so demo narratives still appear beside real repo issues

We used Coral’s **file backend** (DSL v3 manifests) and the **bundled GitHub source** — not a new upstream connector spec.

---

## How I built it in Cursor (Composer + project rules + Coral docs)

I built the repo in **Cursor** with **Composer** (the agent model used throughout this project), guided by `.cursorrules`: design tokens, API calls only in `api.js`, Zustand for state, custom SVG graph.

### My actual workflow

1. **Product narrative first** — Acme Corp, Patel, payment bus factor.
2. **Coral branch** — `install_sources.sh`, manifests, `queries.py`.
3. **Vertical slices with the agent** — wire `/coral-report` → Reports, verify with `curl`, then UI.
4. **Coral docs in Cursor** — when CLI behavior changed (e.g. `coral schema` → `coral.tables`), I used the **Coral Docs MCP** instead of guessing.
5. **Production passes** — Docker/glibc, CORS, warm pings, frontend cache for Settings/Reports.

The model accelerated manifests, routers, and React cards. I kept the contract: one SQL interface, subprocess CLI, honest `/health`.

---

## Step 1 — Install Coral and register sources

```bash
brew install withcoral/tap/coral
cd backend
bash coral/install_sources.sh
```

Verify:

```bash
coral sql --format table \
  "SELECT schema_name, table_name FROM coral.tables \
   WHERE table_name IN ('knowledge_nodes','knowledge_edges','incident_reports','slack_messages','github_issues','issues') \
   ORDER BY 1, 2"
```

Example JOIN:

```bash
coral sql --format json \
  "SELECT n.name, e.to_name, e.rel_type, e.weight
   FROM memoryweave_graph.knowledge_nodes n
   JOIN memoryweave_graph.knowledge_edges e ON n.id = e.from_id
   WHERE n.type = 'Person' AND e.rel_type = 'OWNS'
   ORDER BY e.weight DESC LIMIT 5"
```

---

## Step 2 — Wrap the CLI in Python

`coral_service.py` runs `coral sql --format json` and parses rows.

Endpoints:

- `POST /coral-query` — intent templates + Fireworks; UI shows `coral_sql`
- `GET /coral-report` — analytics + GitHub cross-join for Reports
- `GET /coral-schema` — Settings catalog
- `GET /coral-mcp-config` — local MCP only; Render uses CLI SQL

---

## Step 3 — Prove it in the UI

- **Reports** — Live Cross-Source SQL card + bus factor
- **Settings** — tables + JOIN example + MCP copy
- **Assistant** — “What breaks if Patel is out Monday?” + SQL footer

**Zustand cache (5 min)** stops refetching `/coral-report` on every tab switch.

---

## Production lessons (short)

| Problem | Fix |
|---------|-----|
| Aura HTTP 403 for Coral graph | JSONL snapshots; UI still uses Bolt |
| glibc 2.36 on Render | `python:3.11-slim-trixie` + Coral in Dockerfile |
| Browser CORS | Allow Vercel origin in FastAPI |
| Empty GitHub JOIN | Hybrid UNION live + JSONL |
| Slow revisits to Reports | Client cache in `appStore.js` |

---

## Reproduce

```bash
python backend/data/seed.py
bash backend/coral/install_sources.sh
uvicorn main:app --reload --port 8000
cd frontend && npm run dev
```

Repo guide: [docs/CORAL_LOCAL.md](https://github.com/Venkat-Kolasani/MemoryWeave/blob/main/docs/CORAL_LOCAL.md)

---

## Closing

MemoryWeave shows organizational memory through **one Coral SQL layer**. Cursor moved fast; Coral kept retrieval honest; production taught the rest.

Start with one JOIN that returns Patel and Payment API — then one endpoint — then one UI proof.

---

*Pirates of the Coral-bean · Enterprise Agent track · [GitHub](https://github.com/Venkat-Kolasani/MemoryWeave)*
