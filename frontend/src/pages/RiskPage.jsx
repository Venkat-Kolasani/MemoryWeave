/**
 * RiskPage.jsx
 *
 * Bus-factor and knowledge-loss risk report.
 *
 * Used by: App.jsx (currentPage === 'risk')
 * Depends on: setCurrentPage prop, appStore riskItems (future)
 */

/**
 * @param {{ setCurrentPage: (page: string) => void }} props
 */
export default function RiskPage({ setCurrentPage }) {
  return (
    <main style={{ padding: 48, animation: 'fadeIn 0.3s ease both' }}>
      <h1 style={{ fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
        Risk Report
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>Risk — stub</p>
    </main>
  )
}
