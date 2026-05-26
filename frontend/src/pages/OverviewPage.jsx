/**
 * OverviewPage.jsx
 *
 * Dashboard overview — stats, graph preview, and operational summary.
 *
 * Used by: App.jsx (currentPage === 'dashboard')
 * Depends on: setCurrentPage prop, appStore (future)
 */

/**
 * @param {{ setCurrentPage: (page: string) => void }} props
 */
export default function OverviewPage({ setCurrentPage }) {
  return (
    <main style={{ padding: 48, animation: 'fadeIn 0.3s ease both' }}>
      <h1 style={{ fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
        Overview
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>Dashboard — stub</p>
    </main>
  )
}
