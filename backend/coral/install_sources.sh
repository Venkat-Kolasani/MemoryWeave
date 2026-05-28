#!/usr/bin/env bash
# Install MemoryWeave Coral sources (run from backend/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v coral >/dev/null 2>&1; then
  echo "Install Coral: brew install withcoral/tap/coral"
  exit 1
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
export NEO4J_DATABASE="${NEO4J_DATABASE:-neo4j}"

if [[ "$NEO4J_URL" == *localhost* ]]; then
  echo "Note: using Neo4j HTTP at ${NEO4J_URL} (start Docker Neo4j or set Aura https URL in .env)."
fi

DATA_URI="$(python3 -c "from pathlib import Path; print((Path('${ROOT}') / 'coral/data').resolve().as_uri() + '/')")"
DEMO_MANIFEST="$(mktemp)"
sed "s|file://__MEMORYWEAVE_CORAL_DATA__/|${DATA_URI}|g" coral/manifests/memoryweave_demo.yaml > "$DEMO_MANIFEST"

echo "Coral CLI: $(coral --version)"
coral source lint coral/manifests/memoryweave_graph.yaml
coral source lint "$DEMO_MANIFEST"

coral source remove memoryweave_graph 2>/dev/null || true
coral source remove memoryweave_demo 2>/dev/null || true

coral source add --file coral/manifests/memoryweave_graph.yaml
coral source add --file "$DEMO_MANIFEST"

rm -f "$DEMO_MANIFEST"

coral source test memoryweave_graph
coral source test memoryweave_demo

echo ""
echo "Tables:"
coral sql --format table "SELECT schema_name, table_name FROM coral.tables WHERE table_name IN ('knowledge_nodes','knowledge_edges','incident_reports','slack_messages') ORDER BY schema_name, table_name"
