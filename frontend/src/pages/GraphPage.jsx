/**
 * GraphPage.jsx
 *
 * Full interactive knowledge graph with filters and node detail panel.
 *
 * Used by: App.jsx (currentPage === 'graph')
 * Depends on: setCurrentPage prop, appStore graph slices (future)
 */

/**
 * @param {{ setCurrentPage: (page: string) => void }} props
 */
export default function GraphPage({ setCurrentPage }) {
  return (
    <main style={{ padding: 48, animation: 'fadeIn 0.3s ease both' }}>
      <h1 style={{ fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
        Knowledge Graph
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>Graph — stub</p>
    </main>
  )
}
