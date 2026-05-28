"""
risk_scorer.py

Computes bus-factor scores and risk reports using NetworkX on top of Neo4j
graph data.

Bus factor = degree to which one person is the sole holder of knowledge for a
system. Scores are 0-100: critical (>75), high (>50), medium (>30), low (<=30).
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any, Optional

import networkx as nx

from services.neo4j_service import Neo4jService


def build_ownership_graph(neo4j: Neo4jService) -> tuple[nx.DiGraph, dict[str, dict[str, float]]]:
    """
    Pull Person->System knowledge relationships from Neo4j.

    Edge weight is relationship confidence/count. Returns a NetworkX DiGraph and
    ownership_map: { system_id: { person_id: total_weight } }.
    """
    graph = nx.DiGraph()
    ownership_map: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    def add_weighted_edge(source: str, target: str, weight: float) -> None:
        if not source or not target:
            return
        existing = graph[source][target]["weight"] if graph.has_edge(source, target) else 0
        graph.add_edge(source, target, weight=existing + weight)

    with neo4j.driver.session() as session:
        for row in session.run(
            """
            MATCH (n)
            RETURN n.id AS id, labels(n)[0] AS label, properties(n) AS props
            """
        ):
            props = row["props"] or {}
            graph.add_node(row["id"], label=row["label"], **props)

        for row in session.run(
            """
            MATCH (s:System)
            OPTIONAL MATCH (s)<-[:DEPENDS_ON]-(dependent)
            RETURN s.id AS id, count(DISTINCT dependent) AS dependents
            """
        ):
            if row["id"] in graph:
                graph.nodes[row["id"]]["dependent_count"] = row["dependents"]

        # Explicit Person -> System knowledge.
        for row in session.run(
            """
            MATCH (p:Person)-[r:KNOWS]->(s:System)
            RETURN p.id AS person_id,
                   s.id AS system_id,
                   coalesce(r.weight, r.confidence, 1.0) AS weight
            """
        ):
            weight = float(row["weight"] or 1.0)
            add_weighted_edge(row["person_id"], row["system_id"], weight)
            ownership_map[row["system_id"]][row["person_id"]] += weight

        # Incident resolution implies operational system knowledge.
        for row in session.run(
            """
            MATCH (p:Person)-[r:RESOLVES]->(i:Incident)-[:AFFECTS]->(s:System)
            RETURN p.id AS person_id,
                   i.id AS incident_id,
                   s.id AS system_id,
                   coalesce(r.weight, 1.0) AS resolver_weight,
                   coalesce(r.dashed, false) AS dashed
            """
        ):
            multiplier = 0.25 if row["dashed"] else 0.5
            weight = float(row["resolver_weight"] or 1.0) * multiplier
            add_weighted_edge(row["person_id"], row["incident_id"], weight)
            add_weighted_edge(row["incident_id"], row["system_id"], weight)
            add_weighted_edge(row["person_id"], row["system_id"], weight)
            ownership_map[row["system_id"]][row["person_id"]] += weight

        # Owned workflows imply knowledge of the systems those workflows operate.
        for row in session.run(
            """
            MATCH (p:Person)-[owns:OWNS]->(w:Workflow)-[dep:DEPENDS_ON]->(s:System)
            RETURN p.id AS person_id,
                   w.id AS workflow_id,
                   s.id AS system_id,
                   coalesce(owns.weight, 1.0) AS owns_weight,
                   coalesce(dep.weight, 1.0) AS dep_weight
            """
        ):
            weight = float(row["owns_weight"] or 1.0) * float(row["dep_weight"] or 1.0) * 0.5
            add_weighted_edge(row["person_id"], row["workflow_id"], weight)
            add_weighted_edge(row["workflow_id"], row["system_id"], weight)
            add_weighted_edge(row["person_id"], row["system_id"], weight)
            ownership_map[row["system_id"]][row["person_id"]] += weight

        # System dependency topology is used for centrality/blast-radius scoring.
        for row in session.run(
            """
            MATCH (source)-[r:DEPENDS_ON]->(target:System)
            RETURN source.id AS source_id,
                   target.id AS target_id,
                   coalesce(r.weight, 1.0) AS weight
            """
        ):
            add_weighted_edge(row["source_id"], row["target_id"], float(row["weight"] or 1.0))

    return graph, {system_id: dict(owners) for system_id, owners in ownership_map.items()}


def compute_bus_factor(
    system_id: str, ownership_map: dict[str, dict[str, float]], graph: nx.DiGraph
) -> Optional[dict[str, Any]]:
    """
    Compute the bus-factor risk score for one system.

    The concentration score is amplified by operational blast radius: P0 systems,
    undocumented systems, and systems with dependents are more dangerous when
    one person owns most of the knowledge.
    """
    owners = ownership_map.get(system_id, {})
    if not owners:
        return None

    total_weight = sum(owners.values())
    if total_weight <= 0:
        return None

    top_person_id = max(owners, key=owners.get)
    top_weight = owners[top_person_id]
    sole_ratio = top_weight / total_weight

    try:
        centrality = nx.betweenness_centrality(graph, weight="weight", normalized=True)
        betweenness = centrality.get(system_id, 0.0)
    except Exception:
        betweenness = 0.0

    node = graph.nodes.get(system_id, {})
    dependents = int(node.get("dependent_count") or 0)
    criticality = str(node.get("criticality") or "").upper()
    documented = node.get("documented")

    concentration_score = sole_ratio * 80
    centrality_score = min(10, betweenness * 100)
    dependency_score = min(10, dependents * 4)
    criticality_score = 5 if criticality == "P0" else 0
    documentation_score = 7 if _is_undocumented(documented) else 0

    score = min(
        100,
        int(
            round(
                concentration_score
                + centrality_score
                + dependency_score
                + criticality_score
                + documentation_score
            )
        ),
    )

    if score > 75:
        level = "critical"
    elif score > 50:
        level = "high"
    elif score > 30:
        level = "medium"
    else:
        level = "low"

    return {
        "score": score,
        "level": level,
        "primary_owner_id": top_person_id,
        "ownership_ratio": round(sole_ratio, 2),
    }


def compute_all_risk_scores(neo4j: Neo4jService) -> list[dict[str, Any]]:
    """
    Compute bus-factor scores for all System nodes.

    Returns a list sorted by score descending and matching the frontend risk item
    shape.
    """
    graph, ownership_map = build_ownership_graph(neo4j)

    person_names = {}
    system_data = {}
    with neo4j.driver.session() as session:
        for row in session.run("MATCH (p:Person) RETURN p.id AS id, p.name AS name"):
            person_names[row["id"]] = row["name"]

        for row in session.run(
            """
            MATCH (s:System)
            OPTIONAL MATCH (s)<-[:DEPENDS_ON]-(dependent)
            RETURN s.id AS id,
                   s.name AS name,
                   s.documented AS documented,
                   coalesce(s.dependents, 0) AS declared_dependents,
                   count(DISTINCT dependent) AS graph_dependents
            """
        ):
            system_data[row["id"]] = {
                "name": row["name"],
                "documented": row["documented"],
                "dependents": max(
                    int(row["declared_dependents"] or 0),
                    int(row["graph_dependents"] or 0),
                ),
            }

    results = []
    for system_id, sys_info in system_data.items():
        bus_data = compute_bus_factor(system_id, ownership_map, graph)
        if not bus_data:
            continue

        owner_name = person_names.get(bus_data["primary_owner_id"], "Unknown")
        ownership_pct = int(bus_data["ownership_ratio"] * 100)
        score = bus_data["score"]
        undocumented = _is_undocumented(sys_info["documented"])
        note = (
            f"Sole owner risk: {owner_name} holds {ownership_pct}% of knowledge"
            if bus_data["ownership_ratio"] > 0.7
            else f"Moderate concentration, {owner_name} is primary"
        )

        results.append(
            {
                "id": system_id,
                "system_key": _slugify(sys_info["name"]),
                "name": sys_info["name"],
                "owner": owner_name,
                "score": score,
                "level": bus_data["level"],
                "systems": sys_info["dependents"],
                "undoc": bool(undocumented and score > 50),
                "note": note,
            }
        )

    return sorted(results, key=lambda item: item["score"], reverse=True)


def compute_team_heatmap(neo4j: Neo4jService) -> list[dict[str, Any]]:
    """
    Group people by team and average individual influence scores.

    Returns [{ label, value }] sorted descending for the frontend heatmap.
    """
    _, ownership_map = build_ownership_graph(neo4j)
    team_scores: dict[str, list[int]] = defaultdict(list)

    with neo4j.driver.session() as session:
        for row in session.run(
            "MATCH (p:Person) RETURN p.id AS id, p.team AS team, p.risk_score AS risk_score"
        ):
            person_id = row["id"]
            team = row["team"] or "Unknown"
            total_influence = sum(weights.get(person_id, 0) for weights in ownership_map.values())
            stored_risk = float(row["risk_score"] or 0)
            influence_score = min(100, int(total_influence * 20))
            team_scores[team].append(max(influence_score, int(stored_risk)))

    heatmap = [
        {"label": team, "value": int(sum(scores) / len(scores))}
        for team, scores in team_scores.items()
        if scores
    ]
    return sorted(heatmap, key=lambda item: item["value"], reverse=True)


def get_bottlenecks(neo4j: Neo4jService) -> list[dict[str, str]]:
    """
    Identify critical bottleneck patterns in the graph.

    Returns [{ label: description, level: critical|high }].
    """
    bottlenecks = []

    with neo4j.driver.session() as session:
        for row in session.run(
            """
            MATCH (p:Person)-[r:RESOLVES]->(i:Incident)-[:AFFECTS]->(s:System)
            WITH s, p, sum(coalesce(r.weight, 1.0)) AS resolved_weight
            MATCH (:Person)-[all_resolves:RESOLVES]->(:Incident)-[:AFFECTS]->(s)
            WITH s.name AS system,
                 p.name AS person,
                 resolved_weight,
                 sum(coalesce(all_resolves.weight, 1.0)) AS total_weight
            WHERE total_weight > 0 AND resolved_weight / total_weight > 0.6
            RETURN person, system, resolved_weight, total_weight
            ORDER BY resolved_weight / total_weight DESC
            """
        ):
            pct = int(row["resolved_weight"] / row["total_weight"] * 100)
            bottlenecks.append(
                {
                    "label": (
                        f"{row['person']} resolves {pct}% of {row['system']} incidents "
                        "- sole critical path"
                    ),
                    "level": "critical" if pct > 80 else "high",
                }
            )

        for row in session.run(
            """
            MATCH (s:System)
            WHERE s.documented IS NULL
               OR s.documented = false
               OR toLower(toString(s.documented)) IN ['no', 'false', 'undocumented']
            OPTIONAL MATCH (s)<-[:DEPENDS_ON]-(dependent)
            WITH s, count(DISTINCT dependent) AS graph_dependents
            WITH s.name AS name,
                 coalesce(s.dependents, graph_dependents) AS declared_dependents,
                 graph_dependents
            WITH name,
                 CASE
                   WHEN declared_dependents > graph_dependents THEN declared_dependents
                   ELSE graph_dependents
                 END AS deps
            WHERE deps >= 2
            RETURN name, deps
            ORDER BY deps DESC
            """
        ):
            bottlenecks.append(
                {
                    "label": (
                        f"{row['name']} has no documented recovery procedure "
                        f"({row['deps']} dependents)"
                    ),
                    "level": "critical",
                }
            )

        for row in session.run(
            """
            MATCH (p:Person)-[:OWNS]->(w:Workflow)
            WHERE w.documented = false
            RETURN p.name AS person, w.name AS workflow
            ORDER BY person, workflow
            """
        ):
            bottlenecks.append(
                {
                    "label": (
                        f"{row['workflow']} has undocumented steps known primarily to "
                        f"{row['person']}"
                    ),
                    "level": "high",
                }
            )

    return bottlenecks[:4]


def _is_undocumented(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, bool):
        return not value
    return str(value).strip().lower() in {"no", "false", "undocumented", "incomplete", "partial"}


def _slugify(value: str) -> str:
    return "_".join(part for part in value.lower().replace("-", " ").split() if part)
