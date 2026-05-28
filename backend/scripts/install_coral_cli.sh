#!/usr/bin/env bash
# Install Coral CLI on Linux (Render build / Docker). Idempotent.
set -euo pipefail

INSTALL_DIR="${CORAL_INSTALL_DIR:-/usr/local/bin}"

if command -v coral >/dev/null 2>&1; then
  echo "[coral] CLI already installed: $(coral --version)"
  exit 0
fi

if [[ -x "${INSTALL_DIR}/coral" ]]; then
  export PATH="${INSTALL_DIR}:${PATH}"
  echo "[coral] CLI at ${INSTALL_DIR}/coral: $(coral --version)"
  exit 0
fi

echo "[coral] Installing CLI via https://withcoral.com/install.sh → ${INSTALL_DIR} ..."
export CORAL_INSTALL_DIR="${INSTALL_DIR}"
curl -fsSL https://withcoral.com/install.sh | sh

if [[ -x "${INSTALL_DIR}/coral" ]]; then
  chmod +x "${INSTALL_DIR}/coral"
  echo "[coral] Binary at ${INSTALL_DIR}/coral: $("${INSTALL_DIR}/coral" --version)"
  exit 0
fi

for dir in "${INSTALL_DIR}" "${HOME}/.local/bin" /usr/local/bin; do
  if [[ -x "${dir}/coral" ]]; then
    echo "[coral] Binary at ${dir}/coral"
    exit 0
  fi
done

echo "[coral] install.sh finished but coral binary not found on PATH" >&2
exit 1
