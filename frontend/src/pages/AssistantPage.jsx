/**
 * AssistantPage.jsx
 *
 * AI assistant chat with structured incident-recovery responses.
 *
 * Used by: App.jsx (currentPage === 'assistant')
 * Depends on: setCurrentPage prop, appStore messages slice (future)
 */

/**
 * @param {{ setCurrentPage: (page: string) => void }} props
 */
export default function AssistantPage({ setCurrentPage }) {
  return (
    <main style={{ padding: 48, animation: 'fadeIn 0.3s ease both' }}>
      <h1 style={{ fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
        AI Assistant
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>Assistant — stub</p>
    </main>
  )
}
