/**
 * ReportsPage.jsx
 *
 * Cross-source analytics powered by Coral SQL JOINs.
 * Fetches from /coral-report — four Coral queries combined.
 *
 * Used by: App.jsx (route /reports)
 * Depends on: DashboardShell, StatCard, Badge, Button, Icon, api.fetchCoralReport
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import StatCard from '../components/atoms/StatCard.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'
import { fetchCoralReport } from '../services/api.js'
import LiveCrossSourceSqlCard, {
  buildGithubCrossJoinPreviewRows,
} from '../components/reports/LiveCrossSourceSqlCard.jsx'

/** Pulsing Coral SQL attribution chip on analytics cards. */
function CoralBadge() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        background: 'var(--accent-light)',
        border: '1px solid var(--border)',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        color: 'var(--accent-text)',
        letterSpacing: '0.04em',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'pulse-dot 1.5s ease-in-out infinite',
        }}
      />
      CORAL SQL
    </div>
  )
}

/** Reports dashboard — Coral cross-source analytics. */
export default function ReportsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchCoralReport()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load report')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const isLive = Boolean(!loading && !error && data?.coral_available)
  const githubMode = data?.github_mode ?? 'file'
  const previewRows = buildGithubCrossJoinPreviewRows(data?.github_knowledge_cross_join)

  const busFactor = data?.bus_factor || []
  const teamConcentration = data?.team_concentration || []
  const incidentResolvers = data?.incident_resolvers || []
  const undocumentedWorkflows = data?.undocumented_workflows || []

  const soleOwners = busFactor.filter((r) => (r.owner_count ?? 0) <= 1).length
  const criticalTeams = teamConcentration.filter((r) => (r.avg_risk_score ?? 0) > 60).length
  const unresolvedSystems = new Set(
    incidentResolvers.map((r) => r.affected_system).filter(Boolean),
  ).size
  const undocCount = undocumentedWorkflows.length

  return (
    <DashboardShell
      title="Reports"
      subtitle="Cross-source analytics · Powered by Coral SQL"
      actions={
        <Button variant="secondary" size="sm" icon="file">
          Export Report
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <LiveCrossSourceSqlCard
          previewRows={previewRows}
          isLive={isLive}
          githubMode={githubMode}
          previewVariant="github"
        />

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 20px',
              background: 'oklch(97% 0.04 25)',
              border: '1px solid oklch(90% 0.07 25)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Icon name="alert" size={18} color="var(--danger)" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Analytics could not load
              </p>
              <p
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                }}
              >
                {error} — SQL demo above uses fallback rows.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && !data?.coral_available && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 24px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Icon name="database" size={32} color="var(--text-tertiary)" />
            <p style={{ fontSize: 14, fontWeight: 600, marginTop: 12 }}>
              Coral analytics unavailable
            </p>
            <code
              style={{
                display: 'inline-block',
                marginTop: 12,
                padding: '6px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
              }}
            >
              brew install withcoral/tap/coral
            </code>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 120,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                  backgroundImage:
                    'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
                  backgroundSize: '200% 100%',
                }}
              />
            ))}
          </div>
        )}

        {!loading && !error && data?.coral_available && (
          <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          <StatCard
            label="Sole-Owner Systems"
            value={String(soleOwners)}
            sublabel="single point of failure"
            delay={0}
          />
          <StatCard
            label="High-Risk Teams"
            value={String(criticalTeams)}
            sublabel="avg risk score > 60"
            delay={60}
          />
          <StatCard
            label="Systems in Incidents"
            value={String(unresolvedSystems)}
            sublabel="appeared in postmortems"
            delay={120}
          />
          <StatCard
            label="Undocumented Workflows"
            value={String(undocCount)}
            sublabel="no runbook on record"
            delay={180}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xs)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Bus Factor Analysis
                </span>
                <p
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)',
                    marginTop: 2,
                  }}
                >
                  Single-owner system dependencies
                </p>
              </div>
              <CoralBadge />
            </div>
            {busFactor.slice(0, 6).map((row, i) => {
              const ownerCount = row.owner_count ?? 0
              const isSole = ownerCount <= 1
              return (
                <div
                  key={row.system_name || i}
                  style={{
                    padding: '12px 20px',
                    borderBottom:
                      i < Math.min(busFactor.length, 6) - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
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
                      background: isSole ? 'var(--danger)' : 'var(--warning)',
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
                    {row.system_name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {ownerCount} owner{ownerCount !== 1 ? 's' : ''}
                  </span>
                  <Badge variant={isSole ? 'danger' : 'warning'} size="xs">
                    {isSole ? 'Sole' : 'Limited'}
                  </Badge>
                </div>
              )
            })}
            {busFactor.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                }}
              >
                No bus-factor data returned
              </div>
            )}
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xs)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Team Knowledge Concentration
                </span>
                <p
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)',
                    marginTop: 2,
                  }}
                >
                  Avg individual risk score by team
                </p>
              </div>
              <CoralBadge />
            </div>
            {teamConcentration.map((row, i) => {
              const score = Math.round(row.avg_risk_score || 0)
              const barColor =
                score > 75
                  ? 'var(--danger)'
                  : score > 50
                    ? 'var(--warning)'
                    : score > 30
                      ? 'var(--accent)'
                      : 'var(--success)'
              return (
                <div
                  key={row.team || i}
                  style={{
                    padding: '12px 20px',
                    borderBottom:
                      i < teamConcentration.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {row.team}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {score}/100
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(score, 100)}%`,
                        background: barColor,
                        borderRadius: 2,
                        transformOrigin: 'left',
                        animation: 'slideRight 0.6s ease both',
                        animationDelay: `${i * 80}ms`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
            {teamConcentration.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                }}
              >
                No team concentration data returned
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Incident Resolver Chain
              </span>
              <p
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                  marginTop: 2,
                }}
              >
                Coral SQL — 3-way JOIN: incidents × resolvers × affected systems
              </p>
            </div>
            <CoralBadge />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {[
                  'Incident',
                  'Severity',
                  'Resolved By',
                  'Affected System',
                  'Confidence',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 20px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-tertiary)',
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidentResolvers.slice(0, 8).map((row, i) => {
                const confidence = Math.min(
                  100,
                  Math.round((row.resolver_confidence ?? 0) * 100),
                )
                const severityVariant =
                  row.severity === 'P0'
                    ? 'danger'
                    : row.severity === 'P1'
                      ? 'warning'
                      : 'default'
                return (
                  <tr
                    key={`${row.incident_id || row.incident_name}-${i}`}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = ''
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 20px',
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {row.incident_name || row.incident_id || '—'}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <Badge variant={severityVariant} size="xs">
                        {row.severity || '—'}
                      </Badge>
                    </td>
                    <td
                      style={{
                        padding: '12px 20px',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {row.resolved_by || '—'}
                    </td>
                    <td
                      style={{
                        padding: '12px 20px',
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {row.affected_system || '—'}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 60,
                            height: 3,
                            background: 'var(--bg-tertiary)',
                            borderRadius: 2,
                          }}
                        >
                          <div
                            style={{
                              width: `${confidence}%`,
                              height: '100%',
                              background: 'var(--accent)',
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          {confidence}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {incidentResolvers.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: 13,
              }}
            >
              No incident resolver data returned
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Undocumented Workflow Risk
              </span>
              <p
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                  marginTop: 2,
                }}
              >
                Coral SQL — workflows with no runbook, sorted by risk score
              </p>
            </div>
            <CoralBadge />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {undocumentedWorkflows.map((row, i) => (
              <div
                key={row.workflow_id || row.workflow_name || i}
                style={{
                  padding: '16px 20px',
                  borderBottom:
                    i < undocumentedWorkflows.length - 1
                      ? '1px solid var(--border-subtle)'
                      : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <Icon name="workflow" size={16} color="var(--text-tertiary)" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {row.workflow_name || row.workflow_id}
                  </span>
                  {row.owner_name && (
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-tertiary)',
                        marginLeft: 8,
                      }}
                    >
                      owned by {row.owner_name}
                    </span>
                  )}
                </div>
                <Badge variant="danger" size="xs">
                  Undocumented
                </Badge>
                <Button
                  variant="accent"
                  size="sm"
                  icon="zap"
                  onClick={() => navigate('/sources')}
                >
                  Extract Steps
                </Button>
              </div>
            ))}
            {undocumentedWorkflows.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                }}
              >
                No undocumented workflows detected — good posture!
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 20px',
            background: 'var(--accent-light)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon name="database" size={16} color="var(--accent-text)" />
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-text)',
            }}
          >
            All analytics above retrieved via Coral SQL cross-source JOINs across
            Neo4j (knowledge graph), incident reports, and Slack exports.             No ETL.
            No warehouse. One SQL interface.
          </span>
        </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
