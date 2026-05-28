"""
risk.py

Bus-factor risk analytics and dashboard stats endpoints.
Risk report is computed from live Neo4j data.

Used by: main.py
Depends on: services/neo4j_service.py, services/risk_scorer.py
"""

from fastapi import APIRouter, HTTPException

try:
    from services.neo4j_service import Neo4jService
    from services.risk_scorer import (
        compute_all_risk_scores,
        compute_team_heatmap,
        get_bottlenecks,
    )
except ModuleNotFoundError:
    from backend.services.neo4j_service import Neo4jService
    from backend.services.risk_scorer import (
        compute_all_risk_scores,
        compute_team_heatmap,
        get_bottlenecks,
    )

router = APIRouter(tags=["risk"])


@router.get("/risk-report")
async def get_risk_report() -> dict:
    """
    Return bus-factor analysis with heatmap and bottlenecks.
    Shape: { risks: [...], heatmap: [...], bottlenecks: [...] }
    """
    neo4j = Neo4jService()
    try:
        risks = compute_all_risk_scores(neo4j)
        heatmap = compute_team_heatmap(neo4j)
        bottlenecks = get_bottlenecks(neo4j)

        critical = sum(1 for risk in risks if risk["level"] == "critical")
        high = sum(1 for risk in risks if risk["level"] == "high")
        undoc = sum(1 for risk in risks if risk["undoc"])
        total = len(risks) or 1

        return {
            "risks": risks,
            "heatmap": heatmap,
            "bottlenecks": bottlenecks,
            "stats": {
                "critical": critical,
                "high": high,
                "undocumented_pct": int(undoc / total * 100),
                "single_points": critical,
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    finally:
        neo4j.close()


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
