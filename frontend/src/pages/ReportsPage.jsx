/**
 * ReportsPage.jsx
 *
 * Reports and exports placeholder — nav item only, no real content per project rules.
 *
 * Used by: App.jsx (route /reports)
 * Depends on: DashboardShell, Icon
 */

import DashboardShell from '../components/layout/DashboardShell.jsx'
import Icon from '../components/atoms/Icon.jsx'

/** Reports page placeholder. */
export default function ReportsPage() {
  return (
    <DashboardShell title="Reports" subtitle="Analytics & export history">
      <div style={{ padding: 80, textAlign: 'center', animation: 'fadeIn 0.3s ease both' }}>
        <div style={{ marginBottom: 16 }}>
          <Icon name="reports" size={48} color="var(--text-tertiary)" />
        </div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Reports
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--text-tertiary)',
            marginTop: 8,
          }}
        >
          Coming in next sprint
        </p>
      </div>
    </DashboardShell>
  )
}
