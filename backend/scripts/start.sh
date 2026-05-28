#!/usr/bin/env bash
# Production start: ensure Coral on PATH, then uvicorn (Coral sources register in main.py startup).
set -euo pipefail

cd "$(dirname "$0")/.."

export PATH="/usr/local/bin:${HOME}/.local/bin:${PATH}"
export CORAL_CONFIG_DIR="${CORAL_CONFIG_DIR:-$(pwd)/.coral_config}"
export CORAL_AUTO_SETUP="${CORAL_AUTO_SETUP:-true}"
export CORAL_SKIP_TESTS="${CORAL_SKIP_TESTS:-1}"
export CORAL_INSTALL_DIR="${CORAL_INSTALL_DIR:-/usr/local/bin}"

mkdir -p "${CORAL_CONFIG_DIR}"

if ! command -v coral >/dev/null 2>&1; then
  echo "[coral] CLI missing on PATH — attempting install to ${CORAL_INSTALL_DIR} ..."
  bash scripts/install_coral_cli.sh || true
  export PATH="/usr/local/bin:${HOME}/.local/bin:${PATH}"
fi

echo "[coral] $(coral --version 2>/dev/null || echo 'CLI not found — check Docker build logs for install step')"

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
