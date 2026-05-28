/**
 * SettingsPage.jsx
 *
 * Coral data source manager + application settings.
 * Fetches from /coral-schema to display registered SQL tables and column metadata.
 *
 * Used by: App.jsx (route /settings)
 * Depends on: DashboardShell, Badge, Button, Icon, StatCard, api.fetchCoralSchema
 */

import { useState, useEffect, useMemo } from 'react'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'
import StatCard from '../components/atoms/StatCard.jsx'
import { fetchCoralSchema } from '../services/api.js'

/** Static registry — aligned with backend/coral manifests; enriched by live /coral-schema. */
const CORAL_TABLES = [
  {
    name: 'knowledge_nodes',
    schema: 'memoryweave_graph',
    source: 'Neo4j AuraDB',
    type: 'Graph Database',
    icon: 'graph',
    status: 'active',
    description: 'People, systems, incidents, and workflows as SQL rows',
    columns: ['id', 'name', 'type', 'risk_score', 'team', 'role', 'criticality'],
    example:
      "SELECT * FROM memoryweave_graph.knowledge_nodes WHERE type = 'Person' ORDER BY risk_score DESC",
  },
  {
    name: 'knowledge_edges',
    schema: 'memoryweave_graph',
    source: 'Neo4j AuraDB',
    type: 'Graph Database',
    icon: 'workflow',
    status: 'active',
    description: 'Relationships between entities — OWNS, KNOWS, RESOLVES, AFFECTS',
    columns: [
      'from_id',
      'from_name',
      'from_type',
      'rel_type',
      'weight',
      'to_id',
      'to_name',
      'to_type',
    ],
    example:
      "SELECT from_name, rel_type, to_name FROM memoryweave_graph.knowledge_edges WHERE rel_type = 'RESOLVES'",
  },
  {
    name: 'incident_reports',
    schema: 'memoryweave_demo',
    source: 'Markdown files',
    type: 'File (JSONL)',
    icon: 'alert',
    status: 'active',
    description: 'Postmortem files for P-4021, P-3882, P-3722 and more',
    columns: [
      'incident_id',
      'severity',
      'resolved_by',
      'systems_affected',
      'duration_min',
      'content',
    ],
    example:
      "SELECT * FROM memoryweave_demo.incident_reports WHERE severity = 'P0'",
  },
  {
    name: 'slack_messages',
    schema: 'memoryweave_demo',
    source: 'messages.json',
    type: 'File (JSONL)',
    icon: 'slack',
    status: 'active',
    description: '50 Slack messages from engineering channels — operational discussions',
    columns: ['timestamp', 'author', 'channel', 'text'],
    example:
      "SELECT author, text FROM memoryweave_demo.slack_messages WHERE LOWER(text) LIKE '%patel%'",
  },
]

const JOIN_EXAMPLE = `SELECT
    n.name           AS person_name,
    e.to_name        AS system_owned,
    e.rel_type       AS ownership_type,
    e.weight         AS ownership_strength
FROM memoryweave_graph.knowledge_nodes n
JOIN memoryweave_graph.knowledge_edges e
    ON n.id = e.from_id
WHERE n.type = 'Person'
  AND e.rel_type IN ('OWNS', 'KNOWS')
ORDER BY e.weight DESC`

/** Merge live column names from /coral-schema when Coral returns catalog rows. */
function mergeLiveColumns(tables, schemaPayload) {
  const liveCols = schemaPayload?.columns || []
  if (!liveCols.length) return tables

  return tables.map((table) => {
    const fromApi = liveCols
      .filter(
        (c) =>
          c.table_name === table.name &&
          (c.schema_name === table.schema || !c.schema_name),
      )
      .map((c) => c.column_name)
      .filter(Boolean)
    return {
      ...table,
      columns: fromApi.length > 0 ? fromApi : table.columns,
    }
  })
}

/** Coral data source manager — registered SQL tables and schemas. */
export default function SettingsPage() {
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedTable, setExpandedTable] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchCoralSchema()
      .then((d) => {
        if (!cancelled) {
          setSchema(d)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSchema({ available: false })
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const coralAvailable = !loading && schema?.available === true
  const coralOffline = !loading && schema?.available !== true
  const tables = useMemo(
    () => mergeLiveColumns(CORAL_TABLES, schema),
    [schema],
  )

  const sourceCount = new Set(tables.map((t) => t.source)).size

  return (
    <DashboardShell
      title="Settings"
      subtitle="Data source configuration · Coral SQL tables"
    >
      <div
        className="flex flex-col"
        style={{ gap: 28, animation: 'fadeIn 0.3s ease both' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          <StatCard
            label="SQL Tables"
            value={String(tables.length)}
            sublabel="registered via Coral"
            delay={0}
          />
          <StatCard
            label="Data Sources"
            value={String(sourceCount)}
            sublabel="Neo4j + file exports"
            delay={60}
          />
          <StatCard
            label="Coral Status"
            value={loading ? '…' : coralAvailable ? 'Live' : coralOffline ? 'Offline' : '…'}
            sublabel={
              loading ? 'checking connection' : coralAvailable ? 'CLI connected' : 'install required'
            }
            delay={120}
          />
          <StatCard label="Cache TTL" value="300s" sublabel="schema learning active" delay={180} />
        </div>

        <div
          style={{
            padding: '16px 20px',
            background: loading
              ? 'var(--bg-secondary)'
              : coralAvailable
                ? 'var(--accent-light)'
                : 'var(--bg-secondary)',
            border: `1px solid ${
              loading ? 'var(--border)' : coralAvailable ? 'var(--border)' : 'var(--danger)'
            }`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              flexShrink: 0,
              background: loading
                ? 'var(--text-tertiary)'
                : coralAvailable
                  ? 'var(--success)'
                  : 'var(--danger)',
              animation: coralAvailable ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Coral CLI{' '}
              {loading ? 'Checking…' : coralAvailable ? 'Connected' : 'Not Found'}
            </span>
            <p
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginTop: 2,
              }}
            >
              {loading
                ? 'Verifying Coral CLI and registered SQL sources…'
                : coralAvailable
                  ? 'All 4 data sources are registered and queryable as SQL tables via Coral.'
                  : 'Install Coral to enable cross-source SQL: brew install withcoral/tap/coral'}
            </p>
          </div>
          {coralOffline && (
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                window.open('https://withcoral.com/docs/getting-started/installation', '_blank')
              }
            >
              View Install Guide
            </Button>
          )}
        </div>

        <div>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}
          >
            Registered SQL Tables
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Each source is defined in{' '}
            <code
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-text)',
              }}
            >
              backend/coral/manifests/
            </code>{' '}
            and exposed as{' '}
            <code
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-text)',
              }}
            >
              schema.table
            </code>{' '}
            in Coral SQL.
          </p>
        </div>

        <div className="flex flex-col" style={{ gap: 12 }}>
          {tables.map((table, i) => {
            const isExpanded = expandedTable === table.name
            return (
              <div
                key={table.name}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xs)',
                  overflow: 'hidden',
                  animation: `fadeUp 0.4s ease ${i * 80}ms both`,
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setExpandedTable(isExpanded ? null : table.name)
                    }
                  }}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--bg-secondary)' : 'var(--surface)',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={table.icon} size={16} color="var(--text-secondary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <code
                        style={{
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 500,
                        }}
                      >
                        {table.schema}.{table.name}
                      </code>
                      <Badge variant="success" size="xs">
                        Active
                      </Badge>
                      <Badge variant="default" size="xs">
                        {table.type}
                      </Badge>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        marginTop: 3,
                      }}
                    >
                      {table.description}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {table.source}
                    </span>
                    <Icon
                      name={isExpanded ? 'chevronDown' : 'chevronRight'}
                      size={14}
                      color="var(--text-tertiary)"
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      padding: '0 20px 20px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginTop: 16,
                        marginBottom: 8,
                      }}
                    >
                      Columns
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {table.columns.map((col) => (
                        <code
                          key={col}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {col}
                        </code>
                      ))}
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginTop: 16,
                        marginBottom: 8,
                      }}
                    >
                      Example Query
                    </p>
                    <code
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent-text)',
                        lineHeight: 1.6,
                      }}
                    >
                      {table.example}
                    </code>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Icon name="zap" size={14} color="var(--accent-text)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Cross-Source JOIN Example
            </span>
            <Badge variant="accent" size="xs">
              Coral SQL
            </Badge>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginBottom: 12,
            }}
          >
            Coral resolves this JOIN internally — no ETL, no warehouse, no glue code.
          </p>
          <pre
            style={{
              margin: 0,
              padding: '14px 16px',
              background: 'var(--text-primary)',
              color: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
            }}
          >
            {JOIN_EXAMPLE}
          </pre>
        </div>
      </div>
    </DashboardShell>
  )
}
