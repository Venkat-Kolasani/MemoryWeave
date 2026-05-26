/**
 * OverviewPage.jsx
 *
 * Main dashboard. Shows stats, mini graph preview, risk signals, recent extractions.
 *
 * Used by: App.jsx route /dashboard
 * Depends on: DashboardShell, StatCard, Badge, Button, Icon, MiniKnowledgeGraph,
 *             useNavigate, useAppStore (knowledgeStats, riskItems)
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../stores/appStore.js'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import StatCard from '../components/atoms/StatCard.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'
import MiniKnowledgeGraph from '../components/graph/MiniKnowledgeGraph.jsx'

const RECENT_EXTRACTIONS = [
  {
    source: 'Slack #incidents',
    item: 'P-4021 recovery workflow',
    time: '2m ago',
  },
  {
    source: 'GitHub PR #847',
    item: 'Deploy pipeline dependency',
    time: '18m ago',
  },
  {
    source: 'Meeting transcript',
    item: 'Q4 architecture decision',
    time: '1h ago',
  },
  {
    source: 'Confluence doc',
    item: 'Auth service runbook',
    time: '3h ago',
  },
]

/** Maps risk level to dot color for signal rows. */
function riskDotColor(level) {
  switch (level) {
    case 'critical':
      return 'var(--danger)'
    case 'high':
      return 'var(--warning)'
    case 'medium':
      return 'var(--accent)'
    default:
      return 'var(--success)'
  }
}

/** Maps risk level to Badge variant. */
function riskBadgeVariant(level) {
  switch (level) {
    case 'critical':
      return 'danger'
    case 'high':
      return 'warning'
    case 'medium':
      return 'accent'
    default:
      return 'success'
  }
}

/** Main dashboard overview with stats, graph preview, and activity feed. */
export default function OverviewPage() {
  const navigate = useNavigate()
  const knowledgeStats = useAppStore((s) => s.knowledgeStats)
  const riskItems = useAppStore((s) => s.riskItems)
  const fetchStats = useAppStore((s) => s.fetchStats)
  const fetchGraph = useAppStore((s) => s.fetchGraph)
  const fetchRiskReport = useAppStore((s) => s.fetchRiskReport)

  useEffect(() => {
    fetchStats()
    fetchGraph()
    fetchRiskReport()
  }, [fetchStats, fetchGraph, fetchRiskReport])

  const topRisks = riskItems.slice(0, 3)

  return (
    <DashboardShell
      title="Overview"
      subtitle="Acme Corp · Last synced 4 min ago"
      actions={
        <Button
          variant="secondary"
          size="sm"
          icon="plus"
          onClick={() => navigate('/sources')}
        >
          Add Source
        </Button>
      }
    >
      <div className="flex flex-col" style={{ gap: 24, animation: 'fadeIn 0.3s ease both' }}>
        {/* Row 1 — Stats */}
        <div className="grid grid-cols-4" style={{ gap: 16 }}>
          <StatCard
            label="Knowledge Nodes"
            value={knowledgeStats.nodes.toLocaleString()}
            delta={12}
            sublabel="vs last month"
            delay={0}
          />
          <StatCard
            label="Undocumented Flows"
            value={knowledgeStats.undocumented.toLocaleString()}
            delta={-8}
            sublabel="actively reducing"
            delay={60}
          />
          <StatCard
            label="Critical Risk Signals"
            value={String(knowledgeStats.risks)}
            sublabel="require attention"
            delay={120}
          />
          <StatCard
            label="AI Queries Today"
            value={String(knowledgeStats.queries)}
            delta={23}
            sublabel="vs yesterday"
            delay={180}
          />
        </div>

        {/* Row 2 — Graph + side panel */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Knowledge Graph card */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-xs)',
              overflow: 'hidden',
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Knowledge Graph
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    marginTop: 2,
                  }}
                >
                  24 people · 18 systems · 7 incidents
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon="externalLink"
                onClick={() => navigate('/graph')}
              >
                Expand
              </Button>
            </div>
            <div
              style={{
                height: 300,
                position: 'relative',
                background: 'var(--bg)',
              }}
            >
              <div style={{ position: 'absolute', inset: 0 }}>
                <MiniKnowledgeGraph />
              </div>
            </div>
          </div>

          {/* Right stack */}
          <div className="flex flex-col" style={{ gap: 16 }}>
            {/* Risk Signals */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-xs)',
                overflow: 'hidden',
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Risk Signals
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/risk')}
                  style={{
                    color: 'var(--accent-text)',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  View all →
                </button>
              </div>

              {topRisks.map((item, index) => (
                <div
                  key={item.id ?? item.name}
                  className="flex items-center"
                  style={{
                    gap: 10,
                    padding: '12px 20px',
                    borderBottom:
                      index < topRisks.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                  }}
                >
                  <span
                    className="shrink-0"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: riskDotColor(item.level),
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {item.owner}
                    </div>
                  </div>
                  <Badge variant={riskBadgeVariant(item.level)} size="xs">
                    {item.score}%
                  </Badge>
                </div>
              ))}
            </div>

            {/* Recent Extractions */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-xs)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Recent Extractions
                </div>
              </div>

              {RECENT_EXTRACTIONS.map((row, index) => (
                <div
                  key={row.item}
                  className="flex items-start"
                  style={{
                    gap: 10,
                    padding: '12px 20px',
                    borderBottom:
                      index < RECENT_EXTRACTIONS.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                  }}
                >
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      marginTop: 1,
                    }}
                  >
                    <Icon name="zap" size={14} color="var(--text-tertiary)" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {row.item}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        marginTop: 2,
                      }}
                    >
                      {row.source} · {row.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
