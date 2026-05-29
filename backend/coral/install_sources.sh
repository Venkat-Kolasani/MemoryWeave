#!/usr/bin/env bash
# Install MemoryWeave Coral sources (run from backend/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/.local/bin:/usr/local/bin:${PATH}"

if ! command -v coral >/dev/null 2>&1; then
  echo "Install Coral: brew install withcoral/tap/coral  OR  curl -fsSL https://withcoral.com/install.sh | sh"
  exit 1
fi

if [[ -n "${CORAL_CONFIG_DIR:-}" ]]; then
  mkdir -p "${CORAL_CONFIG_DIR}"
  export CORAL_CONFIG_DIR
fi

if [[ -f .env ]]; then
  # Load backend/.env without letting a stale shell NEO4J_URI override the file.
  eval "$(python3 -c "
from pathlib import Path
for line in Path('.env').read_text().splitlines():
    line = line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    print(f'export {key}={value!r}')
")"
fi

export NEO4J_URL="${NEO4J_URL:-$(echo "${NEO4J_URI:-}" | sed 's|^neo4j+s://|https://|;s|^bolt://|http://|')}"
# Docker Neo4j: Bolt is :7687, HTTP transactional API is :7474 (Coral uses HTTP).
if [[ "$NEO4J_URL" == *localhost:7687* ]]; then
  NEO4J_URL="${NEO4J_URL/:7687/:7474}"
fi
export NEO4J_URL
export NEO4J_USERNAME="${NEO4J_USERNAME:-${NEO4J_USER:-neo4j}}"
# Aura HTTP transactional endpoint usually uses the database name "neo4j".
# Do not default to NEO4J_USER/instance id; Aura rejects /db/<instance-id>/tx/commit with 403.
export NEO4J_DATABASE="${NEO4J_DATABASE:-neo4j}"

if [[ "$NEO4J_URL" == *localhost* ]]; then
  echo "Note: using Neo4j HTTP at ${NEO4J_URL} (start Docker Neo4j or set Aura https URL in .env)."
fi

DATA_URI="$(python3 -c "from pathlib import Path; print((Path('${ROOT}') / 'coral/data').resolve().as_uri() + '/')")"
GRAPH_MANIFEST="$(mktemp)"
DEMO_MANIFEST="$(mktemp)"
sed "s|file://__MEMORYWEAVE_CORAL_DATA__/|${DATA_URI}|g" coral/manifests/memoryweave_graph.yaml > "$GRAPH_MANIFEST"
sed "s|file://__MEMORYWEAVE_CORAL_DATA__/|${DATA_URI}|g" coral/manifests/memoryweave_demo.yaml > "$DEMO_MANIFEST"

echo "Coral CLI: $(coral --version)"
coral source lint "$GRAPH_MANIFEST"
coral source lint "$DEMO_MANIFEST"

coral source remove memoryweave_graph 2>/dev/null || true
coral source remove memoryweave_demo 2>/dev/null || true

coral source add --file "$GRAPH_MANIFEST"
coral source add --file "$DEMO_MANIFEST"

rm -f "$GRAPH_MANIFEST" "$DEMO_MANIFEST"

if [[ "${CORAL_SKIP_TESTS:-0}" != "1" ]]; then
  coral source test memoryweave_graph || echo "[coral] warn: graph test failed"
  coral source test memoryweave_demo || echo "[coral] warn: demo test failed"
fi

# ── GitHub: live API (github.issues) when token present, else JSONL github_issues ──
GITHUB_MODE="file"
CORAL_MODE_FILE="${CORAL_CONFIG_DIR:-$ROOT/.coral_config}/github_mode"
mkdir -p "$(dirname "$CORAL_MODE_FILE")"

# Drop bundled github when using file mode so /coral-schema matches github_mode=file.
coral source remove github 2>/dev/null || true

if [[ -n "${GITHUB_TOKEN:-}" ]] && [[ "${CORAL_GITHUB_FORCE_FILE:-0}" != "1" ]]; then
  if coral source add github 2>/dev/null; then
    if [[ "${CORAL_SKIP_TESTS:-0}" != "1" ]]; then
      coral source test github 2>/dev/null || echo "[coral] warn: github API test failed — using file fallback"
    fi
  fi
  if coral sql --format json \
    "SELECT number, title FROM github.issues WHERE owner = 'Venkat-Kolasani' AND repo = 'MemoryWeave' AND state = 'all' LIMIT 1" \
    2>/dev/null | grep -q number; then
    GITHUB_MODE="hybrid"
    echo "[coral] GitHub hybrid: live github.issues + demo_supplement JSONL"
  else
    coral source remove github 2>/dev/null || true
    echo "[coral] warn: GITHUB_TOKEN set but github.issues query failed — using memoryweave_demo.github_issues"
  fi
else
  echo "[coral] No GITHUB_TOKEN (or CORAL_GITHUB_FORCE_FILE=1) — using memoryweave_demo.github_issues"
fi

echo "$GITHUB_MODE" > "$CORAL_MODE_FILE"
export CORAL_GITHUB_MODE="$GITHUB_MODE"

if [[ "${CORAL_SKIP_TESTS:-0}" != "1" ]] && [[ "$GITHUB_MODE" == "file" ]]; then
  coral source test memoryweave_demo 2>/dev/null || true
fi

echo ""
echo "Tables:"
coral sql --format table \
  "SELECT schema_name, table_name FROM coral.tables \
   WHERE table_name IN ('knowledge_nodes','knowledge_edges','incident_reports','slack_messages','github_issues','issues') \
   ORDER BY schema_name, table_name" || true
