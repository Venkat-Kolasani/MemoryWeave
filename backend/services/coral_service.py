"""
coral_service.py

Thin Python wrapper around the Coral CLI.
Invokes `coral sql` as a subprocess and parses JSON results.
Provides typed methods for each canonical query in coral/queries.py.

Design choice: subprocess over a Python SDK because Coral is primarily a CLI tool.
This is intentional — Coral's MCP integration also works via subprocess/CLI.

Graceful degradation: if Coral CLI is not found, available = False.
All callers check coral.available before calling query methods.

Used by: routers/coral_query.py, main.py
Depends on: coral/queries.py, installed Coral sources (coral/install_sources.sh)
"""

from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path
from typing import Any, Optional

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
CORAL_CLI = os.environ.get("CORAL_CLI_PATH", "coral")
_GITHUB_OWNER = "Venkat-Kolasani"
_GITHUB_REPO = "MemoryWeave"

_QUERY_TIMEOUT_SEC = 45
_SCHEMA_TIMEOUT_SEC = 20
_VERSION_TIMEOUT_SEC = 5

# Cached at startup — /health reads this instead of spawning Coral per request.
_coral_health_status: str = "unknown"
_coral_instance: Optional["CoralService"] = None

# Reject SQL injection patterns in user-supplied literals (Coral CLI has no --param).
_UNSAFE_SQL_PARAM = re.compile(r"[;]|--|/\*|\*/|\\|\x00")
_SAFE_PARAM_CHARS = re.compile(r"^[\w\s\-\.]+$", re.UNICODE)


def get_coral_health_status() -> str:
    """Last-known Coral status from startup probe (ok | cli_not_found | error: …)."""
    return _coral_health_status


def set_coral_health_status(status: str) -> None:
    """Update cached Coral status (called from startup and optional deep health)."""
    global _coral_health_status
    _coral_health_status = status


def get_coral_service() -> "CoralService":
    """Module-level singleton — avoids re-running `coral --version` on every request."""
    global _coral_instance
    if _coral_instance is None:
        _coral_instance = CoralService()
    return _coral_instance


def get_mcp_config() -> dict[str, Any]:
    """
    MCP server configuration block for Claude Desktop / Cursor.

    Copy-paste into the client's mcpServers section. Used by GET /coral-mcp-config.
    """
    sources_path = str((_BACKEND_ROOT / "coral" / "sources.yaml").resolve())
    return {
        "mcpServers": {
            "memoryweave-coral": {
                "command": CORAL_CLI,
                "args": ["mcp", "--sources", sources_path],
                "description": (
                    "MemoryWeave Coral SQL layer — knowledge_nodes, knowledge_edges, "
                    "incident_reports, slack_messages, github.issues (live API when configured)"
                ),
            }
        }
    }


def check_mcp_available() -> bool:
    """Return True when `coral mcp --help` succeeds (same binary as CLI SQL path)."""
    try:
        result = subprocess.run(
            [CORAL_CLI, "mcp", "--help"],
            capture_output=True,
            text=True,
            timeout=_VERSION_TIMEOUT_SEC,
            cwd=str(_BACKEND_ROOT),
            env=_coral_env(),
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return False


def probe_coral_health(*, run_sql_smoke_test: bool = False) -> str:
    """
    Check Coral CLI once (optionally run a lightweight SQL smoke test).
    Intended for startup and /health/deep — not per-request /health.
    """
    svc = get_coral_service()
    if not svc.available:
        status = "cli_not_found"
        set_coral_health_status(status)
        return status

    if run_sql_smoke_test:
        try:
            svc.query(
                "SELECT COUNT(*) AS n FROM memoryweave_graph.knowledge_nodes",
                timeout_sec=10,
            )
        except Exception as exc:
            status = f"error: {exc}"
            set_coral_health_status(status)
            return status

    set_coral_health_status("ok")
    return "ok"


def _coral_env() -> dict[str, str]:
    """Subprocess env: config dir + PATH for Render/Docker Coral binary."""
    env = os.environ.copy()
    config_dir = os.getenv("CORAL_CONFIG_DIR", str(_BACKEND_ROOT / ".coral_config"))
    env["CORAL_CONFIG_DIR"] = config_dir
    extra = os.pathsep.join(
        [
            str(Path.home() / ".local" / "bin"),
            "/usr/local/bin",
            env.get("PATH", ""),
        ]
    )
    env["PATH"] = extra
    return env


def sanitize_sql_param(value: str, *, max_len: int = 64) -> str:
    """
    Escape a value embedded in a SQL string literal.

    Rejects comment sequences, semicolons, and non-alphanumeric entity tokens.
    Single quotes are doubled per SQL standard.
    """
    if not value or not isinstance(value, str):
        raise ValueError("empty SQL parameter")

    cleaned = value.strip()[:max_len]
    if _UNSAFE_SQL_PARAM.search(cleaned):
        raise ValueError("invalid SQL parameter: forbidden characters")
    if not _SAFE_PARAM_CHARS.fullmatch(cleaned):
        raise ValueError("invalid SQL parameter: unsupported characters")

    return cleaned.replace("'", "''")


def _apply_sql_params(sql: str, params: dict[str, Any]) -> str:
    """Substitute named placeholders with sanitized string literals."""
    safe = {key: sanitize_sql_param(str(val)) for key, val in params.items()}
    return sql.format(**safe)


class CoralService:
    """Subprocess bridge to the Coral SQL engine."""

    def __init__(self) -> None:
        self.available = self._check_available()

    def _check_available(self) -> bool:
        """Return True when `coral --version` succeeds."""
        try:
            result = subprocess.run(
                [CORAL_CLI, "--version"],
                capture_output=True,
                text=True,
                timeout=_VERSION_TIMEOUT_SEC,
                cwd=str(_BACKEND_ROOT),
                env=_coral_env(),
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def query(
        self,
        sql: str,
        params: Optional[dict[str, Any]] = None,
        *,
        timeout_sec: int = _QUERY_TIMEOUT_SEC,
    ) -> list[dict[str, Any]]:
        """
        Execute a SQL query via Coral CLI.

        Returns list of row dicts. Raises RuntimeError on CLI or parse failure.
        """
        if not self.available:
            raise RuntimeError(
                "Coral CLI not found. Install: brew install withcoral/tap/coral"
            )

        if params:
            sql = _apply_sql_params(sql, params)

        sql = sql.strip()
        cmd = [CORAL_CLI, "sql", "--format", "json", sql]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout_sec,
                cwd=str(_BACKEND_ROOT),
                env=_coral_env(),
            )
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError(
                f"Coral query timed out after {timeout_sec} seconds"
            ) from exc

        if result.returncode != 0:
            stderr = (result.stderr or result.stdout or "").strip()
            raise RuntimeError(f"Coral CLI error: {stderr[:400]}")

        return self._parse_json_rows(result.stdout)

    @staticmethod
    def _parse_json_rows(stdout: str) -> list[dict[str, Any]]:
        """Parse Coral JSON output (array of rows or {rows: [...]})."""
        text = stdout.strip()
        if not text:
            return []

        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Coral returned non-JSON output: {text[:200]}") from exc

        if isinstance(data, dict) and "rows" in data:
            rows = data["rows"]
            return rows if isinstance(rows, list) else []
        if isinstance(data, list):
            return [r for r in data if isinstance(r, dict)]
        return []

    def get_schema(self) -> dict[str, Any]:
        """
        Return catalog metadata for installed Coral sources (coral.tables / coral.columns).
        Used by SettingsPage to display connected SQL tables.
        """
        if not self.available:
            return {"available": False, "sources": []}

        try:
            tables = self.query(
                "SELECT schema_name, table_name, description "
                "FROM coral.tables "
                "WHERE schema_name IN ('memoryweave_graph', 'memoryweave_demo', 'github') "
                "ORDER BY schema_name, table_name",
                timeout_sec=_SCHEMA_TIMEOUT_SEC,
            )
            columns = self.query(
                "SELECT schema_name, table_name, column_name, data_type, description "
                "FROM coral.columns "
                "WHERE schema_name IN ('memoryweave_graph', 'memoryweave_demo', 'github') "
                "ORDER BY schema_name, table_name, ordinal_position "
                "LIMIT 500",
                timeout_sec=_SCHEMA_TIMEOUT_SEC,
            )
            return {
                "available": True,
                "tables": tables,
                "columns": columns,
            }
        except Exception as exc:
            return {"available": True, "sources": [], "error": str(exc)}

    def _load_queries(self) -> Any:
        """Import coral.queries without circular imports."""
        from coral import queries

        return queries

    def person_context(self, name: str) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.PERSON_FULL_CONTEXT, {"person_name": name})

    def system_risks(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.SYSTEM_RISK_REPORT)

    def incident_resolvers(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.INCIDENT_RESOLVER_CHAIN)

    def bus_factor(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.BUS_FACTOR_ANALYSIS)

    def full_context(self, keyword: str) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.FULL_OPERATIONAL_CONTEXT, {"keyword": keyword})

    def operational_overview(self) -> list[dict[str, Any]]:
        """Broad graph context when no entity keyword is extracted from the question."""
        queries = self._load_queries()
        return self.query(queries.OPERATIONAL_CONTEXT_OVERVIEW)

    def team_concentration(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.TEAM_KNOWLEDGE_CONCENTRATION)

    def undocumented_workflows(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.UNDOCUMENTED_WORKFLOW_RISK)

    def systems_without_backup(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.SYSTEMS_WITHOUT_BACKUP)

    def payment_recovery_context(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.PAYMENT_RECOVERY_CONTEXT)

    def auth_pipeline_ownership(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.AUTH_PIPELINE_OWNERSHIP)

    def incident_detail(self, incident_id: str) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.INCIDENT_DETAIL, {"incident_id": incident_id})

    def deployment_history_context(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.DEPLOYMENT_HISTORY_CONTEXT)

    def patel_absence_risk(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.PATEL_ABSENCE_RISK)

    def github_mode(self) -> str:
        """
        Return 'api' when live github.issues is active, else 'file' (JSONL fallback).

        Reads CORAL_GITHUB_MODE env or github_mode file written by install_sources.sh.
        """
        mode = os.getenv("CORAL_GITHUB_MODE", "").strip().lower()
        if mode in {"api", "file"}:
            return mode

        mode_file = Path(
            os.getenv("CORAL_CONFIG_DIR", str(_BACKEND_ROOT / ".coral_config"))
        ) / "github_mode"
        if mode_file.is_file():
            stored = mode_file.read_text(encoding="utf-8").strip().lower()
            if stored in {"api", "file"}:
                return stored

        return "file"

    def github_knowledge_cross_join(self) -> list[dict[str, Any]]:
        """Person × GitHub issues cross-source JOIN (live API or JSONL fallback)."""
        queries = self._load_queries()
        sql = (
            queries.GITHUB_KNOWLEDGE_CROSS_JOIN_API
            if self.github_mode() == "api"
            else queries.GITHUB_KNOWLEDGE_CROSS_JOIN_FILE
        )
        return self.query(sql)

    def github_issues_preview(self, *, limit: int = 5) -> list[dict[str, Any]]:
        """Lightweight GitHub issues sample for health / demo checks."""
        if self.github_mode() == "api":
            return self.query(
                "SELECT number, title, state, created_at "
                f"FROM github.issues "
                f"WHERE owner = '{_GITHUB_OWNER}' AND repo = '{_GITHUB_REPO}' "
                f"AND state = 'all' "
                f"ORDER BY created_at DESC LIMIT {int(limit)}"
            )
        return self.query(
            f"SELECT number, title, state, created_at "
            f"FROM memoryweave_demo.github_issues "
            f"ORDER BY created_at DESC LIMIT {int(limit)}"
        )
