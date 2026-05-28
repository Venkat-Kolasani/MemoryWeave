"""
neo4j_service.py
Handles all Neo4j database operations for MemoryWeave.
Provides node creation, relationship linking, and graph query functions.
"""

from __future__ import annotations

import os
from collections import defaultdict
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


NODE_COLORS = {
    "person": "oklch(50% 0.12 240)",
    "system": "oklch(52% 0.14 160)",
    "incident": "oklch(50% 0.16 25)",
    "workflow": "oklch(60% 0.14 65)",
}

LABEL_TO_TYPE = {
    "Person": "person",
    "System": "system",
    "Workflow": "workflow",
    "Incident": "incident",
}


def _neo4j_env(key: str, default: str = "") -> str:
    """Read Neo4j env var with whitespace stripped (avoids Render paste issues)."""
    return os.getenv(key, default).strip()


def neo4j_username() -> str:
    """
    Aura download files use NEO4J_USERNAME; local Docker uses NEO4J_USER=neo4j.
  Accept either env var name.
    """
    return _neo4j_env("NEO4J_USER") or _neo4j_env("NEO4J_USERNAME", "neo4j")


class Neo4jService:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            _neo4j_env("NEO4J_URI", "bolt://localhost:7687"),
            auth=(
                neo4j_username(),
                _neo4j_env("NEO4J_PASSWORD", "memoryweave"),
            ),
        )

    def close(self):
        self.driver.close()

    def init_schema(self):
        """Create constraints and indexes. Safe to run multiple times."""
        statements = [
            "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT system_id IF NOT EXISTS FOR (n:System) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT workflow_id IF NOT EXISTS FOR (n:Workflow) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT incident_id IF NOT EXISTS FOR (n:Incident) REQUIRE n.id IS UNIQUE",
            "CREATE INDEX person_name IF NOT EXISTS FOR (n:Person) ON (n.name)",
            "CREATE INDEX system_name IF NOT EXISTS FOR (n:System) ON (n.name)",
            "CREATE INDEX workflow_name IF NOT EXISTS FOR (n:Workflow) ON (n.name)",
            "CREATE INDEX incident_title IF NOT EXISTS FOR (n:Incident) ON (n.title)",
        ]
        with self.driver.session() as session:
            for statement in statements:
                session.run(statement)

    def create_person(
        self, id: str, name: str, team: str, role: str, risk_score: float = 0.0
    ):
        """Upsert a Person node. MERGE on id to avoid duplicates."""
        query = """
        MERGE (p:Person {id: $id})
        SET p.name = $name,
            p.team = $team,
            p.role = $role,
            p.risk_score = $risk_score,
            p.sublabel = $role,
            p.color = $color,
            p.updated_at = datetime()
        RETURN p
        """
        return self._single(
            query,
            {
                "id": id,
                "name": name,
                "team": team,
                "role": role,
                "risk_score": risk_score,
                "color": NODE_COLORS["person"],
            },
        )

    def create_system(
        self,
        id: str,
        name: str,
        system_type: str,
        criticality: str,
        status: str,
        description: str,
    ):
        """Upsert a System node."""
        query = """
        MERGE (s:System {id: $id})
        SET s.name = $name,
            s.type = $type,
            s.criticality = $criticality,
            s.status = $status,
            s.description = $description,
            s.sublabel = $type,
            s.color = $color,
            s.updated_at = datetime()
        RETURN s
        """
        return self._single(
            query,
            {
                "id": id,
                "name": name,
                "type": system_type,
                "criticality": criticality,
                "status": status,
                "description": description,
                "color": NODE_COLORS["system"],
            },
        )

    def create_workflow(
        self,
        id: str,
        name: str,
        steps_count: int,
        documented: bool,
        owner: str,
        last_run: str,
    ):
        """Upsert a Workflow node."""
        query = """
        MERGE (w:Workflow {id: $id})
        SET w.name = $name,
            w.steps_count = $steps_count,
            w.documented = $documented,
            w.owner = $owner,
            w.last_run = $last_run,
            w.sublabel = CASE WHEN $documented THEN 'Documented' ELSE 'Undocumented' END,
            w.color = $color,
            w.updated_at = datetime()
        RETURN w
        """
        return self._single(
            query,
            {
                "id": id,
                "name": name,
                "steps_count": steps_count,
                "documented": documented,
                "owner": owner,
                "last_run": last_run,
                "color": NODE_COLORS["workflow"],
            },
        )

    def create_incident(
        self,
        id: str,
        title: str,
        severity: str,
        date: str,
        duration: int,
        resolved_by: str,
    ):
        """Upsert an Incident node."""
        query = """
        MERGE (i:Incident {id: $id})
        SET i.title = $title,
            i.name = $id,
            i.severity = $severity,
            i.date = $date,
            i.duration = $duration,
            i.resolved_by = $resolved_by,
            i.sublabel = toString($duration) + 'min ' + $severity,
            i.color = $color,
            i.updated_at = datetime()
        RETURN i
        """
        return self._single(
            query,
            {
                "id": id,
                "title": title,
                "severity": severity,
                "date": date,
                "duration": duration,
                "resolved_by": resolved_by,
                "color": NODE_COLORS["incident"],
            },
        )

    def link_person_owns_workflow(
        self, person_id: str, workflow_id: str, weight: float = 1.0
    ):
        """Create OWNS relationship between Person and Workflow."""
        query = """
        MATCH (p:Person {id: $person_id}), (w:Workflow {id: $workflow_id})
        MERGE (p)-[r:OWNS]->(w)
        SET r.weight = $weight, r.dashed = false
        RETURN r
        """
        return self._single(
            query,
            {"person_id": person_id, "workflow_id": workflow_id, "weight": weight},
        )

    def link_person_resolves_incident(
        self,
        person_id: str,
        incident_id: str,
        weight: float = 1.8,
        dashed: bool = False,
    ):
        """Create RESOLVES relationship."""
        query = """
        MATCH (p:Person {id: $person_id}), (i:Incident {id: $incident_id})
        MERGE (p)-[r:RESOLVES]->(i)
        SET r.weight = $weight, r.dashed = $dashed
        RETURN r
        """
        return self._single(
            query,
            {
                "person_id": person_id,
                "incident_id": incident_id,
                "weight": weight,
                "dashed": dashed,
            },
        )

    def link_person_knows_system(
        self,
        person_id: str,
        system_id: str,
        confidence: float = 1.0,
        weight: Optional[float] = None,
    ):
        """Create KNOWS relationship."""
        query = """
        MATCH (p:Person {id: $person_id}), (s:System {id: $system_id})
        MERGE (p)-[r:KNOWS]->(s)
        SET r.confidence = $confidence,
            r.weight = coalesce($weight, CASE WHEN $confidence >= 0.9 THEN 2.0 ELSE 1.5 END),
            r.dashed = false
        RETURN r
        """
        return self._single(
            query,
            {
                "person_id": person_id,
                "system_id": system_id,
                "confidence": confidence,
                "weight": weight,
            },
        )

    def link_system_depends_on(
        self,
        system_id: str,
        depends_on_id: str,
        weight: float = 1.2,
        dashed: bool = True,
    ):
        """Create DEPENDS_ON relationship between Systems."""
        query = """
        MATCH (s:System {id: $system_id}), (d:System {id: $depends_on_id})
        MERGE (s)-[r:DEPENDS_ON]->(d)
        SET r.weight = $weight, r.dashed = $dashed
        RETURN r
        """
        return self._single(
            query,
            {
                "system_id": system_id,
                "depends_on_id": depends_on_id,
                "weight": weight,
                "dashed": dashed,
            },
        )

    def link_incident_affects_system(
        self,
        incident_id: str,
        system_id: str,
        weight: float = 1.5,
        dashed: bool = False,
    ):
        """Create AFFECTS relationship."""
        query = """
        MATCH (i:Incident {id: $incident_id}), (s:System {id: $system_id})
        MERGE (i)-[r:AFFECTS]->(s)
        SET r.weight = $weight, r.dashed = $dashed
        RETURN r
        """
        return self._single(
            query,
            {
                "incident_id": incident_id,
                "system_id": system_id,
                "weight": weight,
                "dashed": dashed,
            },
        )

    def link_workflow_depends_on_system(
        self, workflow_id: str, system_id: str, weight: float = 1.2, dashed: bool = True
    ):
        """Create DEPENDS_ON relationship between Workflow and System."""
        query = """
        MATCH (w:Workflow {id: $workflow_id}), (s:System {id: $system_id})
        MERGE (w)-[r:DEPENDS_ON]->(s)
        SET r.weight = $weight, r.dashed = $dashed
        RETURN r
        """
        return self._single(
            query,
            {
                "workflow_id": workflow_id,
                "system_id": system_id,
                "weight": weight,
                "dashed": dashed,
            },
        )

    def link_people_work_together(
        self, person_id: str, other_person_id: str, weight: float = 1.0
    ):
        """Create weak person-to-person collaboration relationship."""
        query = """
        MATCH (p1:Person {id: $person_id}), (p2:Person {id: $other_person_id})
        MERGE (p1)-[r:WORKS_WITH]->(p2)
        SET r.weight = $weight, r.dashed = true
        RETURN r
        """
        return self._single(
            query,
            {
                "person_id": person_id,
                "other_person_id": other_person_id,
                "weight": weight,
            },
        )

    def clear_database(self):
        """Delete all nodes and relationships. Intended for demo seeding only."""
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")

    def set_visual_properties(
        self,
        node_id: str,
        x: int,
        y: int,
        r: int,
        label: Optional[str] = None,
        **details,
    ):
        """Store frontend graph layout/details on a seeded node."""
        label_prefix = self._label_prefix(label)
        query = f"""
        MATCH (n{label_prefix} {{id: $node_id}})
        SET n.x = $x, n.y = $y, n.r = $r, n += $details
        RETURN n
        """
        return self._single(
            query, {"node_id": node_id, "x": x, "y": y, "r": r, "details": details}
        )

    def get_all_nodes(self) -> list[dict]:
        """Return all nodes formatted for frontend graph visualization."""
        query = """
        MATCH (n)
        RETURN n, labels(n) AS labels
        ORDER BY n.id
        """
        with self.driver.session() as session:
            records = list(session.run(query))

        layout_slots: dict[str, int] = defaultdict(int)
        layout_totals: dict[str, int] = defaultdict(int)
        prepared = []
        for record in records:
            node = dict(record["n"])
            node_type = self._node_type(record["labels"])
            row_key = self._layout_row_key(node_type)
            if node.get("x") is None or node.get("y") is None:
                layout_totals[row_key] += 1
            prepared.append((node, node_type, row_key))

        nodes = []
        for node, node_type, row_key in prepared:
            row_index = layout_slots[row_key]
            if node.get("x") is None or node.get("y") is None:
                layout_slots[row_key] += 1
            x, y = self._layout_position(
                node, node_type, row_index, layout_totals[row_key]
            )
            label = node.get("name") or node.get("title") or node.get("id")
            details = self._node_details(node)
            nodes.append(
                {
                    "id": node["id"],
                    "type": node_type,
                    "label": label,
                    "sublabel": node.get("sublabel", ""),
                    "x": x,
                    "y": y,
                    "r": node.get("r") or self._radius(node_type, node),
                    "color": node.get("color") or NODE_COLORS[node_type],
                    "details": details,
                }
            )
        return nodes

    def get_all_edges(self) -> list[dict]:
        """Return all relationships as edges for frontend graph."""
        query = """
        MATCH (a)-[r]->(b)
        RETURN a.id AS from_id, b.id AS to_id, type(r) AS type, properties(r) AS props
        ORDER BY from_id, to_id, type
        """
        with self.driver.session() as session:
            records = session.run(query)
            edges = []
            for record in records:
                props = record["props"]
                edges.append(
                    {
                        "from": record["from_id"],
                        "to": record["to_id"],
                        "weight": props.get("weight", 1.0),
                        "dashed": props.get("dashed", False),
                        "type": record["type"],
                    }
                )
        return edges

    def get_entity(self, entity_id: str) -> dict:
        """Return node + all connected relationships for detail panel."""
        query = """
        MATCH (n {id: $entity_id})
        OPTIONAL MATCH (n)-[out]->(to)
        OPTIONAL MATCH (from)-[in]->(n)
        RETURN n,
               labels(n) AS labels,
               collect(DISTINCT {
                 direction: 'out',
                 type: type(out),
                 node_id: to.id,
                 node_name: coalesce(to.name, to.title, to.id),
                 properties: properties(out)
               }) AS outgoing,
               collect(DISTINCT {
                 direction: 'in',
                 type: type(in),
                 node_id: from.id,
                 node_name: coalesce(from.name, from.title, from.id),
                 properties: properties(in)
               }) AS incoming
        """
        with self.driver.session() as session:
            record = session.run(query, {"entity_id": entity_id}).single()
        if not record:
            return {}

        node = dict(record["n"])
        return {
            "entity": {
                "id": node["id"],
                "type": self._node_type(record["labels"]),
                "label": node.get("name") or node.get("title") or node["id"],
                "sublabel": node.get("sublabel", ""),
                "details": self._node_details(node),
            },
            "relationships": [
                rel
                for rel in record["outgoing"] + record["incoming"]
                if rel["type"] is not None
            ],
        }

    def get_risk_data(self) -> list[dict]:
        """Return people with system ownership counts and incident resolution counts."""
        query = """
        MATCH (p:Person)
        OPTIONAL MATCH (p)-[:KNOWS]->(s:System)
        WITH p, count(DISTINCT s) AS system_count
        OPTIONAL MATCH (p)-[:OWNS]->(w:Workflow)
        WITH p, system_count, count(DISTINCT w) AS workflow_count
        OPTIONAL MATCH (p)-[:RESOLVES]->(i:Incident)
        WITH p, system_count, workflow_count, count(DISTINCT i) AS incident_count
        OPTIONAL MATCH (p)-[r]-()
        RETURN p.id AS id,
               p.name AS name,
               p.team AS team,
               p.role AS role,
               p.risk_score AS risk_score,
               system_count,
               workflow_count,
               incident_count,
               count(r) AS connection_count
        ORDER BY risk_score DESC, connection_count DESC
        """
        with self.driver.session() as session:
            return [dict(record) for record in session.run(query)]

    def count_nodes_and_relationships(self) -> dict:
        """Return aggregate graph counts."""
        query = """
        MATCH (n)
        WITH count(n) AS nodes
        OPTIONAL MATCH ()-[r]->()
        RETURN nodes, count(r) AS relationships
        """
        with self.driver.session() as session:
            record = session.run(query).single()
            return dict(record) if record else {"nodes": 0, "relationships": 0}

    def _single(self, query: str, params: Optional[dict] = None):
        with self.driver.session() as session:
            record = session.run(query, params or {}).single()
            return record[0] if record else None

    @staticmethod
    def _node_type(labels: list[str]) -> str:
        for label in labels:
            if label in LABEL_TO_TYPE:
                return LABEL_TO_TYPE[label]
        return "system"

    @staticmethod
    def _label_prefix(label: Optional[str]) -> str:
        if label is None:
            return ""
        if label not in LABEL_TO_TYPE:
            raise ValueError(f"Unsupported Neo4j label: {label}")
        return f":{label}"

    @staticmethod
    def _layout_row_key(node_type: str) -> str:
        if node_type in {"incident", "workflow"}:
            return "operational"
        return node_type

    @staticmethod
    def _layout_position(
        node: dict, node_type: str, row_index: int, row_count: int
    ) -> tuple[int, int]:
        if node.get("x") is not None and node.get("y") is not None:
            return node["x"], node["y"]

        row_y = {
            "person": 140,
            "system": 230,
            "incident": 320,
            "workflow": 320,
        }.get(node_type, 320)
        if row_count <= 1:
            return 420, row_y

        left = 100
        right = 740
        spacing = (right - left) / (row_count - 1)
        return round(left + row_index * spacing), row_y

    @staticmethod
    def _radius(node_type: str, node: dict) -> int:
        if node_type == "person":
            return 16 + round(float(node.get("risk_score") or 0) / 10)
        if node_type == "system":
            return 18 if node.get("criticality") == "P0" else 14
        if node_type == "incident":
            return 13 if node.get("severity") == "P0" else 11
        return 12

    @staticmethod
    def _node_details(node: dict) -> dict:
        excluded = {
            "id",
            "name",
            "x",
            "y",
            "r",
            "color",
            "sublabel",
            "updated_at",
        }
        return {key: value for key, value in node.items() if key not in excluded}
