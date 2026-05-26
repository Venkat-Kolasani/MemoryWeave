"""
risk.py

Bus-factor risk analytics and dashboard stats endpoints.
Returns demo seed data matching frontend mockData.js.

Used by: main.py
Depends on: data/demo/loader.py, risk_report.json, stats.json
"""

from fastapi import APIRouter

from data.demo.loader import load_demo_json

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
    Return dashboard stat numbers.
    Shape: { nodes, undocumented, risks, queries }
    """
    # CODEX: replace this with real implementation (aggregate from Neo4j + ChromaDB)
    return load_demo_json("stats.json")
