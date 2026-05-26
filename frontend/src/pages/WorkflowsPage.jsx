/**
 * WorkflowsPage.jsx
 *
 * Extracted workflows, dependencies, and process documentation.
 *
 * Used by: App.jsx (currentPage === 'workflows')
 * Depends on: setCurrentPage prop, appStore (future)
 */

/**
 * @param {{ setCurrentPage: (page: string) => void }} props
 */
export default function WorkflowsPage({ setCurrentPage }) {
  return (
    <main style={{ padding: 48, animation: 'fadeIn 0.3s ease both' }}>
      <h1 style={{ fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
        Workflows
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>Workflows — stub</p>
    </main>
  )
}
