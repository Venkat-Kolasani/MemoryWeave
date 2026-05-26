/**
 * SourcesPage.jsx
 *
 * Data source management. Shows connected sources with status and stats.
 *
 * Used by: App.jsx route /sources
 * Depends on: DashboardShell, StatCard, Badge, Button, Icon, useAppStore
 */

import DashboardShell from '../components/layout/DashboardShell.jsx'
import StatCard from '../components/atoms/StatCard.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'
import { MOCK_SOURCES, MOCK_STATS } from '../data/mockData.js'

/** Maps source status to Badge variant and label. */
function statusBadge(status) {
  switch (status) {
    case 'active':
      return { variant: 'success', label: 'Active' }
    case 'syncing':
      return { variant: 'accent', label: 'Syncing' }
    default:
      return { variant: 'default', label: 'Inactive' }
  }
}

/** Data sources page with connection stats and source cards. */
export default function SourcesPage() {
  return (
    <DashboardShell
      title="Data Sources"
      subtitle="Connected intelligence pipelines"
      actions={
        <Button variant="primary" size="sm" icon="plus">
          Connect Source
        </Button>
      }
    >
      <div className="flex flex-col" style={{ gap: 24, animation: 'fadeIn 0.3s ease both' }}>
        {/* Row 1 — Stats */}
        <div className="grid grid-cols-4" style={{ gap: 16 }}>
          <StatCard label="Connected" value="6" delay={0} />
          <StatCard label="Active Pipelines" value="5" delay={60} />
          <StatCard
            label="Nodes Extracted"
            value={MOCK_STATS.nodes.toLocaleString()}
            delay={120}
          />
          <StatCard label="Last Sync" value="4 min ago" delay={180} />
        </div>

        {/* Row 2 — Sources grid */}
        <div className="grid grid-cols-3" style={{ gap: 16 }}>
          {MOCK_SOURCES.map((source) => {
            const badge = statusBadge(source.status)
            const isInactive = source.status === 'inactive'

            return (
              <div
                key={source.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-xs)',
                  padding: 24,
                }}
              >
                <div
                  className="flex items-start justify-between"
                  style={{ marginBottom: 16 }}
                >
                  <div className="flex items-center">
                    <Icon name={source.icon} size={20} color="var(--text-secondary)" />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginLeft: 10,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {source.name}
                    </span>
                  </div>
                  <Badge variant={badge.variant} size="xs">
                    {badge.label}
                  </Badge>
                </div>

                <div
                  className="flex"
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 16,
                    marginBottom: 16,
                  }}
                >
                  {[
                    `${source.nodes.toLocaleString()} nodes`,
                    `Synced ${source.lastSync}`,
                    `${source.channels} sources`,
                  ].map((stat, index) => (
                    <div
                      key={stat}
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        textAlign: 'center',
                        borderRight:
                          index < 2 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      {stat}
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={isInactive ? 'plus' : undefined}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isInactive ? 'Connect' : 'Manage'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
