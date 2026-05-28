"""
export_coral_graph.py

Regenerate Coral graph JSONL snapshots from the Acme Corp demo model.
Run after editing seed relationships: python backend/data/export_coral_graph.py

Used by: Coral file backend (memoryweave_graph manifests)
Depends on: backend/coral/data/*.jsonl output paths
"""

from __future__ import annotations

import json
from pathlib import Path

CORAL_DATA = Path(__file__).resolve().parents[1] / "coral" / "data"

NODES = [
    {
        "id": "p1",
        "name": "A. Patel",
        "type": "Person",
        "risk_score": 95.0,
        "team": "Engineering",
        "role": "Eng Lead",
        "criticality": "",
        "primary_owner": "",
        "backup_owner": "",
        "has_backup_owner": "true",
    },
    {
        "id": "p2",
        "name": "R. Chen",
        "type": "Person",
        "risk_score": 78.0,
        "team": "Engineering",
        "role": "Backend Eng",
        "criticality": "",
        "primary_owner": "",
        "backup_owner": "",
        "has_backup_owner": "true",
    },
    {
        "id": "p3",
        "name": "M. Kim",
        "type": "Person",
        "risk_score": 64.0,
        "team": "Data",
        "role": "Data Eng",
        "criticality": "",
        "primary_owner": "",
        "backup_owner": "",
        "has_backup_owner": "true",
    },
    {
        "id": "p4",
        "name": "T. Walsh",
        "type": "Person",
        "risk_score": 41.0,
        "team": "Infrastructure",
        "role": "DevOps",
        "criticality": "",
        "primary_owner": "",
        "backup_owner": "",
        "has_backup_owner": "true",
    },
    {
        "id": "p5",
        "name": "J. Brooks",
        "type": "Person",
        "risk_score": 28.0,
        "team": "Infrastructure",
        "role": "SRE",
        "criticality": "",
        "primary_owner": "",
        "backup_owner": "",
        "has_backup_owner": "true",
    },
    {
        "id": "s1",
        "name": "Payment API",
        "type": "System",
        "risk_score": 92.0,
        "team": "",
        "role": "",
        "criticality": "P0",
        "primary_owner": "A. Patel",
        "backup_owner": "",
        "has_backup_owner": "false",
    },
    {
        "id": "s2",
        "name": "Auth Service",
        "type": "System",
        "risk_score": 68.0,
        "team": "",
        "role": "",
        "criticality": "P0",
        "primary_owner": "R. Chen",
        "backup_owner": "J. Brooks",
        "has_backup_owner": "true",
    },
    {
        "id": "s3",
        "name": "Data Bus",
        "type": "System",
        "risk_score": 55.0,
        "team": "",
        "role": "",
        "criticality": "P1",
        "primary_owner": "M. Kim",
        "backup_owner": "R. Chen",
        "has_backup_owner": "true",
    },
    {
        "id": "s4",
        "name": "Deploy System",
        "type": "System",
        "risk_score": 74.0,
        "team": "",
        "role": "",
        "criticality": "P1",
        "primary_owner": "T. Walsh",
        "backup_owner": "",
        "has_backup_owner": "false",
    },
    {
        "id": "s5",
        "name": "Analytics",
        "type": "System",
        "risk_score": 38.0,
        "team": "",
        "role": "",
        "criticality": "P2",
        "primary_owner": "M. Kim",
        "backup_owner": "",
        "has_backup_owner": "false",
    },
    {
        "id": "w1",
        "name": "Deploy Flow",
        "type": "Workflow",
        "risk_score": 70.0,
        "team": "",
        "role": "",
        "criticality": "",
        "primary_owner": "T. Walsh",
        "backup_owner": "",
        "has_backup_owner": "false",
    },
    {
        "id": "w2",
        "name": "Rollback Proc",
        "type": "Workflow",
        "risk_score": 88.0,
        "team": "",
        "role": "",
        "criticality": "",
        "primary_owner": "A. Patel",
        "backup_owner": "",
        "has_backup_owner": "false",
    },
    {
        "id": "w3",
        "name": "Incident Resp",
        "type": "Workflow",
        "risk_score": 32.0,
        "team": "",
        "role": "",
        "criticality": "",
        "primary_owner": "J. Brooks",
        "backup_owner": "R. Chen",
        "has_backup_owner": "true",
    },
    {
        "id": "i1",
        "name": "P-4021",
        "type": "Incident",
        "risk_score": 0.0,
        "team": "",
        "role": "",
        "criticality": "P0",
        "primary_owner": "A. Patel",
        "backup_owner": "",
        "has_backup_owner": "",
    },
    {
        "id": "i2",
        "name": "P-3882",
        "type": "Incident",
        "risk_score": 0.0,
        "team": "",
        "role": "",
        "criticality": "P1",
        "primary_owner": "R. Chen",
        "backup_owner": "",
        "has_backup_owner": "",
    },
    {
        "id": "i3",
        "name": "P-3722",
        "type": "Incident",
        "risk_score": 0.0,
        "team": "",
        "role": "",
        "criticality": "P0",
        "primary_owner": "A. Patel",
        "backup_owner": "",
        "has_backup_owner": "",
    },
]

EDGES = [
    ("p1", "A. Patel", "Person", "OWNS", 2.0, "s1", "Payment API", "System"),
    ("p1", "A. Patel", "Person", "KNOWS", 2.0, "s1", "Payment API", "System"),
    ("p1", "A. Patel", "Person", "KNOWS", 1.4, "s2", "Auth Service", "System"),
    ("p1", "A. Patel", "Person", "RESOLVES", 1.8, "i1", "P-4021", "Incident"),
    ("p1", "A. Patel", "Person", "RESOLVES", 1.7, "i3", "P-3722", "Incident"),
    ("p1", "A. Patel", "Person", "OWNS", 1.5, "w2", "Rollback Proc", "Workflow"),
    ("p2", "R. Chen", "Person", "OWNS", 1.8, "s2", "Auth Service", "System"),
    ("p2", "R. Chen", "Person", "KNOWS", 1.8, "s2", "Auth Service", "System"),
    ("p2", "R. Chen", "Person", "BACKUP_FOR", 0.6, "s3", "Data Bus", "System"),
    ("p2", "R. Chen", "Person", "RESOLVES", 1.5, "i2", "P-3882", "Incident"),
    ("p3", "M. Kim", "Person", "OWNS", 1.5, "s3", "Data Bus", "System"),
    ("p3", "M. Kim", "Person", "KNOWS", 1.5, "s3", "Data Bus", "System"),
    ("p3", "M. Kim", "Person", "KNOWS", 1.2, "s5", "Analytics", "System"),
    ("p4", "T. Walsh", "Person", "OWNS", 1.8, "s4", "Deploy System", "System"),
    ("p4", "T. Walsh", "Person", "KNOWS", 1.8, "s4", "Deploy System", "System"),
    ("p4", "T. Walsh", "Person", "OWNS", 1.5, "w1", "Deploy Flow", "Workflow"),
    ("p5", "J. Brooks", "Person", "BACKUP_FOR", 0.7, "s2", "Auth Service", "System"),
    ("p5", "J. Brooks", "Person", "OWNS", 1.2, "w3", "Incident Resp", "Workflow"),
    ("p5", "J. Brooks", "Person", "RESOLVES", 0.8, "i1", "P-4021", "Incident"),
    ("s1", "Payment API", "System", "DEPENDS_ON", 1.2, "s2", "Auth Service", "System"),
    ("s2", "Auth Service", "System", "DEPENDS_ON", 1.0, "s3", "Data Bus", "System"),
    ("s3", "Data Bus", "System", "DEPENDS_ON", 1.0, "s5", "Analytics", "System"),
    ("i1", "P-4021", "Incident", "AFFECTS", 1.5, "s1", "Payment API", "System"),
    ("i2", "P-3882", "Incident", "AFFECTS", 1.2, "s2", "Auth Service", "System"),
    ("i3", "P-3722", "Incident", "AFFECTS", 1.4, "s1", "Payment API", "System"),
    ("w1", "Deploy Flow", "Workflow", "DEPENDS_ON", 1.5, "s4", "Deploy System", "System"),
    ("w2", "Rollback Proc", "Workflow", "DEPENDS_ON", 1.2, "s1", "Payment API", "System"),
    ("w3", "Incident Resp", "Workflow", "DEPENDS_ON", 1.0, "s2", "Auth Service", "System"),
    ("p1", "A. Patel", "Person", "WORKS_WITH", 1.0, "p2", "R. Chen", "Person"),
    ("p3", "M. Kim", "Person", "WORKS_WITH", 0.8, "p2", "R. Chen", "Person"),
    ("s4", "Deploy System", "System", "DEPENDS_ON", 1.2, "s1", "Payment API", "System"),
]


def _write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    edge_rows = [
        {
            "from_id": fid,
            "from_name": fname,
            "from_type": ftype,
            "rel_type": rel,
            "weight": weight,
            "to_id": tid,
            "to_name": tname,
            "to_type": ttype,
        }
        for fid, fname, ftype, rel, weight, tid, tname, ttype in EDGES
    ]
    _write_jsonl(CORAL_DATA / "knowledge_nodes.jsonl", NODES)
    _write_jsonl(CORAL_DATA / "knowledge_edges.jsonl", edge_rows)
    print(f"Wrote {len(NODES)} nodes and {len(edge_rows)} edges to {CORAL_DATA}")


if __name__ == "__main__":
    main()
