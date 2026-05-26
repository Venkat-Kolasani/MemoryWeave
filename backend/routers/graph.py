"""
graph.py

Knowledge graph endpoints — nodes and edges for SVG visualization.
Returns demo seed data matching frontend mockData.js.

Used by: main.py
Depends on: data/demo/loader.py, graph.json
"""

from fastapi import APIRouter

from data.demo.loader import load_demo_json

router = APIRouter(tags=["graph"])


@router.get("/graph")
async def get_graph() -> dict:
    """
    Return full knowledge graph for visualization.
    Shape: { nodes: [...], edges: [...] }
    """
    # CODEX: replace this with real implementation (Neo4j Cypher → nodes/edges)
    return load_demo_json("graph.json")
