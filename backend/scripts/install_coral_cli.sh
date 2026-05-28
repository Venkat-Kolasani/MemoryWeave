#!/usr/bin/env bash
# Install Coral CLI on Linux (Render build / Docker). Idempotent.
set -euo pipefail

if command -v coral >/dev/null 2>&1; then
  echo "[coral] CLI already installed: $(coral --version)"
  exit 0
fi

echo "[coral] Installing CLI via https://withcoral.com/install.sh ..."
curl -fsSL https://withcoral.com/install.sh | sh

for dir in "${HOME}/.local/bin" /usr/local/bin; do
  if [[ -x "${dir}/coral" ]]; then
    echo "[coral] Binary at ${dir}/coral"
    exit 0
  fi
done

echo "[coral] install.sh finished but coral binary not found on PATH" >&2
exit 1
