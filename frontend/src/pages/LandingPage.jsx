/**
 * LandingPage.jsx
 *
 * Marketing landing page — full-scroll hero and product sections.
 *
 * Used by: App.jsx (route `/`)
 * Depends on: useNavigate for programmatic navigation into the app
 */

import { useNavigate } from 'react-router-dom'

/** Landing page with entry point into the dashboard. */
export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        animation: 'fadeUp 0.5s ease both',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
          marginBottom: 12,
        }}
      >
        MemoryWeave
      </p>
      <h1
        style={{
          fontWeight: 600,
          letterSpacing: '-0.04em',
          fontSize: 40,
          marginBottom: 16,
        }}
      >
        Landing Page
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Organizational memory intelligence — stub
      </p>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          padding: '10px 20px',
          background: 'var(--text-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
        }}
      >
        Enter Dashboard
      </button>
    </main>
  )
}
