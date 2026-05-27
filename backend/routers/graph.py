"""
graph.py — /graph endpoint. Returns live Neo4j graph data for frontend visualization.
"""

from fastapi import APIRouter, HTTPException

try:
    from services.neo4j_service import Neo4jService
except ModuleNotFoundError:
    from backend.services.neo4j_service import Neo4jService

router = APIRouter(tags=["graph"])


@router.get("/graph")
async def get_graph() -> dict:
    """
    Returns all nodes and edges from Neo4j, formatted for the frontend SVG graph.
    Node shape: { id, type, label, sublabel, x, y, r, color, details }
    Edge shape: { from, to, weight, dashed }
    Falls back to empty graph on Neo4j connection failure — never crashes the frontend.
    """
    try:
        neo4j = Neo4jService()
        nodes = neo4j.get_all_nodes()
        edges = neo4j.get_all_edges()
        neo4j.close()
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        print(f"[graph] Neo4j error: {e}")
        raise HTTPException(status_code=503, detail=f"Graph data unavailable: {str(e)}")
