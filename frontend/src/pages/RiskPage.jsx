/**
 * RiskPage.jsx
 *
 * Bus-factor and knowledge-loss risk report with inventory table,
 * team concentration heatmap, and operational bottleneck alerts.
 *
 * Used by: App.jsx (route `/risk`)
 * Depends on: DashboardShell, StatCard, Badge, Button, Icon,
 *             useAppStore (riskItems, riskHeatmap, riskBottlenecks, fetchRiskReport)
 */

import { useEffect, useMemo, useState } from 'react'
import useAppStore from '../stores/appStore.js'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import StatCard from '../components/atoms/StatCard.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'

const TABLE_FILTERS = ['All', 'Critical', 'High', 'Medium']

const TABLE_COLUMNS = '2fr 1fr 1fr 80px 1fr'

/** Maps risk level to score bar fill color. */
function scoreBarColor(level) {
  switch (level) {
    case 'critical':
      return 'var(--danger)'
    case 'high':
    case 'medium':
      return 'var(--warning)'
    default:
      return 'var(--success)'
  }
}

/** Maps heatmap value to semantic color token. */
function heatmapColor(value) {
  if (value > 70) return 'var(--danger)'
  if (value > 50) return 'var(--warning)'
  return 'var(--success)'
}

/** Maps bottleneck level to panel background and border. */
function bottleneckStyles(level) {
  if (level === 'critical') {
    return {
      background: 'oklch(97% 0.04 25)',
      border: '1px solid oklch(90% 0.07 25)',
      iconColor: 'oklch(42% 0.16 25)',
    }
  }
  return {
    background: 'oklch(97% 0.04 65)',
    border: '1px solid oklch(90% 0.07 65)',
    iconColor: 'oklch(48% 0.14 65)',
  }
}

/** Risk analytics page with dependency inventory, heatmap, and bottlenecks. */
export default function RiskPage() {
  const riskItems = useAppStore((s) => s.riskItems)
  const riskHeatmap = useAppStore((s) => s.riskHeatmap)
  const riskBottlenecks = useAppStore((s) => s.riskBottlenecks)
  const fetchRiskReport = useAppStore((s) => s.fetchRiskReport)

  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    fetchRiskReport()
  }, [fetchRiskReport])

  const filteredRisks = useMemo(() => {
    if (activeFilter === 'All') return riskItems
    return riskItems.filter(
      (item) => item.level === activeFilter.toLowerCase(),
    )
  }, [activeFilter, riskItems])

  const criticalCount = riskItems.filter((item) => item.level === 'critical').length
  const highCount = riskItems.filter((item) => item.level === 'high').length

  return (
    <DashboardShell
      title="Risk Analytics"
      subtitle="Knowledge concentration & dependency risk"
      actions={
        <Button variant="secondary" size="sm" icon="file">
          Export Report
        </Button>
      }
    >
      <div className="flex flex-col" style={{ gap: 24, animation: 'fadeIn 0.3s ease both' }}>
        {/* Row 1 — Stats */}
        <div className="grid grid-cols-4" style={{ gap: 16 }}>
          <StatCard
            label="Critical Risks"
            value={String(criticalCount || 3)}
            sublabel="immediate action"
            delay={0}
          />
          <StatCard
            label="High Risks"
            value={String(highCount || 11)}
            sublabel="monitoring"
            delay={60}
          />
          <StatCard
            label="Undocumented Systems"
            value="47%"
            delta={-5}
            sublabel="vs last quarter"
            delay={120}
          />
          <StatCard
            label="Single Points of Failure"
            value="8"
            sublabel="people-system deps"
            delay={180}
          />
        </div>

        {/* Row 2 — Table + side panels */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Dependency Risk Inventory */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Dependency Risk Inventory
              </div>
              <div className="flex" style={{ gap: 6 }}>
                {TABLE_FILTERS.map((filter) => {
                  const isActive = activeFilter === filter
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      style={{
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                        background: isActive ? 'var(--accent-light)' : 'var(--bg)',
                        color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {filter}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: TABLE_COLUMNS,
                padding: '10px 20px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {['System / Workflow', 'Primary Owner', 'Score', 'Documented', 'Action'].map(
                (header) => (
                  <div
                    key={header}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {header}
                  </div>
                ),
              )}
            </div>

            {filteredRisks.map((risk, index) => (
              <div
                key={risk.id ?? risk.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: TABLE_COLUMNS,
                  padding: '14px 20px',
                  borderBottom:
                    index < filteredRisks.length - 1
                      ? '1px solid var(--border-subtle)'
                      : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = 'transparent'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {risk.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {risk.systems} dependent systems
                  </div>
                </div>

                <div className="flex items-center" style={{ gap: 7 }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                    }}
                  >
                    <Icon name="user" size={11} color="var(--text-tertiary)" />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {risk.owner}
                  </span>
                </div>

                <div className="flex items-center" style={{ gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${risk.score}%`,
                        background: scoreBarColor(risk.level),
                        borderRadius: 2,
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      minWidth: 28,
                    }}
                  >
                    {risk.score}
                  </span>
                </div>

                <div>
                  <Badge variant={risk.undoc ? 'danger' : 'success'} size="xs">
                    {risk.undoc ? 'No' : 'Yes'}
                  </Badge>
                </div>

                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={risk.undoc ? 'zap' : 'eye'}
                  >
                    {risk.undoc ? 'Extract' : 'Review'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Right stack — heatmap + bottlenecks */}
          <div className="flex flex-col" style={{ gap: 16 }}>
            {/* Knowledge Concentration by Team */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Knowledge Concentration by Team
                </div>
              </div>
              <div
                className="flex flex-col"
                style={{ padding: '16px 18px', gap: 10 }}
              >
                {riskHeatmap.map((item) => (
                  <div key={item.label}>
                    <div
                      className="flex justify-between"
                      style={{ marginBottom: 5 }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: heatmapColor(item.value),
                        }}
                      >
                        {item.value}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: 'var(--bg-tertiary)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${item.value}%`,
                          borderRadius: 3,
                          background: heatmapColor(item.value),
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Bottlenecks */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Operational Bottlenecks
                </div>
              </div>
              <div
                className="flex flex-col"
                style={{ padding: '12px 16px', gap: 8 }}
              >
                {riskBottlenecks.map((item) => {
                  const styles = bottleneckStyles(item.level)
                  return (
                    <div
                      key={item.label}
                      className="flex items-start"
                      style={{
                        gap: 8,
                        padding: '8px 10px',
                        background: styles.background,
                        borderRadius: 'var(--radius-md)',
                        border: styles.border,
                      }}
                    >
                      <Icon
                        name="alert"
                        size={13}
                        color={styles.iconColor}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
