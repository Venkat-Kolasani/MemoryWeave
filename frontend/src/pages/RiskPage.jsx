/**
 * RiskPage.jsx
 *
 * Dependency risk inventory, team heatmap, operational bottlenecks.
 *
 * Used by: App.jsx route /risk
 * Depends on: DashboardShell, StatCard, Badge, Button, Icon, useAppStore
 */

import { useEffect, useMemo, useState } from 'react'
import useAppStore from '../stores/appStore.js'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import StatCard from '../components/atoms/StatCard.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'

const TABLE_FILTERS = ['All', 'Critical', 'High', 'Medium']

const TABLE_COLUMNS = '2fr 1fr 120px 80px 100px'

const TABLE_HEADERS = [
  'System / Workflow',
  'Primary Owner',
  'Risk Score',
  'Documented',
  'Action',
]

/** Extracts the leading initial from an owner name (e.g. "A. Patel" → "A"). */
function ownerInitial(owner) {
  const trimmed = owner.trim()
  if (!trimmed) return '?'
  const match = trimmed.match(/^([A-Za-z])/)
  return match ? match[1].toUpperCase() : trimmed[0].toUpperCase()
}

/** Maps risk level to progress bar fill color. */
function scoreBarColor(level) {
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

/** Maps risk level to score label color. */
function scoreTextColor(level) {
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
            value="3"
            sublabel="immediate action"
            delay={0}
          />
          <StatCard
            label="High Risks"
            value="11"
            sublabel="monitoring"
            delay={60}
          />
          <StatCard
            label="Undocumented"
            value="47%"
            delta={-5}
            sublabel="vs last quarter"
            delay={120}
          />
          <StatCard
            label="Single Points"
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
              borderRadius: 12,
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
                        border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                        background: 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
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
              {TABLE_HEADERS.map((header) => (
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
              ))}
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
                      marginTop: 2,
                    }}
                  >
                    {risk.systems} dependent systems
                  </div>
                </div>

                <div className="flex items-center">
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {ownerInitial(risk.owner)}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      marginLeft: 8,
                    }}
                  >
                    {risk.owner}
                  </span>
                </div>

                <div className="flex flex-col" style={{ gap: 6 }}>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: 'var(--bg-tertiary)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${risk.score}%`,
                        background: scoreBarColor(risk.level),
                        borderRadius: 2,
                        transformOrigin: 'left',
                        animation: `slideRight 0.8s ease ${index * 0.05}s both`,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: scoreTextColor(risk.level),
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
            {/* Knowledge Concentration */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 20,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: 16,
                }}
              >
                Knowledge Concentration
              </div>
              <div className="flex flex-col" style={{ gap: 10 }}>
                {riskHeatmap.map((item, index) => (
                  <div key={item.label}>
                    <div
                      className="flex justify-between"
                      style={{ marginBottom: 6 }}
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
                          transformOrigin: 'left',
                          animation: `slideRight 0.8s ease ${index * 0.1}s both`,
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
                borderRadius: 12,
                padding: 20,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: 16,
                }}
              >
                Operational Bottlenecks
              </div>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {riskBottlenecks.map((item) => {
                  const styles = bottleneckStyles(item.level)
                  return (
                    <div
                      key={item.label}
                      className="flex items-start"
                      style={{
                        gap: 10,
                        padding: '10px 12px',
                        background: styles.background,
                        borderRadius: 8,
                        border: styles.border,
                      }}
                    >
                      <Icon
                        name="alert"
                        size={16}
                        color={styles.iconColor}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
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
