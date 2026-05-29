"""
coral/queries.py

Canonical SQL queries used by MemoryWeave's Coral-powered retrieval layer.
These replace the fragmented: Cypher to Neo4j + embedding search to ChromaDB + manual merge.
Coral executes cross-source JOINs internally — data resolves inside Coral, not inside our agent.

All queries use table names registered in sources.yaml (Coral schemas: memoryweave_graph.*, memoryweave_demo.*).
Parameter substitution uses coral_service.sanitize_sql_param before .format(**params).
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


# ─── Query 5b: Overview when no keyword matches the question ─────────────────
# Used when _extract_keyword returns None — avoids biasing toward "payment".
OPERATIONAL_CONTEXT_OVERVIEW = """
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

# ─── Query 8: Systems without a documented backup owner ─────────────────────
# Answers: "Which systems have no backup owner?"
SYSTEMS_WITHOUT_BACKUP = """
SELECT
    bf.system_name,
    n.criticality,
    n.risk_score      AS system_risk_score,
    bf.owner_count,
    bf.max_ownership_weight
FROM (
    SELECT
        e.to_name                     AS system_name,
        COUNT(DISTINCT e.from_name)   AS owner_count,
        MAX(e.weight)                 AS max_ownership_weight
    FROM memoryweave_graph.knowledge_edges e
    WHERE e.rel_type IN ('OWNS', 'KNOWS')
      AND e.to_type = 'System'
    GROUP BY e.to_name
    HAVING COUNT(DISTINCT e.from_name) = 1
) bf
LEFT JOIN memoryweave_graph.knowledge_nodes n
    ON n.name = bf.system_name
    AND n.type = 'System'
WHERE NOT EXISTS (
    SELECT 1
    FROM memoryweave_graph.knowledge_edges b
    WHERE b.to_name = bf.system_name
      AND b.rel_type = 'BACKUP_FOR'
)
ORDER BY
    CASE n.criticality
        WHEN 'P0' THEN 1
        WHEN 'P1' THEN 2
        WHEN 'P2' THEN 3
        ELSE 4
    END,
    bf.system_name
"""


# ─── Query 9: Payment service recovery (graph + incidents + Slack) ─────────
PAYMENT_RECOVERY_CONTEXT = """
SELECT
    n.name            AS entity_name,
    n.type            AS entity_type,
    e.rel_type        AS relationship,
    e.to_name         AS related_entity,
    i.incident_id     AS incident_id,
    i.severity        AS incident_severity,
    i.duration_min    AS duration_minutes,
    i.resolved_by     AS resolved_by,
    s.text            AS slack_evidence,
    s.channel         AS slack_channel
FROM memoryweave_graph.knowledge_nodes n
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON n.id = e.from_id OR n.id = e.to_id
LEFT JOIN memoryweave_demo.incident_reports i
    ON LOWER(i.systems_affected) LIKE '%payment%'
    OR LOWER(i.content) LIKE '%payment%'
LEFT JOIN memoryweave_demo.slack_messages s
    ON LOWER(s.text) LIKE '%payment%'
WHERE LOWER(n.name) LIKE '%payment%'
   OR LOWER(e.to_name) LIKE '%payment%'
   OR LOWER(e.from_name) LIKE '%payment%'
   OR i.incident_id IS NOT NULL
   OR s.text IS NOT NULL
ORDER BY i.incident_id DESC, s.timestamp DESC
LIMIT 40
"""


# ─── Query 10: Auth pipeline ownership ───────────────────────────────────────
AUTH_PIPELINE_OWNERSHIP = """
SELECT
    s.name            AS system_name,
    s.criticality     AS criticality,
    e.from_name       AS knowledge_holder,
    e.from_type       AS holder_type,
    e.rel_type        AS relationship_type,
    e.weight          AS relationship_strength
FROM memoryweave_graph.knowledge_nodes s
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON s.id = e.to_id
    AND e.rel_type IN ('KNOWS', 'OWNS', 'BACKUP_FOR')
WHERE s.type = 'System'
  AND LOWER(s.name) LIKE '%auth%'
ORDER BY e.weight DESC
"""


# ─── Query 11: Single incident detail (graph + postmortem) ─────────────────────
INCIDENT_DETAIL = """
SELECT
    n.name            AS incident_name,
    n.criticality     AS severity,
    e.from_name       AS resolver,
    e.rel_type        AS relationship,
    e.to_name         AS affected_system,
    i.incident_id     AS incident_id,
    i.severity        AS report_severity,
    i.duration_min    AS duration_minutes,
    i.resolved_by     AS resolved_by,
    i.systems_affected AS systems_affected
FROM memoryweave_graph.knowledge_nodes n
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON n.id = e.from_id OR n.id = e.to_id
LEFT JOIN memoryweave_demo.incident_reports i
    ON LOWER(i.incident_id) = LOWER(n.name)
    OR LOWER(i.incident_id) = LOWER('{incident_id}')
WHERE n.type = 'Incident'
  AND (
    LOWER(n.name) LIKE LOWER('%{incident_id}%')
    OR LOWER(i.incident_id) LIKE LOWER('%{incident_id}%')
  )
ORDER BY e.weight DESC
LIMIT 35
"""


# ─── Query 12: Deploy / Q4 deployment context ────────────────────────────────
DEPLOYMENT_HISTORY_CONTEXT = """
SELECT
    n.name            AS entity_name,
    n.type            AS entity_type,
    e.rel_type        AS relationship,
    e.to_name         AS related_entity,
    s.text            AS slack_evidence,
    s.channel         AS slack_channel,
    s.timestamp       AS slack_timestamp
FROM memoryweave_graph.knowledge_nodes n
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON n.id = e.from_id OR n.id = e.to_id
LEFT JOIN memoryweave_demo.slack_messages s
    ON LOWER(s.text) LIKE '%deploy%'
    OR LOWER(s.channel) LIKE '%engineering%'
WHERE LOWER(n.name) LIKE '%deploy%'
   OR LOWER(e.to_name) LIKE '%deploy%'
   OR LOWER(e.from_name) LIKE '%deploy%'
   OR LOWER(s.text) LIKE '%deploy%'
ORDER BY s.timestamp DESC
LIMIT 35
"""


# ─── Query 13: Patel bus-factor / absence risk ───────────────────────────────
PATEL_ABSENCE_RISK = """
SELECT
    n.name            AS person_name,
    n.risk_score      AS risk_score,
    n.team            AS team,
    e.rel_type        AS relationship,
    e.to_name         AS owned_entity,
    e.to_type         AS entity_type,
    e.weight          AS strength
FROM memoryweave_graph.knowledge_nodes n
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON n.id = e.from_id
WHERE n.type = 'Person'
  AND LOWER(n.name) LIKE '%patel%'
ORDER BY e.weight DESC
LIMIT 30
"""


# ─── Query 14: GitHub issues × knowledge graph ───────────────────────────────
# file: memoryweave_demo.github_issues (JSONL — Acme narrative supplement)
# api: github.issues only (often 0 JOIN rows — live issues lack person names in body)
# hybrid: UNION live API + JSONL supplement (production demo default when token set)

GITHUB_ISSUES_UNION_SUBQUERY = """
(
  SELECT
      number,
      title,
      state,
      body,
      created_at,
      'live_github_api' AS issue_source
  FROM github.issues
  WHERE owner = 'Venkat-Kolasani'
    AND repo = 'MemoryWeave'
    AND state = 'all'
  UNION ALL
  SELECT
      number,
      title,
      state,
      body,
      created_at,
      'demo_supplement' AS issue_source
  FROM memoryweave_demo.github_issues
)
"""

GITHUB_KNOWLEDGE_CROSS_JOIN_HYBRID = f"""
SELECT
    kn.name         AS team_member,
    kn.team         AS team,
    kn.role         AS role,
    e.to_name       AS owned_system,
    e.rel_type      AS relationship,
    gh.number       AS issue_number,
    gh.title        AS issue_title,
    gh.state        AS issue_state,
    gh.issue_source AS issue_source,
    gh.created_at   AS opened_at
FROM memoryweave_graph.knowledge_nodes kn
LEFT JOIN memoryweave_graph.knowledge_edges e
    ON kn.id = e.from_id
    AND e.rel_type IN ('OWNS', 'KNOWS')
JOIN {GITHUB_ISSUES_UNION_SUBQUERY} gh
    ON LOWER(COALESCE(gh.body, '')) LIKE '%' || LOWER(kn.name) || '%'
    OR LOWER(gh.title) LIKE '%' || LOWER(kn.name) || '%'
WHERE kn.type = 'Person'
ORDER BY
    CASE WHEN gh.issue_source = 'live_github_api' THEN 0 ELSE 1 END,
    gh.created_at DESC
LIMIT 20
"""

GITHUB_KNOWLEDGE_CROSS_JOIN_API = """
SELECT
    kn.name         AS team_member,
    kn.team         AS team,
    kn.role         AS role,
    gh.number       AS issue_number,
    gh.title        AS issue_title,
    gh.state        AS issue_state,
    'live_github_api' AS issue_source,
    gh.created_at   AS opened_at
FROM memoryweave_graph.knowledge_nodes kn
JOIN github.issues gh
    ON LOWER(COALESCE(gh.body, '')) LIKE '%' || LOWER(kn.name) || '%'
    OR LOWER(gh.title) LIKE '%' || LOWER(kn.name) || '%'
WHERE kn.type = 'Person'
  AND gh.owner = 'Venkat-Kolasani'
  AND gh.repo = 'MemoryWeave'
  AND gh.state = 'all'
ORDER BY gh.created_at DESC
LIMIT 20
"""

GITHUB_KNOWLEDGE_CROSS_JOIN_FILE = """
SELECT
    kn.name         AS team_member,
    kn.team         AS team,
    kn.role         AS role,
    gh.number       AS issue_number,
    gh.title        AS issue_title,
    gh.state        AS issue_state,
    'demo_supplement' AS issue_source,
    gh.created_at   AS opened_at
FROM memoryweave_graph.knowledge_nodes kn
JOIN memoryweave_demo.github_issues gh
    ON LOWER(gh.body) LIKE '%' || LOWER(kn.name) || '%'
    OR LOWER(gh.title) LIKE '%' || LOWER(kn.name) || '%'
WHERE kn.type = 'Person'
ORDER BY gh.created_at DESC
LIMIT 20
"""

# Default alias used by coral_service.github_knowledge_cross_join()
GITHUB_KNOWLEDGE_CROSS_JOIN = GITHUB_KNOWLEDGE_CROSS_JOIN_FILE


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
