/**
 * DashboardShell.jsx
 *
 * Master layout for all app pages. Composes Sidebar + TopBar + scrollable content.
 * Receives no navigation props — routing handled internally by Sidebar.
 *
 * Used by: all app pages (OverviewPage, GraphPage, RiskPage, AssistantPage, SourcesPage)
 * Depends on: Sidebar, TopBar
 */

import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'

/**
 * App shell wrapping dashboard pages with sidebar and top bar.
 * @param {{
 *   children: React.ReactNode,
 *   title: string,
 *   subtitle?: string,
 *   actions?: React.ReactNode,
 *   contentPadding?: string | number,
 *   contentOverflow?: string,
 * }} props
 */
export default function DashboardShell({
  children,
  title,
  subtitle,
  actions,
  contentPadding = '28px',
  contentOverflow = 'auto',
}) {
  return (
    <div
      className="flex overflow-hidden"
      style={{ height: '100vh', background: 'var(--bg)' }}
    >
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} subtitle={subtitle} actions={actions} />

        <main
          style={{
            flex: 1,
            overflow: contentOverflow,
            padding: contentPadding,
            minHeight: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
