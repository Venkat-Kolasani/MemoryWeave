/**
 * SourcesPage.jsx
 *
 * Connected data sources and ingestion status.
 *
 * Used by: App.jsx (currentPage === 'sources')
 * Depends on: setCurrentPage prop, appStore sources slice (future)
 */

/**
 * @param {{ setCurrentPage: (page: string) => void }} props
 */
export default function SourcesPage({ setCurrentPage }) {
  return (
    <main style={{ padding: 48, animation: 'fadeIn 0.3s ease both' }}>
      <h1 style={{ fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
        Data Sources
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>Sources — stub</p>
    </main>
  )
}
