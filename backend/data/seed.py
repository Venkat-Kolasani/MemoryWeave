"""
seed.py — Acme Corp demo data seeder.
Run: python backend/data/seed.py
Clears all data then seeds Acme Corp graph.
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.neo4j_service import Neo4jService


PEOPLE = [
    {
        "id": "p1",
        "name": "A. Patel",
        "team": "Engineering",
        "role": "Eng Lead",
        "risk_score": 95.0,
        "x": 160,
        "y": 140,
        "r": 26,
        "systems": "Payment API, Auth Service",
        "incidents": "8 P0s resolved",
        "risk": "CRITICAL - 95% bus factor",
    },
    {
        "id": "p2",
        "name": "R. Chen",
        "team": "Engineering",
        "role": "Backend Eng",
        "risk_score": 78.0,
        "x": 300,
        "y": 230,
        "r": 22,
        "systems": "Auth Service, Data Bus",
        "incidents": "P-3882 resolved in source corpus",
        "risk": "HIGH - 78% auth ownership",
    },
    {
        "id": "p3",
        "name": "M. Kim",
        "team": "Data",
        "role": "Data Eng",
        "risk_score": 64.0,
        "x": 480,
        "y": 120,
        "r": 20,
        "systems": "Data Bus, Analytics",
        "risk": "MEDIUM",
    },
    {
        "id": "p4",
        "name": "T. Walsh",
        "team": "Infrastructure",
        "role": "DevOps",
        "risk_score": 41.0,
        "x": 580,
        "y": 280,
        "r": 18,
        "systems": "Deploy System",
        "risk": "LOW",
    },
    {
        "id": "p5",
        "name": "J. Brooks",
        "team": "Infrastructure",
        "role": "SRE",
        "risk_score": 28.0,
        "x": 100,
        "y": 300,
        "r": 16,
        "systems": "Monitoring",
        "risk": "LOW",
    },
]

SYSTEMS = [
    {
        "id": "s1",
        "name": "Payment API",
        "type": "Production",
        "criticality": "P0",
        "status": "Healthy",
        "description": "Checkout and Stripe webhook API for Acme Corp payments.",
        "x": 280,
        "y": 110,
        "r": 18,
        "owner": "A. Patel (sole)",
        "dependents": 4,
        "documented": "No",
        "last_incident": "Apr 14",
    },
    {
        "id": "s2",
        "name": "Auth Service",
        "type": "Production",
        "criticality": "P0",
        "status": "Healthy",
        "description": "OAuth2 token issuance, refresh, and validation service.",
        "x": 420,
        "y": 190,
        "r": 16,
        "owner": "R. Chen",
        "dependents": 6,
    },
    {
        "id": "s3",
        "name": "Data Bus",
        "type": "Infrastructure",
        "criticality": "P1",
        "status": "Healthy",
        "description": "Kafka-backed event bus for auth, deploy, and analytics events.",
        "x": 560,
        "y": 170,
        "r": 14,
        "owner": "M. Kim + R. Chen",
        "dependents": 3,
    },
    {
        "id": "s4",
        "name": "Deploy System",
        "type": "Infrastructure",
        "criticality": "P1",
        "status": "Healthy",
        "description": "ArgoCD and promotion hooks for production service releases.",
        "x": 620,
        "y": 350,
        "r": 13,
        "owner": "T. Walsh (sole)",
        "documented": "No",
    },
    {
        "id": "s5",
        "name": "Analytics",
        "type": "Beta",
        "criticality": "P2",
        "status": "Beta",
        "description": "Customer analytics dashboards and event aggregation.",
        "x": 500,
        "y": 340,
        "r": 11,
        "owner": "M. Kim",
    },
]

WORKFLOWS = [
    {
        "id": "w1",
        "name": "Deploy Flow",
        "steps_count": 4,
        "documented": False,
        "owner": "T. Walsh",
        "last_run": "2024-05-12",
        "x": 140,
        "y": 220,
        "r": 14,
        "steps": "Unknown",
        "frequency": "Daily",
    },
    {
        "id": "w2",
        "name": "Rollback Proc",
        "steps_count": 5,
        "documented": False,
        "owner": "A. Patel",
        "last_run": "2024-04-14",
        "x": 350,
        "y": 170,
        "r": 12,
        "sublabel": "Partial docs",
        "steps": 5,
        "frequency": "Weekly",
    },
    {
        "id": "w3",
        "name": "Incident Resp",
        "steps_count": 8,
        "documented": True,
        "owner": "J. Brooks",
        "last_run": "2024-04-14",
        "x": 460,
        "y": 270,
        "r": 11,
        "steps": 8,
        "frequency": "On-demand",
    },
]

INCIDENTS = [
    {
        "id": "i1",
        "external_id": "P-4021",
        "title": "Payment Gateway Outage",
        "severity": "P0",
        "date": "2024-04-14",
        "duration": 47,
        "resolved_by": "A. Patel",
        "x": 220,
        "y": 240,
        "r": 13,
        "systems": "Payment API",
    },
    {
        "id": "i2",
        "external_id": "P-3882",
        "title": "Auth Token Failure",
        "severity": "P1",
        "date": "2024-03-28",
        "duration": 22,
        "resolved_by": "R. Chen",
        "x": 380,
        "y": 290,
        "r": 11,
        "systems": "Auth Service",
    },
    {
        "id": "i3",
        "external_id": "P-3722",
        "title": "Payment Service Timeout",
        "severity": "P0",
        "date": "2024-03-10",
        "duration": 31,
        "resolved_by": "A. Patel",
        "x": 300,
        "y": 200,
        "r": 11,
        "systems": "Payment API",
    },
]


def seed() -> dict:
    service = Neo4jService()
    try:
        service.init_schema()
        service.clear_database()

        for person in PEOPLE:
            service.create_person(
                person["id"],
                person["name"],
                person["team"],
                person["role"],
                person["risk_score"],
            )
            service.set_visual_properties(
                person["id"],
                person["x"],
                person["y"],
                person["r"],
                label="Person",
                systems=person.get("systems", ""),
                incidents=person.get("incidents", ""),
                risk=person.get("risk", ""),
            )

        for system in SYSTEMS:
            service.create_system(
                system["id"],
                system["name"],
                system["type"],
                system["criticality"],
                system["status"],
                system["description"],
            )
            service.set_visual_properties(
                system["id"],
                system["x"],
                system["y"],
                system["r"],
                label="System",
                owner=system.get("owner", ""),
                dependents=system.get("dependents", 0),
                documented=system.get("documented", ""),
                last_incident=system.get("last_incident", ""),
            )

        for workflow in WORKFLOWS:
            service.create_workflow(
                workflow["id"],
                workflow["name"],
                workflow["steps_count"],
                workflow["documented"],
                workflow["owner"],
                workflow["last_run"],
            )
            service.set_visual_properties(
                workflow["id"],
                workflow["x"],
                workflow["y"],
                workflow["r"],
                label="Workflow",
                sublabel=workflow.get("sublabel", None)
                or ("Documented" if workflow["documented"] else "Undocumented"),
                steps=workflow["steps"],
                frequency=workflow["frequency"],
            )

        for incident in INCIDENTS:
            service.create_incident(
                incident["id"],
                incident["title"],
                incident["severity"],
                incident["date"],
                incident["duration"],
                incident["resolved_by"],
            )
            service.set_visual_properties(
                incident["id"],
                incident["x"],
                incident["y"],
                incident["r"],
                label="Incident",
                name=incident["external_id"],
                systems=incident["systems"],
            )

        # 21 demo relationships mirroring frontend/src/data/mockData.js.
        service.link_person_knows_system("p1", "s1", confidence=0.95, weight=2.0)
        service.link_person_resolves_incident("p1", "i1", weight=1.8)
        service.link_person_owns_workflow("p1", "w2", weight=1.5)
        service.link_person_knows_system("p2", "s2", confidence=0.9, weight=1.8)
        service.link_person_resolves_incident("p2", "i2", weight=1.5)
        service.link_person_knows_system("p3", "s3", confidence=0.8, weight=1.5)
        service.link_person_knows_system("p4", "s4", confidence=0.9, weight=1.8)
        service.link_person_owns_workflow("p4", "w1", weight=1.5)
        service.link_person_owns_workflow("p5", "w3", weight=1.2)

        service.link_system_depends_on("s1", "s2", weight=1.2, dashed=True)
        service.link_system_depends_on("s2", "s3", weight=1.0, dashed=True)
        service.link_system_depends_on("s3", "s5", weight=1.0, dashed=True)
        service.link_incident_affects_system("i1", "s1", weight=1.5)
        service.link_incident_affects_system("i2", "s2", weight=1.2)
        service.link_workflow_depends_on_system("w1", "s4", weight=1.5, dashed=False)
        service.link_workflow_depends_on_system("w2", "s1", weight=1.2, dashed=True)
        service.link_workflow_depends_on_system("w3", "s2", weight=1.0, dashed=True)
        service.link_people_work_together("p1", "p2", weight=1.0)
        service.link_people_work_together("p3", "p2", weight=0.8)
        service.link_system_depends_on("s4", "s1", weight=1.2, dashed=True)
        service.link_person_resolves_incident("p5", "i1", weight=0.8, dashed=True)
        service.link_person_resolves_incident("p1", "i3", weight=1.7)
        service.link_incident_affects_system("i3", "s1", weight=1.4)

        counts = service.count_nodes_and_relationships()
        risk = service.get_risk_data()
        patel = next(item for item in risk if item["id"] == "p1")
        return {
            "nodes": counts["nodes"],
            "relationships": counts["relationships"],
            "patel_connections": patel["connection_count"],
            "patel_risk_score": patel["risk_score"],
            "risk": risk,
        }
    finally:
        service.close()


def print_summary(summary: dict) -> None:
    print("MemoryWeave Acme Corp seed complete")
    print("-----------------------------------")
    print("Nodes seeded: 16 (5 people, 5 systems, 3 workflows, 3 incidents)")
    print(f"Relationships: {summary['relationships']}")
    print(
        f"A. Patel risk score: {summary['patel_risk_score']:.0f} (should be highest)"
    )
    print()
    print("People risk ranking")
    print("Person       Risk   Systems  Workflows  Incidents  Connections")
    for row in summary["risk"]:
        print(
            f"{row['name']:<11} {row['risk_score']:>4.0f} "
            f"{row['system_count']:>9} {row['workflow_count']:>10} "
            f"{row['incident_count']:>10} {row['connection_count']:>12}"
        )


if __name__ == "__main__":
    print_summary(seed())
