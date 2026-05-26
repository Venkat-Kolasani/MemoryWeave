/**
 * TopBar.jsx
 *
 * App header with title, subtitle, search, notifications, and action slot.
 *
 * Used by: DashboardShell
 * Depends on: Icon
 */

import Icon from '../atoms/Icon.jsx'

/**
 * Dashboard top bar with search and optional action buttons.
 * @param {{ title: string, subtitle?: string, actions?: React.ReactNode }} props
 */
export default function TopBar({ title, subtitle, actions }) {
  return (
    <header
      className="flex shrink-0 items-center"
      style={{
        height: 60,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
        gap: 16,
      }}
    >
      <div className="flex-1">
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              marginTop: 1,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center" style={{ gap: 12 }}>
        {/* Search */}
        <div className="relative">
          <span
            className="pointer-events-none absolute flex items-center"
            style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }}
          >
            <Icon name="search" size={13} color="var(--text-tertiary)" />
          </span>
          <input
            type="search"
            placeholder="Search knowledge base..."
            style={{
              width: 200,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '7px 12px 7px 32px',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        {actions}

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex items-center justify-center border-none cursor-pointer"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--bg-secondary)',
          }}
        >
          <Icon name="bell" size={16} color="var(--text-secondary)" />
          <span
            className="absolute"
            style={{
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--danger)',
            }}
          />
        </button>
      </div>
    </header>
  )
}
