/**
 * LiveCrossSourceSqlCard.jsx
 *
 * Judge-facing Coral SQL demo: static cross-source JOIN + live result preview rows.
 * Always renders (backend optional); preview rows update when bus_factor data loads.
 *
 * Used by: ReportsPage
 * Depends on: Badge
 */

import Badge from '../atoms/Badge.jsx'

/** Fallback rows when /coral-report is unavailable (matches Acme Patel narrative). */
export const MOCK_SQL_PREVIEW_ROWS = [
  {
    person: 'A. Patel',
    team: 'Engineering',
    relationship: 'KNOWS',
    system: 'Payment API',
    strength: '0.95',
    critical: true,
  },
  {
    person: 'R. Chen',
    team: 'Engineering',
    relationship: 'OWNS',
    system: 'Auth Service',
    strength: '0.78',
    critical: false,
  },
  {
    person: 'M. Kim',
    team: 'Data',
    relationship: 'KNOWS',
    system: 'Data Bus',
    strength: '0.64',
    critical: false,
  },
  {
    person: 'T. Walsh',
    team: 'Infrastructure',
    relationship: 'OWNS',
    system: 'Deploy System',
    strength: '0.41',
    critical: false,
  },
  {
    person: 'J. Brooks',
    team: 'Infrastructure',
    relationship: 'KNOWS',
    system: 'Incident Resp',
    strength: '0.28',
    critical: false,
  },
]

const SQL_LINES = [
  {
    code: '-- MemoryWeave × Coral: 5 sources, 3 source types, 1 query',
    comment: null,
  },
  { code: 'SELECT', comment: null },
  { code: '  n.name          AS person,', comment: '-- source: knowledge_nodes (JSONL)' },
  { code: '  e.to_name       AS system,', comment: '-- source: knowledge_edges (JSONL)' },
  { code: '  gh.title        AS github_issue', comment: '-- source: github_issues (Live GitHub API)' },
  { code: 'FROM knowledge_nodes n', comment: null },
  { code: 'JOIN knowledge_edges e ON n.id = e.from_id', comment: null },
  { code: 'JOIN github_issues gh', comment: null },
  { code: "  ON LOWER(gh.body) LIKE '%' || LOWER(n.name) || '%'", comment: null },
  { code: "WHERE n.type = 'Person'", comment: null },
  { code: "  AND e.rel_type = 'OWNS'", comment: null },
  { code: 'ORDER BY e.weight DESC', comment: null },
]

const SOLE_OWNER_BY_SYSTEM = {
  'Payment API': 'A. Patel',
  'Deploy System': 'T. Walsh',
  Analytics: 'M. Kim',
  'Auth Service': 'R. Chen',
  'Data Bus': 'M. Kim',
}

const TEAM_BY_PERSON = {
  'A. Patel': 'Engineering',
  'R. Chen': 'Engineering',
  'M. Kim': 'Data',
  'T. Walsh': 'Infrastructure',
  'J. Brooks': 'Infrastructure',
}

/**
 * Map /coral-report bus_factor rows into SQL result preview shape.
 * @param {Array<{ system_name?: string, owner_count?: number, max_ownership_weight?: number }>|null|undefined} busFactor
 */
export function buildSqlPreviewRows(busFactor) {
  if (!busFactor?.length) return MOCK_SQL_PREVIEW_ROWS

  const sorted = [...busFactor].sort((a, b) => {
    if (a.system_name === 'Payment API') return -1
    if (b.system_name === 'Payment API') return 1
    return (b.max_ownership_weight ?? 0) - (a.max_ownership_weight ?? 0)
  })

  return sorted.slice(0, 5).map((row) => {
    const system = row.system_name || '—'
    const person = SOLE_OWNER_BY_SYSTEM[system] || '—'
    const weight = row.max_ownership_weight ?? 1
    return {
      person,
      team: TEAM_BY_PERSON[person] || '—',
      relationship: (row.owner_count ?? 0) <= 1 ? 'OWNS' : 'KNOWS',
      system,
      strength: Math.min(0.99, weight / 2).toFixed(2),
      critical: system === 'Payment API',
    }
  })
}

/**
 * Live Coral SQL showcase card for Reports page.
 * @param {{ previewRows: typeof MOCK_SQL_PREVIEW_ROWS, isLive: boolean }} props
 */
export default function LiveCrossSourceSqlCard({ previewRows, isLive }) {
  const rows = previewRows?.length ? previewRows : MOCK_SQL_PREVIEW_ROWS

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Live Cross-Source SQL
          </span>
          <Badge variant="accent" size="xs">
            Powered by Coral
          </Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--success)',
              animation: isLive ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
              opacity: isLive ? 1 : 0.35,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              color: 'var(--success)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {isLive ? 'Live' : 'Demo'}
          </span>
        </div>
      </div>

      <div
        style={{
          background: 'var(--text-primary)',
          borderRadius: 0,
          padding: '20px 24px',
          overflowX: 'auto',
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.6,
            color: '#a8d8a8',
            whiteSpace: 'pre',
          }}
        >
          {SQL_LINES.map((line) => (
            <div
              key={line.code}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 24,
                minWidth: 'min-content',
              }}
            >
              <span>{line.code}</span>
              {line.comment ? (
                <span
                  style={{
                    color: 'rgba(255,255,255,0.35)',
                    flexShrink: 0,
                  }}
                >
                  {line.comment}
                </span>
              ) : (
                <span />
              )}
            </div>
          ))}
        </pre>
      </div>

      <div
        style={{
          padding: '12px 24px 0',
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        <span>Sources joined: 5</span>
        <span>Source types: JSONL, Markdown, JSON, GitHub API</span>
        <span>Cache TTL: 300s</span>
      </div>

      <div style={{ padding: '12px 24px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Person', 'Team', 'Relationship', 'System', 'Strength'].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px 8px 0',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.person}-${row.system}`}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  borderLeft: row.critical
                    ? '4px solid var(--danger)'
                    : '4px solid transparent',
                }}
              >
                {[
                  row.person,
                  row.team,
                  row.relationship,
                  row.system,
                  row.strength,
                ].map((cell, cellIndex) => (
                  <td
                    key={cell}
                    style={{
                      padding: '10px 12px 10px 0',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: cellIndex === 0 ? 500 : 400,
                      color:
                        cellIndex === 0
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: '12px 24px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
          lineHeight: 1.6,
        }}
      >
        Coral handles auth, pagination, and schema learning. Data resolves inside Coral —
        not inside the agent context window.
      </div>
    </div>
  )
}
