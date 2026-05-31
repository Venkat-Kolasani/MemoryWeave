# How I Built an Organizational Memory Agent with Coral SQL, Cursor, and a Bus-Factor Story

**Subtitle for Medium:** One SQL layer across graph, incidents, Slack, and GitHub — no warehouse, no hand-merged RAG glue.

**Live demo:** [memory-weave-ai.vercel.app](https://memory-weave-ai.vercel.app) · **Code:** [github.com/Venkat-Kolasani/MemoryWeave](https://github.com/Venkat-Kolasani/MemoryWeave)

---

When a senior engineer leaves, the company does not lose “documentation.” It loses *how things actually get done* — who owned the payment stack, which postmortems mattered, what was said in `#incidents` at 2 a.m. I built **MemoryWeave** for the Pirates of the Coral-bean hackathon to make that knowledge queryable *before* someone like **A. Patel** (our fictional Acme Corp lead with a 95% bus factor on payments) stops showing up on Monday.

This post is the route map: what we built, how **Coral** became the agent’s read layer, and how I used **Cursor** with **Composer** to ship it end to end — including the production surprises nobody puts in a README.

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

### Five Coral “tables” (really: five registered sources)

1. `memoryweave_graph.knowledge_nodes` — people, systems, incidents, workflows (JSONL aligned with our Neo4j seed)
2. `memoryweave_graph.knowledge_edges` — OWNS, KNOWS, RESOLVES, etc.
3. `memoryweave_demo.incident_reports` — postmortem-style JSONL
4. `memoryweave_demo.slack_messages` — 50-message engineering export
5. **GitHub issues** — live `github.issues` when `GITHUB_TOKEN` is set, plus a **hybrid UNION** with `memoryweave_demo.github_issues` JSONL so demo narratives (Patel, Chen, payment runbooks) still appear beside real repo issues

We did **not** submit a new upstream Coral “source spec” (Gmail, Discord, etc.). We used Coral’s **file backend** (DSL v3 manifests) and the **bundled GitHub source** — which is the right hackathon path for *using* Coral deeply, not inventing a new connector.

---

## How I built it in Cursor (Composer + project rules + Coral docs)

I did not hand-write every file in one sitting. The repo was built in **Cursor** with **Composer** (the agent model in this project — referred to in-session as Composer 2.5), guided by a strict `.cursorrules` file: design tokens, no random UI kits, all API calls through `api.js`, Zustand for state, custom SVG graph (no D3).

That mattered more than it sounds. When you ask an agent to “add a Reports page,” it will otherwise invent purple gradients and `fetch()` inside components. The rules kept the hackathon UI consistent with our design reference and forced retrieval logic into `coral_service.py` and `coral_query.py` where judges can find it.

### My actual workflow

1. **Scaffold the product narrative first** — Acme Corp, Patel, payment bus factor. That story drove seed data, risk copy, and Assistant sample questions.
2. **Integrate Coral in a focused branch** — `install_sources.sh`, manifests under `backend/coral/manifests/`, canonical SQL in `backend/coral/queries.py`.
3. **Use the agent for vertical slices** — e.g. “wire `/coral-report` to Reports page and show SQL on the card,” then verify with `curl` before touching CSS.
4. **When Coral CLI behavior was unclear** — Coral 0.4.1 dropped `coral schema`; the catalog is `SELECT … FROM coral.tables`. I used **Coral’s docs via MCP in Cursor** (the Coral Docs server) instead of guessing flags. That saved an embarrassing “schema command not found” loop in CI and in the Dockerfile.
5. **Production passes** — separate agent sessions for Render Docker (glibc 2.39 + Coral binary), Vercel CORS, UptimeRobot warm pings, and frontend cache so Settings/Reports do not refetch on every tab click.

I’m not claiming the model “understood Coral” magically. It accelerated boilerplate — manifests, FastAPI routers, React cards — while **I** kept the architecture contract: one SQL interface, subprocess CLI, no fake “Coral connected” UI without `/health` saying `"coral": "ok"`.

---

## Step 1 — Install Coral and register sources (~30 minutes)

```bash
brew install withcoral/tap/coral
cd backend
cp .env.example .env   # Neo4j Aura + optional GITHUB_TOKEN + FIREWORKS_API_KEY
bash coral/install_sources.sh
```

The install script:

- Lints and registers `memoryweave_graph` and `memoryweave_demo` manifests
- Points file URIs at `backend/coral/data/*.jsonl`
- Optionally adds Coral’s bundled `github` source and sets `github_mode` to `file`, `api`, or **`hybrid`** (live API + JSONL supplement)

Verify tables (Coral 0.4.1):

```bash
coral sql --format table \
  "SELECT schema_name, table_name FROM coral.tables \
   WHERE table_name IN ('knowledge_nodes','knowledge_edges','incident_reports','slack_messages','github_issues','issues') \
   ORDER BY 1, 2"
```

Run a JOIN that proves the hackathon story:

```bash
coral sql --format json \
  "SELECT n.name, e.to_name, e.rel_type, e.weight
   FROM memoryweave_graph.knowledge_nodes n
   JOIN memoryweave_graph.knowledge_edges e ON n.id = e.from_id
   WHERE n.type = 'Person' AND e.rel_type = 'OWNS'
   ORDER BY e.weight DESC LIMIT 5"
```

You should see Patel-heavy ownership on Payment API in the seed data.

---

## Step 2 — Wrap the CLI in Python (~1 hour)

Coral ships as a CLI. We intentionally did **not** wait for a Python SDK. `coral_service.py` runs:

```text
coral sql --format json "<query>"
```

and parses JSON rows. On startup we probe `coral --version` once and cache health for `GET /health` so free-tier Render does not spawn a subprocess on every ping.

`coral_query.py` adds:

- **`POST /coral-query`** — keyword/intent routing to templates in `coral/queries.py` (e.g. Patel absence, payment recovery, systems without backup), then Fireworks to ground a natural-language answer. The UI shows `coral_sql` and `coral_rows` on the Assistant bubble.
- **`GET /coral-report`** — bus factor, team concentration, incident resolver chains, and the GitHub × graph cross-join for the Reports “Live Cross-Source SQL” card.
- **`GET /coral-schema`** — catalog for the Settings page.
- **`GET /coral-mcp-config`** — copy-paste MCP block for **local** Claude Desktop (`coral mcp`). On Render, MCP is unavailable by design; production uses CLI SQL only.

---

## Step 3 — Prove it in the UI (~1 hour)

Three pages tell the Coral story to judges:

1. **Reports** (`/reports`) — static SQL block + live preview rows; chips for “Tables in query: 3” and “Registered sources: 5”; bus factor list below.
2. **Settings** (`/settings`) — registered tables, Coral status, JOIN example, MCP section.
3. **Assistant** (`/assistant`) — Coral on by default; ask *“What breaks if Patel is out Monday?”* and expand the SQL footer.

We added a **5-minute Zustand cache** for `/coral-schema` and `/coral-report` because React Router unmounts pages on navigation — without cache, every return to Settings felt like a cold load (painful when `/coral-report` runs several SQL queries on Render).

---

## Production: the honest chapter

### Aura HTTP vs Bolt

Neo4j Aura worked over **Bolt** for our graph UI. Coral’s graph source used Aura’s **HTTP transactional API**. With the wrong database path we got **403**; even with the right path, Aura blocked HTTP for our tier. **Fix:** ship graph tables as **JSONL snapshots** (`export_coral_graph.py` from the same seed as Neo4j). The UI graph stays live; Coral SQL stays reliable on Render.

### glibc on Render

Coral’s Linux binary needs **glibc 2.39+**. Bookworm-based images failed. **Fix:** `python:3.11-slim-trixie` in `backend/Dockerfile` and install Coral at build time with `CORAL_VERSION=v0.4.1`.

### CORS

Server-side `curl` passed; the Vercel browser saw blank Risk and “Coral offline.” **Fix:** allow `https://memory-weave-ai.vercel.app` in FastAPI CORS.

### GitHub hybrid

Live repo issues #1–#2 do not mention “Patel” in the body — a pure API JOIN returns zero narrative rows. **Fix:** `UNION` live `github.issues` with `memoryweave_demo.github_issues` and label `issue_source` as `live_github_api` vs `demo_supplement`.

### Cold starts

Render free tier sleeps. **Fix:** UptimeRobot on `/health`, frontend warm pings, `HEAD /health` support for monitors.

---

## Reproduce the full stack

**Local**

```bash
# backend
python data/seed.py
bash coral/install_sources.sh
uvicorn main:app --reload --port 8000

# frontend
cd frontend && npm i && npm run dev
```

**Production**

- App: https://memory-weave-ai.vercel.app  
- API: https://memoryweave-r6r4.onrender.com/health → `"coral": "ok"`  
- Deeper setup: [CORAL_LOCAL.md](https://github.com/Venkat-Kolasani/MemoryWeave/blob/main/docs/CORAL_LOCAL.md) in the repo

---

## What I’d do next

- Refresh JSONL from `/ingest` when new Slack or postmortems land  
- Push intent routing from keywords toward Coral-assisted SQL generation (still grounded, still visible in the UI)  
- Optional: a real upstream source spec for Slack API — that’s Chart New Waters, not this build

---

## Closing

MemoryWeave is a hackathon-sized proof that **organizational memory** fits Coral’s model: heterogeneous sources, one SQL dialect, JOINs the agent can trust. Cursor and Composer got me there faster; Coral kept the retrieval layer honest; production taught me the rest.

If you follow this route, start with one JOIN that returns Patel and Payment API — then wire one endpoint — then one UI proof. The reef grows from working SQL, not from slides.

---

*Built for the Pirates of the Coral-bean hackathon (Enterprise Agent track). Questions and PRs welcome on GitHub.*
