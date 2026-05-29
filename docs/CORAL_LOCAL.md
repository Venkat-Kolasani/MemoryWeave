# MemoryWeave × Coral — Local Reproduction

Step-by-step guide to install Coral, register MemoryWeave sources, run cross-source SQL, and wire MCP for Claude Desktop.

---

## Install Coral CLI

### macOS

```bash
brew install withcoral/tap/coral
```

### Linux (Debian/Ubuntu with glibc 2.39+, e.g. Ubuntu 24.04)

```bash
curl -fsSL https://raw.githubusercontent.com/withcoral/coral/main/install.sh | bash
```

**Note:** Coral’s Linux binary requires **glibc 2.39+**. Ubuntu 22.04 (glibc 2.35) does **not** work. Use Ubuntu 24.04 or the Docker path below.

### Docker (any platform)

Build from `backend/Dockerfile` — Coral is installed during the Docker image build (`CORAL_VERSION=v0.4.1`, Trixie base for glibc compatibility).

### Verify

```bash
coral --version
# Expected: coral 0.4.x
```

---

## Register Coral Sources

```bash
cd backend
```

Export Neo4j credentials (Aura or local Docker):

```bash
export NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=your_password
```

Run the setup script (registers graph + demo manifests):

```bash
bash coral/install_sources.sh
```

Or via Python (same as Render boot):

```bash
python -c "from services.coral_setup import ensure_coral_sources; print(ensure_coral_sources())"
```

### Verify 4 tables registered

Coral 0.4.1 uses the SQL catalog — not the legacy `coral schema` subcommand:

```bash
coral sql --format table \
  "SELECT schema_name, table_name FROM coral.tables WHERE schema_name IN ('memoryweave_graph','memoryweave_demo') ORDER BY 1, 2"
```

Expected tables:

- `memoryweave_graph.knowledge_nodes`
- `memoryweave_graph.knowledge_edges`
- `memoryweave_demo.incident_reports`
- `memoryweave_demo.slack_messages`

---

## Run a Cross-Source Query

```bash
coral sql --format json \
  "SELECT n.name, e.to_name, e.rel_type, e.weight
   FROM memoryweave_graph.knowledge_nodes n
   JOIN memoryweave_graph.knowledge_edges e ON n.id = e.from_id
   WHERE n.type = 'Person'
   ORDER BY e.weight DESC
   LIMIT 5"
```

---

## Run the MemoryWeave API (Coral endpoints)

```bash
cd backend
source .venv/bin/activate   # if using venv
pip install -r requirements.txt
python data/seed.py
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Test:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/coral-schema
curl -X POST http://127.0.0.1:8000/coral-query \
  -H "Content-Type: application/json" \
  -d '{"question": "What breaks if Patel is out Monday?"}'
```

Frontend (separate terminal):

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://127.0.0.1:8000
npm install && npm run dev
```

Open http://localhost:5173/settings and http://localhost:5173/reports.

---

## MCP Setup (Claude Desktop)

### Option A — copy from running API

1. Start the backend (above).
2. Open http://localhost:5173/settings → **MCP Integration** → **Copy** JSON.
3. Paste into your MCP client config.

Or fetch directly:

```bash
curl http://127.0.0.1:8000/coral-mcp-config | python3 -m json.tool
```

### Option B — manual config

Add to Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "memoryweave-coral": {
      "command": "coral",
      "args": [
        "mcp",
        "--sources",
        "/absolute/path/to/MemoryWeave/backend/coral/sources.yaml"
      ],
      "description": "MemoryWeave Coral SQL layer — knowledge_nodes, knowledge_edges, incident_reports, slack_messages"
    }
  }
}
```

Replace `/absolute/path/to/MemoryWeave` with your clone path.

Restart Claude Desktop after saving.

### Verify MCP binary

```bash
coral mcp --help
```

If this fails, install or upgrade Coral CLI. Production on Render uses **CLI SQL subprocess** only; MCP is for local agent clients.

---

## Production (Render)

- Coral runs in Docker on Render (`python:3.11-slim-trixie` for glibc 2.39+).
- `CORAL_AUTO_SETUP=true` registers sources on boot via `services/coral_setup.py`.
- Verify: `GET https://memoryweave-1.onrender.com/health` → `"coral": "ok"`

| URL | Purpose |
|-----|---------|
| https://memoryweave-1.onrender.com/coral-schema | Table catalog |
| https://memoryweave-1.onrender.com/coral-report | Analytics |
| https://memoryweave-1.onrender.com/coral-mcp-config | MCP JSON block |
| https://memory-weave-ai.vercel.app/reports | Live SQL demo UI |
| https://memory-weave-ai.vercel.app/settings | MCP + schema UI |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `coral: command not found` | `brew install withcoral/tap/coral` or add `~/.local/bin` to PATH |
| Neo4j HTTP 403 on graph source | Use file-backed manifests (default on Render) or set `NEO4J_DATABASE=neo4j` for Aura |
| `coral schema` not found | Use `coral sql` against `coral.tables` (Coral 0.4.1) |
| MCP `available: false` on Render | Expected — use MCP locally; production uses `coral sql` subprocess |

See also: [FIXES_AND_LEARNINGS.md](FIXES_AND_LEARNINGS.md), [CORAL_INTEGRATION.md](CORAL_INTEGRATION.md).
