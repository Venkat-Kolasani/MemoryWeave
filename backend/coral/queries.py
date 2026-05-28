"""
coral/queries.py

Canonical SQL queries used by MemoryWeave's Coral-powered retrieval layer.
These replace the fragmented: Cypher to Neo4j + embedding search to ChromaDB + manual merge.
Coral executes cross-source JOINs internally — data resolves inside Coral, not inside our agent.

All queries use table names registered in sources.yaml (Coral schemas: memoryweave_graph.*, memoryweave_demo.*).
Parameter substitution uses Python .format(**params) — safe because we own all templates.
"""


# ─── Query 1: Full person context across graph + incident history ────────────
# Answers: "Who is {name}? What do they own? What incidents have they resolved?"
# JOIN: knowledge_nodes × knowledge_edges (two hops)
PERSON_FULL_CONTEXT = """
SELECT
    n.name            AS person_name,
    n.team            AS team,
    n.role            AS role,
    n.risk_score      AS risk_score,
    e.rel_type        AS relationship_type,
    e.to_name         AS connected_entity,
    e.to_type         AS entity_type,
    e.weight          AS relationship_strength
FROM memoryweave_graph.knowledge_nodes n
JOIN memoryweave_graph.knowledge_edges e
    ON n.id = e.from_id
WHERE n.type = 'Person'
  AND LOWER(n.name) LIKE LOWER('%{person_name}%')
ORDER BY e.weight DESC
LIMIT 30
"""


# ─── Query 2: System risk report — who owns what, sole dependencies ──────────
# Answers: "Which systems are critical single points of failure?"
# JOIN: knowledge_nodes (systems) × knowledge_edges (ownership)
SYSTEM_RISK_REPORT = """
SELECT
    s.id              AS system_id,
    s.name            AS system_name,
    s.criticality     AS criticality,
    s.risk_score      AS risk_score,
    e.from_name       AS owner_name,
    e.rel_type        AS ownership_type,
    e.weight          AS ownership_strength,
    e.from_type       AS owner_type
FROM memoryweave_graph.knowledge_nodes s
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON s.id = e.to_id
    AND e.rel_type IN ('KNOWS', 'OWNS')
WHERE s.type = 'System'
ORDER BY s.risk_score DESC, e.weight DESC
"""


# ─── Query 3: Incident resolver chain ────────────────────────────────────────
# Answers: "Who resolved past incidents? What systems were affected?"
# JOIN: incidents × resolvers × affected systems (3-way)
INCIDENT_RESOLVER_CHAIN = """
SELECT
    inc.id            AS incident_id,
    inc.name          AS incident_name,
    inc.criticality   AS severity,
    resolver.from_name AS resolved_by,
    resolver.weight   AS resolver_confidence,
    affected.to_name  AS affected_system,
    affected.weight   AS system_impact
FROM memoryweave_graph.knowledge_nodes inc
LEFT JOIN memoryweave_graph.knowledge_edges resolver
    ON inc.id = resolver.to_id
    AND resolver.rel_type = 'RESOLVES'
LEFT JOIN memoryweave_graph.knowledge_edges affected
    ON inc.id = affected.from_id
    AND affected.rel_type = 'AFFECTS'
WHERE inc.type = 'Incident'
ORDER BY resolver.weight DESC
"""


# ─── Query 4: Bus factor analysis — sole owners ───────────────────────────────
# Answers: "Which systems have only one person who understands them?"
# Aggregation on knowledge_edges to find single-owner systems
BUS_FACTOR_ANALYSIS = """
SELECT
    e.to_name                     AS system_name,
    COUNT(DISTINCT e.from_name)   AS owner_count,
    MAX(e.weight)                 AS max_ownership_weight,
    MIN(e.weight)                 AS min_ownership_weight
FROM memoryweave_graph.knowledge_edges e
WHERE e.rel_type IN ('OWNS', 'KNOWS')
  AND e.to_type = 'System'
GROUP BY e.to_name
ORDER BY owner_count ASC, max_ownership_weight DESC
"""


# ─── Query 5: Full operational context for any keyword ───────────────────────
# Answers: the generic /coral-query question — fetch all graph context for a topic
# Used by: LLM grounding before synthesizing an answer
FULL_OPERATIONAL_CONTEXT = """
SELECT
    n.name            AS entity_name,
    n.type            AS entity_type,
    n.risk_score      AS risk_score,
    e.rel_type        AS relationship,
    e.to_name         AS related_entity,
    e.to_type         AS related_type,
    e.weight          AS strength
FROM memoryweave_graph.knowledge_nodes n
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON n.id = e.from_id OR n.id = e.to_id
WHERE LOWER(n.name) LIKE LOWER('%{keyword}%')
   OR LOWER(e.to_name) LIKE LOWER('%{keyword}%')
   OR LOWER(e.from_name) LIKE LOWER('%{keyword}%')
ORDER BY n.risk_score DESC, e.weight DESC
LIMIT 50
"""


# ─── Query 6: Team knowledge concentration ───────────────────────────────────
# Used by: Reports page — "Which teams carry the highest knowledge concentration?"
TEAM_KNOWLEDGE_CONCENTRATION = """
SELECT
    n.team                        AS team,
    COUNT(DISTINCT n.id)          AS team_size,
    AVG(n.risk_score)             AS avg_risk_score,
    COUNT(DISTINCT e.to_id)       AS systems_owned,
    MAX(n.risk_score)             AS max_individual_risk
FROM memoryweave_graph.knowledge_nodes n
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON n.id = e.from_id
    AND e.rel_type IN ('OWNS', 'KNOWS')
WHERE n.type = 'Person'
  AND n.team IS NOT NULL
  AND n.team <> ''
GROUP BY n.team
ORDER BY avg_risk_score DESC
"""


# ─── Query 7: Undocumented workflow risk ─────────────────────────────────────
# Used by: Reports page — "What workflows are undocumented and who owns them?"
UNDOCUMENTED_WORKFLOW_RISK = """
SELECT
    w.id              AS workflow_id,
    w.name            AS workflow_name,
    w.risk_score      AS risk_score,
    e.from_name       AS owner_name,
    e.weight          AS ownership_strength
FROM memoryweave_graph.knowledge_nodes w
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON w.id = e.to_id
    AND e.rel_type = 'OWNS'
WHERE w.type = 'Workflow'
ORDER BY w.risk_score DESC, e.weight DESC
"""

# ─── Cross-source demo: graph + Slack + incidents (Patel / payment) ─────────
PATEL_CROSS_SOURCE = """
SELECT
    n.name AS person_name,
    n.risk_score,
    s.text AS slack_message,
    s.channel,
    i.incident_id,
    i.severity,
    i.resolved_by
FROM memoryweave_graph.knowledge_nodes n
LEFT JOIN memoryweave_demo.slack_messages s
    ON LOWER(s.text) LIKE LOWER('%' || n.name || '%')
LEFT JOIN memoryweave_demo.incident_reports i
    ON LOWER(i.resolved_by) LIKE LOWER('%' || n.name || '%')
WHERE n.type = 'Person'
  AND LOWER(n.name) LIKE LOWER('%Patel%')
LIMIT 25
"""
