/**
 * Badge.jsx
 *
 * Status and category label component. Used throughout for risk levels, node types, statuses.
 *
 * Used by: all pages
 * Depends on: nothing
 */

const VARIANT_STYLES = {
  default: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  accent: {
    background: 'var(--accent-light)',
    color: 'var(--accent-text)',
    border: '1px solid oklch(88% 0.06 240)',
  },
  danger: {
    background: 'oklch(97% 0.04 25)',
    color: 'oklch(42% 0.16 25)',
    border: '1px solid oklch(90% 0.07 25)',
  },
  warning: {
    background: 'oklch(97% 0.04 65)',
    color: 'oklch(48% 0.14 65)',
    border: '1px solid oklch(90% 0.07 65)',
  },
  success: {
    background: 'oklch(97% 0.04 160)',
    color: 'oklch(40% 0.14 160)',
    border: '1px solid oklch(90% 0.07 160)',
  },
  dark: {
    background: 'var(--text-primary)',
    color: 'oklch(100% 0 0)',
    border: 'none',
  },
}

const SIZE_STYLES = {
  xs: { fontSize: 10, padding: '2px 6px', borderRadius: 4 },
  sm: { fontSize: 11, padding: '3px 8px', borderRadius: 5 },
  md: { fontSize: 12, padding: '4px 10px', borderRadius: 6 },
}

/**
 * Renders a compact status or category badge.
 * @param {{ children: React.ReactNode, variant?: keyof typeof VARIANT_STYLES, size?: keyof typeof SIZE_STYLES }} props
 */
export default function Badge({ children, variant = 'default', size = 'sm' }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        letterSpacing: '0.02em',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
      }}
    >
      {children}
    </span>
  )
}
