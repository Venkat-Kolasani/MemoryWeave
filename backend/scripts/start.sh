#!/usr/bin/env bash
# Production start: ensure Coral on PATH, then uvicorn (Coral sources register in main.py startup).
set -euo pipefail

cd "$(dirname "$0")/.."

export PATH="${HOME}/.local/bin:/usr/local/bin:${PATH}"
export CORAL_CONFIG_DIR="${CORAL_CONFIG_DIR:-$(pwd)/.coral_config}"
export CORAL_AUTO_SETUP="${CORAL_AUTO_SETUP:-true}"
export CORAL_SKIP_TESTS="${CORAL_SKIP_TESTS:-1}"

mkdir -p "${CORAL_CONFIG_DIR}"

echo "[coral] $(coral --version 2>/dev/null || echo 'CLI not found — build must run install_coral_cli.sh')"

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
