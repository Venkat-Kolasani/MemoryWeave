"""
risk.py

Bus-factor risk analytics and dashboard stats endpoints.
Returns demo seed data matching frontend mockData.js.

Used by: main.py
Depends on: data/demo/loader.py, risk_report.json, stats.json
"""

from fastapi import APIRouter

try:
    from data.demo.loader import load_demo_json
    from services.neo4j_service import Neo4jService
except ModuleNotFoundError:
    from backend.data.demo.loader import load_demo_json
    from backend.services.neo4j_service import Neo4jService

router = APIRouter(tags=["risk"])


@router.get("/risk-report")
async def get_risk_report() -> dict:
    """
    Return bus-factor analysis with heatmap and bottlenecks.
    Shape: { risks: [...], heatmap: [...], bottlenecks: [...] }
    """
    # CODEX: replace this with real implementation (NetworkX bus-factor scoring)
    return load_demo_json("risk_report.json")


@router.get("/stats")
async def get_stats() -> dict:
    """
    Returns dashboard stat numbers from Neo4j node counts.
    Falls back to safe defaults on error.
    """
    try:
        neo4j = Neo4jService()
        with neo4j.driver.session() as session:
            result = session.run(
                "MATCH (n) RETURN labels(n)[0] as type, count(n) as count"
            )
            counts = {row["type"]: row["count"] for row in result}
        neo4j.close()
        total = sum(counts.values())
        return {
            "nodes": total,
            "undocumented": 134,  # TODO: compute from Workflow.documented = false
            "risks": 3,  # TODO: computed by risk scorer in C3-04
            "queries": 48,  # TODO: track in Redis or DB counter
        }
    except Exception as e:
        print(f"[stats] Neo4j error: {e}")
        return {"nodes": 0, "undocumented": 0, "risks": 0, "queries": 0}
