/**
 * SettingsPage.jsx
 *
 * Application settings placeholder — nav item only, no real content per project rules.
 *
 * Used by: App.jsx (route /settings)
 * Depends on: DashboardShell, Icon
 */

import DashboardShell from '../components/layout/DashboardShell.jsx'
import Icon from '../components/atoms/Icon.jsx'

/** Settings page placeholder. */
export default function SettingsPage() {
  return (
    <DashboardShell title="Settings" subtitle="Workspace configuration">
      <div style={{ padding: 80, textAlign: 'center', animation: 'fadeIn 0.3s ease both' }}>
        <div style={{ marginBottom: 16 }}>
          <Icon name="settings" size={48} color="var(--text-tertiary)" />
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
          Settings
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
