# MemoryWeave — Deploy (Render + Vercel)

Deploy **backend** on [Render](https://render.com) and **frontend** on [Vercel](https://vercel.com). Use **Neo4j AuraDB** (free) for the production graph.

---

## Part 1 — Backend on Render

### Step 1 — Files (already in repo)

| File | Purpose |
|------|---------|
| `backend/Procfile` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| `backend/runtime.txt` | `python-3.11` |
| `render.yaml` | Optional Blueprint (sets `CHROMA_MODE=inmemory`) |

### Step 2 — Neo4j AuraDB (free tier)

1. [console.neo4j.io](https://console.neo4j.io) → **Create** → **AuraDB Free**
2. Save credentials when prompted (shown once)
3. URI format: `neo4j+s://xxxxxxxx.databases.neo4j.io`

### Step 3 — Deploy on Render

**Option A — GitHub (recommended)**

1. Push repo to GitHub
2. [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
3. Connect repo
4. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Create Web Service**

**Option B — Blueprint**

1. Render → **New** → **Blueprint** → select repo (`render.yaml` at root)

### Step 4 — Environment variables (Render dashboard)

| Variable | Value |
|----------|--------|
| `FIREWORKS_API_KEY` | Your Fireworks key |
| `FIREWORKS_MODEL` | `accounts/fireworks/models/kimi-k2p5` (or model your account supports) |
| `NEO4J_URI` | `neo4j+s://xxx.databases.neo4j.io` (from Aura `.txt` file) |
| `NEO4J_USER` | Value from Aura’s `NEO4J_USERNAME=` line (often your instance id, **not** `neo4j`) |
| `NEO4J_PASSWORD` | Aura password (from `.txt`; shown only once at instance creation) |

Aura’s download file labels the user as `NEO4J_USERNAME`; this app also accepts that name if you prefer to copy-paste exactly.
| `CHROMA_MODE` | `inmemory` |
| `CHROMA_STARTUP_POPULATE` | `false` (required on free tier — avoids OOM) |
| `NEO4J_DATABASE` | Aura instance id (same as `NEO4J_USER` if unsure) |
| `CORAL_AUTO_SETUP` | `true` (registers Coral sources on boot) |
| `CORAL_SKIP_TESTS` | `1` (faster cold start on free tier) |
| `CORAL_CONFIG_DIR` | `/app/.coral_config` (Docker) |

**Coral (required for Assistant):** Production uses **Docker** (`backend/Dockerfile`) so the Coral CLI is installed at build time. The Assistant calls `POST /coral-query` (Coral SQL + Fireworks). After deploy, `GET /health` should include `"coral": "ok"`.

If your Render service was created as **Python** (not Docker), switch it manually:
1. Render dashboard → your web service → **Settings**
2. Change **Runtime** to **Docker**
3. **Dockerfile Path:** `Dockerfile` (Root Directory = `backend`)
4. Redeploy

Optional (after Vercel deploy):

| Variable | Value |
|----------|--------|
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app,http://localhost:5173` |

On Render **free (512MB)**, set `CHROMA_STARTUP_POPULATE=false`. Indexing downloads ~79MB of embedding models at startup and can OOM-kill the service before it binds a port. Graph and Risk use Neo4j only and work without Chroma. The Assistant prefers **Coral SQL** (`/coral-query`); legacy `/query` is fallback if Coral fails.

After deploy, check logs for `[neo4j] Connected OK — 15 nodes` and `[coral] setup ok`. Verify:

```bash
curl https://your-service.onrender.com/health
curl -X POST https://your-service.onrender.com/coral-query \
  -H "Content-Type: application/json" \
  -d '{"question":"What breaks if Patel is out Monday?"}'
```

### Step 5 — Seed Neo4j (once, from your machine)

```bash
cd backend
source .venv/bin/activate

NEO4J_URI=neo4j+s://xxx.databases.neo4j.io \
NEO4J_USER=neo4j \
NEO4J_PASSWORD=your_auradb_password \
python data/seed.py
```

Expected: **15 nodes**, **21 relationships**, A. Patel highest risk.

### Step 6 — Verify API

```bash
curl https://your-service.onrender.com/
# {"status":"ok","version":"1.0.0","service":"MemoryWeave"}

curl https://your-service.onrender.com/graph
# JSON with nodes array from AuraDB
```

Copy your Render URL (e.g. `https://memoryweave-api.onrender.com`) for the frontend.

---

## Part 2 — Frontend on Vercel

Do this **after** the Render backend URL is live.

### Step 1 — `frontend/vercel.json` (Option B: frontend as root)

Committed in the repo — SPA rewrites so `/graph`, `/risk`, etc. do not 404 on refresh.

**Vercel project settings (required):**

| Setting | Value |
|---------|--------|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `dist` (default) |
| **Framework Preset** | Vite |

Do **not** use a `vercel.json` at the repo root when Root Directory is `frontend` — Vercel only reads config inside the root directory.

After changing settings or merging `frontend/vercel.json`, **push to GitHub** and **Redeploy** production.

> **If `/graph` still 404:** `frontend/vercel.json` is probably not on the branch Vercel builds. Run `git push origin main` and confirm the file appears on GitHub under `frontend/vercel.json`.

### Step 2 — Test build locally

```bash
cd frontend
npm run build
npx serve dist
```

Visit `http://localhost:3000/graph` — must load the graph page, not 404.

### Step 3 — Deploy via GitHub

1. [vercel.com](https://vercel.com) → **New Project** → import repo
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Deploy

### Step 4 — Environment variable

Vercel → Project → **Settings** → **Environment Variables**

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://your-service.onrender.com` |

Redeploy after adding.

### Render cold start (free tier)

The API sleeps after ~15 minutes idle. The frontend **auto-pings** `/` and `/health` as soon as the landing page loads (see `frontend/index.html` + `warmBackend()` in `api.js`), so the instance often wakes while judges read the hero.

For extra reliability before a live demo, use a free monitor (e.g. [UptimeRobot](https://uptimerobot.com)) to hit `https://memoryweave.onrender.com/health` every **10 minutes**.

### Step 5 — Verify

- [ ] `your-app.vercel.app` — landing page
- [ ] `your-app.vercel.app/graph` — graph loads (no 404 on refresh)
- [ ] DevTools **Network** — `/graph` requests go to Render URL
- [ ] No CORS errors (backend allows `*` by default, or set `ALLOWED_ORIGINS`)

### Step 6 — Update README

Replace placeholder demo links in `README.md` with your Vercel + Render URLs.

---

## Local vs production

| | Local | Render |
|---|--------|--------|
| Neo4j | Docker `bolt://localhost:7687` | Aura `neo4j+s://…` |
| Chroma | `chroma run` + `CHROMA_MODE=http` (default) | `CHROMA_MODE=inmemory` |
| API | `http://127.0.0.1:8000` | `https://*.onrender.com` |

See also: [LOCAL_SETUP.md](LOCAL_SETUP.md)
