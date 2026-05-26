/**
 * StatCard.jsx
 *
 * Dashboard metric display with animated entrance.
 *
 * Used by: OverviewPage, RiskPage, SourcesPage
 * Depends on: nothing
 */

/**
 * Renders a labeled metric with optional delta and sublabel.
 * @param {{
 *   label: string,
 *   value: string | number,
 *   delta?: number,
 *   sublabel?: string,
 *   delay?: number,
 * }} props
 */
export default function StatCard({ label, value, delta, sublabel, delay = 0 }) {
  const deltaColor =
    delta > 0 ? 'oklch(42% 0.14 160)' : 'oklch(42% 0.16 25)'

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xs)',
        padding: '20px 24px',
        animation: `fadeUp 0.5s ease ${delay}ms both`,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      {delta != null && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: deltaColor,
            marginTop: 4,
          }}
        >
          {delta > 0 ? '+' : ''}
          {delta}%
        </div>
      )}

      {sublabel && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-tertiary)',
            marginTop: 2,
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  )
}
