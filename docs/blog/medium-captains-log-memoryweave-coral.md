# How I Built an Organizational Memory Agent with Coral SQL, Cursor, and a Bus-Factor Story

*One SQL layer across graph, incidents, Slack, and GitHub — no warehouse, no hand-merged RAG glue.*

**Live demo:** https://memory-weave-ai.vercel.app  
**Code:** https://github.com/Venkat-Kolasani/MemoryWeave

---

When a senior engineer leaves, the company does not lose “documentation.” It loses *how things actually get done* — who owned the payment stack, which postmortems mattered, what was said in `#incidents` at 2 a.m. I built **MemoryWeave** for the Pirates of the Coral-bean hackathon to make that knowledge queryable *before* someone like **A. Patel** (our fictional Acme Corp lead with a 95% bus factor on payments) stops showing up on Monday.

This post is the route map: what we built, how **Coral** became the agent’s read layer, and how I used **Cursor** with **Composer** to ship it end to end — including the production surprises nobody puts in a README.

---

## The bet: Coral as the read layer, not another database

The first version of MemoryWeave looked like a typical RAG app: Neo4j for the graph, ChromaDB for semantic search, FastAPI merging both, then Fireworks for the answer.

It worked locally. It was also the wrong shape for an **enterprise agent**: three retrieval paths, three failure modes, and no single place to ask “who owns what across systems and incidents?”

**Coral** changed the design. We register heterogeneous sources as **SQL tables** and run **cross-source JOINs**. The LLM sees structured rows — not a wall of Slack in context.

**Flow:** Slack / incidents / graph / GitHub → Coral SQL (CLI on Render) → FastAPI → React + Fireworks.

Graph and Risk still use **live Neo4j** for visualization. Assistant, Reports, and Settings prove **Coral**.

---

## What we shipped

- **Frontend:** React on Vercel  
- **Backend:** FastAPI in Docker on Render  
- **Coral 0.4.1** via `coral sql` subprocess (`coral_service.py`)  
- **Five sources:** graph nodes/edges (JSONL), incidents, Slack, GitHub (live API + JSONL hybrid)  
- **Endpoints:** `/coral-query`, `/coral-report`, `/coral-schema`, `/coral-mcp-config`  

We did **not** build a new upstream Coral source spec (Gmail/Discord track). We used **file manifests** and Coral’s **bundled GitHub source** — the right path for deep Coral *usage*.

---

## How I built it in Cursor

I used **Cursor** with **Composer** (the agent model for this build), plus a strict `.cursorrules` file so the agent did not sprawl into random UI libraries or `fetch()` inside React components.

**What worked:**

1. **Narrative first** — Acme / Patel / bus factor drove seed data and demo queries.  
2. **Vertical slices** — “Wire `/coral-report` to Reports,” then `curl`, then polish UI.  
3. **Coral Docs in Cursor** — when `coral schema` disappeared in 0.4.1, the Coral Docs MCP pointed me at `coral.tables` instead of burning hours on wrong CLI flags.  
4. **Separate production passes** — glibc 2.39 Docker image, Vercel CORS, UptimeRobot, 5-minute Zustand cache so Settings/Reports do not reload Coral on every click.

Composer wrote manifests, routers, and cards fast. I owned architecture: one SQL read layer, honest health checks, hybrid GitHub when live issues alone returned zero Patel rows.

---

## Follow this route (about 2–3 hours local)

### 1. Install Coral and register sources

```bash
brew install withcoral/tap/coral
cd backend
cp .env.example .env
bash coral/install_sources.sh
```

Optional: `export GITHUB_TOKEN=...` for live `github.issues` + hybrid mode.

Verify tables:

```bash
coral sql --format table \
  "SELECT schema_name, table_name FROM coral.tables \
   WHERE table_name IN ('knowledge_nodes','knowledge_edges','incident_reports','slack_messages','github_issues','issues') \
   ORDER BY 1, 2"
```

Run a JOIN:

```bash
coral sql --format json \
  "SELECT n.name, e.to_name, e.rel_type, e.weight
   FROM memoryweave_graph.knowledge_nodes n
   JOIN memoryweave_graph.knowledge_edges e ON n.id = e.from_id
   WHERE n.type = 'Person' AND e.rel_type = 'OWNS'
   ORDER BY e.weight DESC LIMIT 5"
```

### 2. Run the API

```bash
python data/seed.py
uvicorn main:app --reload --port 8000
curl http://127.0.0.1:8000/health
curl -X POST http://127.0.0.1:8000/coral-query \
  -H "Content-Type: application/json" \
  -d '{"question": "What breaks if Patel is out Monday?"}'
```

### 3. Open the UI

```bash
cd frontend && npm i && npm run dev
```

Visit `/reports`, `/settings`, `/assistant`. On the Assistant, send the Patel question and expand the **coral_sql** footer.

---

## Production war stories (the useful part)

**Aura HTTP blocked for Coral** — Bolt worked for the graph UI; Coral’s HTTP path got 403. We ship graph tables as **JSONL** aligned with the same seed; judges still see real JOINs on Render.

**glibc on Render** — Coral needs 2.39+. We moved to `python:3.11-slim-trixie` and install Coral at image build.

**CORS** — `curl` passed; the browser did not until we allowed the Vercel origin.

**GitHub** — Real issues did not mention Patel in the body; we **UNION** live API rows with demo JSONL and label `issue_source`.

**Cold start** — Warm `/health` before demos; first `/coral-report` is slow; revisits are cached for five minutes in the frontend.

---

## What’s next

Refresh Coral tables from ingest, tighten SQL generation, and maybe one day submit a real Slack API source spec. For this hackathon, the win is proving **one JOIN across org memory** in production.

---

## Try it

- App: https://memory-weave-ai.vercel.app  
- API health: https://memoryweave-r6r4.onrender.com/health  
- Full local guide in the repo: `docs/CORAL_LOCAL.md`

MemoryWeave is organizational memory with **Coral as the unified SQL read layer**. Cursor moved fast; Coral kept retrieval honest; production taught the rest.

If you build something similar, start with one JOIN that returns Patel and Payment API — then one endpoint — then one screen that shows the SQL. The rest follows.

---

*Built for Pirates of the Coral-bean (Enterprise Agent). Feedback welcome on GitHub.*
