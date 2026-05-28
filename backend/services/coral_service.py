"""
coral_service.py

Thin Python wrapper around the Coral CLI.
Invokes `coral sql` as a subprocess and parses JSON results.
Provides typed methods for each canonical query in coral/queries.py.

Design choice: subprocess over a Python SDK because Coral is primarily a CLI tool.
This is intentional — Coral's MCP integration also works via subprocess/CLI.

Graceful degradation: if Coral CLI is not found, available = False.
All callers check coral.available before calling query methods.

Used by: routers/coral_query.py
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
_QUERY_TIMEOUT_SEC = 45
_SCHEMA_TIMEOUT_SEC = 20


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
                timeout=5,
                cwd=str(_BACKEND_ROOT),
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def query(self, sql: str, params: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
        """
        Execute a SQL query via Coral CLI.

        Returns list of row dicts. Raises RuntimeError on CLI or parse failure.
        """
        if not self.available:
            raise RuntimeError(
                "Coral CLI not found. Install: brew install withcoral/tap/coral"
            )

        if params:
            sql = sql.format(**params)

        sql = sql.strip()
        cmd = [CORAL_CLI, "sql", "--format", "json", sql]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=_QUERY_TIMEOUT_SEC,
                cwd=str(_BACKEND_ROOT),
                env=os.environ.copy(),
            )
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("Coral query timed out after 45 seconds") from exc

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
                "WHERE schema_name IN ('memoryweave_graph', 'memoryweave_demo') "
                "ORDER BY schema_name, table_name"
            )
            columns = self.query(
                "SELECT schema_name, table_name, column_name, data_type, description "
                "FROM coral.columns "
                "WHERE schema_name IN ('memoryweave_graph', 'memoryweave_demo') "
                "ORDER BY schema_name, table_name, ordinal_position "
                "LIMIT 500"
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
        safe = re.sub(r"[{}]", "", name)
        return self.query(queries.PERSON_FULL_CONTEXT, {"person_name": safe})

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
        safe = re.sub(r"[{}]", "", keyword)
        return self.query(queries.FULL_OPERATIONAL_CONTEXT, {"keyword": safe})

    def team_concentration(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.TEAM_KNOWLEDGE_CONCENTRATION)

    def undocumented_workflows(self) -> list[dict[str, Any]]:
        queries = self._load_queries()
        return self.query(queries.UNDOCUMENTED_WORKFLOW_RISK)
