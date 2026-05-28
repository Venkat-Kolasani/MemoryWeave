# MemoryWeave × Coral — Demo Script

## Pirates of the Coral-bean Hackathon | Track 1: Enterprise Agent

**Live URLs (production)**

| Service | URL |
|---------|-----|
| Frontend | https://memory-weave-ai.vercel.app |
| Backend API | https://memoryweave-1.onrender.com |

---

### Pre-recording checklist

- [ ] Backend Render URL is live: `GET https://memoryweave-1.onrender.com/health` → `"coral": "ok"`
- [ ] `GET https://memoryweave-1.onrender.com/coral-schema` → `"available": true`
- [ ] Frontend Vercel URL loads; **Reports** (`/reports`) shows Coral analytics tables
- [ ] **Assistant** (`/assistant`): Coral SQL JOIN mode on (default); responses show `coral_sql` + row count in the bubble footer
- [ ] Browser zoom 100%, DevTools closed, Do Not Disturb on
- [ ] **Pre-warm:** open `/assistant`, send one query (e.g. *"Which systems have no backup owner?"*), wait for response (Render free tier cold start ~30–60s)

---

### 3-minute demo script

**00:00 — Landing page**

> "Modern engineering teams carry a hidden risk — critical knowledge locked inside a few key people. MemoryWeave makes that risk visible and queryable."

Scroll to **Dashboard Preview**. Click it.

**00:20 — Overview Dashboard**

> "This is MemoryWeave — live organizational memory for Acme Corp. Knowledge nodes, risk signals, and connected sources in one view."

Point to **Critical Risk Signals**. Click **View all →**.

**00:35 — Reports page (`/reports`)**

> "This is the Coral-powered analytics layer."

Point to the **Coral SQL** badge on each section.

> "Every table here — bus factor, team concentration, incident resolver chains, undocumented workflows — is powered by Coral SQL over the knowledge graph, incident postmortems, and Slack exports."

Point to **Bus Factor** table: *"Payment API — sole owner. That's your single point of failure."*

Point to **Incident Resolver Chain**.

> "Multiple sources. One SQL interface. Coral resolves the JOIN internally."

**01:15 — Settings page (`/settings`)**

> "Here are the four SQL tables Coral has registered."

Expand **knowledge_edges** (or **knowledge_nodes**).

> "Normally, graph relationships mean Cypher or custom APIs. With Coral, they're standard SQL tables — joinable with incident reports and Slack in one query."

Show the **Cross-Source JOIN** example block.

**01:45 — AI Assistant (`/assistant`) — Coral mode**

Navigate to `/assistant`.

In the right panel, confirm **Coral SQL JOIN** is selected (pulsing blue dot = primary path).

Click a suggestion pill or type:

> **"What breaks if Patel doesn't come in Monday?"**

Wait for the response.

> "See the metadata footer — that's the exact SQL Coral executed. Not a one-off Cypher script in the app. Not embedding search. Structured rows from a cross-source JOIN, then the LLM grounds the answer in that data."

Point to **`coral_rows`** and the SQL snippet.

Optional second prompt: *"Which systems have no backup owner?"* — should return multiple rows (Payment API, Deploy System, etc.).

**02:20 — Knowledge Graph (`/graph`)**

Navigate to `/graph`. Click **A. Patel**.

> "Every system, incident, and workflow Patel touches — mapped visually. The same graph is also queryable as SQL through Coral."

**02:45 — Close**

Navigate to `/`.

> "MemoryWeave uses Coral to give AI agents one map for all operational data. One SQL interface. Four sources. No ETL warehouse and no hand-rolled merge code in the agent."

Show GitHub: `https://github.com/Venkat-Kolasani/MemoryWeave`

---

### What Coral features this demo showcases

| Feature | Where in the demo |
|---------|-------------------|
| SQL over graph nodes/edges | Reports, Settings, Assistant SQL footer |
| SQL over Markdown (incidents) | Reports incident chain; Assistant cross-source answers |
| SQL over JSON (Slack) | Assistant payment / Patel questions |
| Cross-source JOIN | Reports bus factor; `/coral-query` metadata |
| Schema learning / catalog | Settings table list (`/coral-schema`) |
| Caching | Repeat the same Assistant question — faster second response |
| CLI from FastAPI | Production Docker image installs Coral; `coral_service.py` subprocess |

---

### Post-deploy verification (copy-paste)

Replace URLs if your Render service name differs.

```bash
# Health + Coral
curl -sS https://memoryweave-1.onrender.com/health | python3 -m json.tool

# Schema
curl -sS https://memoryweave-1.onrender.com/coral-schema | python3 -m json.tool

# Live Coral query (not a canned response — LLM + SQL each time)
curl -sS -X POST https://memoryweave-1.onrender.com/coral-query \
  -H "Content-Type: application/json" \
  -d '{"question": "Who resolves payment incidents?"}' | python3 -m json.tool
```

Expected: `"retrieval_method": "coral_sql_join"`, non-empty `"coral_sql"`, `"coral_rows" > 0`, and a grounded `"answer"`.

**Browser**

- https://memory-weave-ai.vercel.app/reports — analytics tables populated  
- https://memory-weave-ai.vercel.app/settings — four SQL table cards  
- https://memory-weave-ai.vercel.app/assistant — Coral mode + SQL metadata on new messages  

---

### Judge FAQ: scripted or live?

| What | Scripted? |
|------|-----------|
| Opening messages on Assistant (payment recovery example) | **Yes** — static `mockData.js` for first paint only |
| Every message after you click Send or a suggestion pill | **No** — `POST /coral-query` → Coral SQL → Fireworks LLM |
| Reports / Settings numbers | **No** — `GET /coral-report` / `coral-schema` at request time |
| Graph / Risk views | **No** — live Neo4j |

Demo **data** is fictional Acme Corp (seeded). Demo **answers** are generated from that data via Coral + AI, not a lookup table of prewritten replies.
