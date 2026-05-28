"""
coral_setup.py

Boot-time Coral source registration for production (Render/Docker).
Wraps coral/install_sources.sh using Render env vars (NEO4J_*, no .env file).

Used by: main.py startup
Depends on: coral/install_sources.sh, CORAL_CONFIG_DIR
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_INSTALL_SCRIPT = _BACKEND_ROOT / "coral" / "install_sources.sh"


def ensure_coral_sources() -> dict[str, str]:
    """
    Register MemoryWeave Coral sources if CORAL_AUTO_SETUP is enabled.

    Returns status dict for logging / health checks.
    """
    auto = os.getenv("CORAL_AUTO_SETUP", "true").lower()
    if auto in {"0", "false", "no"}:
        return {"status": "skipped", "reason": "CORAL_AUTO_SETUP disabled"}

    config_dir = Path(os.getenv("CORAL_CONFIG_DIR", str(_BACKEND_ROOT / ".coral_config")))
    config_dir.mkdir(parents=True, exist_ok=True)
    os.environ["CORAL_CONFIG_DIR"] = str(config_dir)

    cli = os.getenv("CORAL_CLI_PATH", "coral")
    try:
        ver = subprocess.run(
            [cli, "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=str(_BACKEND_ROOT),
        )
        if ver.returncode != 0:
            return {"status": "error", "reason": "coral CLI not found"}
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        return {"status": "error", "reason": str(exc)}

    if not _INSTALL_SCRIPT.is_file():
        return {"status": "error", "reason": f"missing {_INSTALL_SCRIPT}"}

    env = os.environ.copy()
    env["PATH"] = os.pathsep.join(
        filter(
            None,
            [
                str(Path.home() / ".local" / "bin"),
                "/usr/local/bin",
                env.get("PATH", ""),
            ],
        )
    )

    try:
        result = subprocess.run(
            ["bash", str(_INSTALL_SCRIPT)],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(_BACKEND_ROOT),
            env=env,
        )
        tail = (result.stdout or result.stderr or "")[-600:]
        if result.returncode != 0:
            return {"status": "error", "reason": tail or f"exit {result.returncode}"}
        return {"status": "ok", "detail": tail[-200:]}
    except subprocess.TimeoutExpired:
        return {"status": "error", "reason": "install_sources.sh timed out"}
