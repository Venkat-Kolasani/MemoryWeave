# MemoryWeave × Coral — Video Demo Script

**Pirates of the Coral-bean Hackathon | Track 1: Enterprise Agent**

Use this doc when recording your **YouTube submission** (max **3 minutes**) and when demoing live to Coral judges.

**Presenter teleprompter (local only, gitignored):** `docs/CORAL-DEMO-TELEPROMPTER.md` — timed script, click cheat sheet, emergency `curl` backup.

**Captain's Log blog drafts (Medium + Hashnode):** `docs/blog/` — see `PUBLISH.md` for paste instructions.

---

## YouTube video demo link

**Paste your public YouTube URL here after upload:**

```
https://youtu.be/YOUR_VIDEO_ID
```

**Submission checklist**

- [ ] Video is **≤ 3 minutes** (YouTube unlisted or public is fine)
- [ ] Covers: **About the project**, **Tech stack & architecture**, **Demo**
- [ ] Optional: **Learning and growth** (30–45s at the end if time allows)
- [ ] Link added to hackathon form + README if required

---

## Video structure (≤ 3 minutes total)

| Section | Time | Required |
|---------|------|----------|
| 1. About the project | 0:00 – 0:40 | Yes |
| 2. Tech stack and architecture | 0:40 – 1:25 | Yes |
| 3. Live demo | 1:25 – 2:45 | Yes (strongly recommended) |
| 4. Learning and growth | 2:45 – 3:00 | Optional |

**Live URLs**

| Service | URL |
|---------|-----|
| Frontend | https://memory-weave-ai.vercel.app |
| Backend API | https://memoryweave-r6r4.onrender.com |
| GitHub | https://github.com/Venkat-Kolasani/MemoryWeave |

---

## 1. About the project (~40 seconds)

**What to say**

> MemoryWeave is organizational memory for engineering teams. When key people leave, teams lose how incidents were actually resolved, who owns which systems, and which workflows were never written down.
>
> We built a demo around **Acme Corp** and **A. Patel** — an engineering lead who resolved most payment outages and holds a **95% bus factor** on the payment stack. The product answers questions like: *What breaks if Patel doesn't come in Monday?*
>
> MemoryWeave combines a **knowledge graph**, **risk analytics**, and an **AI assistant** so that context is visible and queryable before it walks out the door.

**What to show (optional B-roll)**

- Landing page (`/`) — hero + “Patel problem” line
- One stat or risk callout on Overview (`/dashboard`)

**Key message for judges**

- Real problem: bus factor / knowledge loss  
- Clear demo narrative: Patel + payment service  
- Product outcome: queryable institutional memory  

---

## 2. Tech stack and architecture (~45 seconds)

**What to say**

> **Frontend:** React and Vite on Vercel — custom SVG knowledge graph, no graph libraries.
>
> **Backend:** FastAPI on Render, Neo4j Aura for the live graph and risk scoring, ChromaDB for semantic search on the legacy path, and **Fireworks** for LLM synthesis.
>
> **Coral** is the retrieval layer for the enterprise agent: instead of separate Cypher and embedding calls merged by hand, we expose **four SQL tables** — graph nodes, graph edges, incident postmortems, and Slack messages — and run **cross-source JOINs** from FastAPI via the Coral CLI.
>
> Flow: sources → ingest or seeded demo data → **Coral SQL** → structured rows → LLM answer. The Graph and Risk pages still read **live Neo4j**; Assistant, Reports, and Settings are powered by **Coral**.

**What to show**

- Quick architecture slide **or** Settings page (`/settings`) — four registered tables
- Optional: README architecture block (screen share)

**Architecture (voiceover / on-screen)**

```
Slack / Incidents / Docs
  → POST /ingest (optional) → LLM extraction → Neo4j + Chroma
  → Coral SQL layer
        memoryweave_graph.knowledge_nodes
        memoryweave_graph.knowledge_edges
        memoryweave_demo.incident_reports
        memoryweave_demo.slack_messages
  → Cross-source JOINs → /coral-query → Fireworks → React UI
```

**Coral features to name (at least three)**

- SQL over graph, Markdown-derived incidents, and JSON Slack  
- Cross-source JOIN (one query, multiple sources)  
- Schema catalog (`/coral-schema`)  
- CLI integrated in Docker / FastAPI subprocess  

---

## 3. Demo (~80 seconds) — recommended flow

**Pre-recording checklist**

- [ ] `GET https://memoryweave-r6r4.onrender.com/health` → `"coral": "ok"`
- [ ] `GET https://memoryweave-r6r4.onrender.com/coral-schema` → `"available": true`
- [ ] https://memory-weave-ai.vercel.app/reports loads with data
- [ ] Assistant: Coral SQL JOIN on (default); send one warm-up query before recording
- [ ] Browser 100% zoom, DevTools closed, Do Not Disturb on

### Timed demo script

**01:25 — Reports (`/reports`)** (~25s)

> "This analytics page is powered entirely by **Coral SQL** — bus factor, team concentration, incident resolver chains."

- Point to **Coral SQL** badges  
- Bus factor row: **Payment API — sole owner**  

**01:50 — Settings (`/settings`)** (~20s)

> "Four SQL tables registered in Coral. Graph relationships are plain SQL — joinable with incidents and Slack."

- Expand **knowledge_edges** or show JOIN example block  

**02:10 — Assistant (`/assistant`)** (~35s)

> "I'll ask: *What breaks if Patel doesn't come in Monday?*"

- Send question; wait for response  
- Point to footer: **`coral_sql`**, **`coral_rows`**, retrieval method  

> "That's the SQL Coral ran — structured rows, then the LLM grounds the answer. Not a hardcoded reply."

**Optional if time** (~10s): Graph (`/graph`) → click **A. Patel** → "Same knowledge, visualized."

**02:45 — Close** (~15s)

> "MemoryWeave: organizational memory on top of Coral — one SQL interface, four sources, no custom ETL in the agent."

- Show live app URL + GitHub  

### What Coral features the demo showcases

| Feature | Where |
|---------|--------|
| SQL over graph nodes/edges | Reports, Settings, Assistant |
| SQL over incident postmortems | Reports, Assistant |
| SQL over Slack JSON | Assistant, cross-source answers |
| Cross-source JOIN | `/coral-report`, `/coral-query` |
| Schema catalog | `/settings`, `/coral-schema` |
| CLI in production | Render Docker + `coral_service.py` |

### Judge FAQ: scripted or live?

| What | Scripted? |
|------|-----------|
| First messages on Assistant (on page load) | **Yes** — `mockData.js` polish only |
| Every new question you send | **No** — Coral SQL + Fireworks |
| Reports / Settings | **No** for data — live Coral SQL; **first** page visit fetches API; **revisit within 5 min** uses Zustand cache (no reload spinner) |
| Graph / Risk | **No** — live Neo4j |

Demo **data** is Acme Corp (seeded). Demo **answers** after Send are generated from that data via Coral + AI.

---

## 4. Learning and growth (~15–30 seconds, optional)

**What to say (pick 2–3)**

> We started with separate Neo4j Cypher and Chroma retrieval and hit real production issues: Aura HTTP blocked for Coral, CORS on Vercel, and keyword routing that returned zero SQL rows for valid questions.
>
> Moving the graph read layer to **JSONL snapshots** (same seed as Neo4j) made Coral reliable on Render while keeping the live graph UI on Bolt. **Intent-based SQL templates** fixed empty Assistant results for questions like backup-owner coverage.
>
> Biggest lesson: Coral fits best as the **agent read layer** — one JOIN across sources — while Neo4j stays the source of truth for visualization and bus-factor scoring. Next step we'd connect real markdown postmortems and Slack exports through ingest and refresh Coral tables automatically.

---

## Post-deploy verification (copy-paste)

```bash
curl -sS https://memoryweave-r6r4.onrender.com/health | python3 -m json.tool

curl -sS https://memoryweave-r6r4.onrender.com/coral-schema | python3 -m json.tool

curl -sS -X POST https://memoryweave-r6r4.onrender.com/coral-query \
  -H "Content-Type: application/json" \
  -d '{"question": "Who resolves payment incidents?"}' | python3 -m json.tool
```

Expected: `"retrieval_method": "coral_sql_join"`, `"coral_rows" > 0`, non-empty `"coral_sql"` and `"answer"`.

**Browser**

- https://memory-weave-ai.vercel.app/reports  
- https://memory-weave-ai.vercel.app/settings  
- https://memory-weave-ai.vercel.app/assistant  

---

## Short-form outline (if you need to cut to 2:30)

1. **About** (25s): Problem + Patel + MemoryWeave one-liner  
2. **Stack** (35s): React, FastAPI, Neo4j, Coral, Fireworks + architecture diagram  
3. **Demo** (80s): Reports → Settings → Assistant with SQL footer  
4. **Learn** (10s): One sentence on Coral as read layer + production lessons  
