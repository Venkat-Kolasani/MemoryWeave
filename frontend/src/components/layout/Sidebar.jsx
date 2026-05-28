/**
 * Sidebar.jsx
 *
 * Dark navigation sidebar. Detects active route via useLocation().
 * Navigates via useNavigate(). Receives no navigation props.
 *
 * Used by: DashboardShell
 * Depends on: Icon, react-router-dom
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../atoms/Icon.jsx'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: 'home' },
  { path: '/graph', label: 'Knowledge Graph', icon: 'graph' },
  { path: '/workflows', label: 'Workflows', icon: 'workflow' },
  { path: '/risk', label: 'Risk Analytics', icon: 'alert', hasDot: true },
  { path: '/assistant', label: 'AI Assistant', icon: 'ai' },
  { path: '/sources', label: 'Data Sources', icon: 'database' },
  { path: '/reports', label: 'Reports', icon: 'reports' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
]

/** Dark app sidebar with React Router navigation. */
export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [hoveredPath, setHoveredPath] = useState(null)

  return (
    <aside
      className="flex shrink-0 flex-col"
      style={{
        width: 220,
        background: '#111110',
        height: '100vh',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex w-full items-center gap-2 border-none bg-transparent p-0 cursor-pointer"
          style={{ gap: 9 }}
        >
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 26,
              height: 26,
              background: 'oklch(100% 0 0)',
              borderRadius: 7,
            }}
          >
            <Icon name="layers" size={13} color="#111110" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 14,
              color: 'oklch(100% 0 0)',
              letterSpacing: '-0.02em',
            }}
          >
            MemoryWeave
          </span>
        </button>
      </div>

      {/* Nav items */}
      <nav
        className="flex flex-1 flex-col overflow-auto"
        style={{ padding: 8, gap: 2 }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path
          const isHovered = hoveredPath === item.path

          let background = 'transparent'
          if (isActive) background = 'rgba(255,255,255,0.1)'
          else if (isHovered) background = 'rgba(255,255,255,0.05)'

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(null)}
              className="flex w-full items-center border-none cursor-pointer"
              style={{
                padding: '8px 10px',
                borderRadius: 7,
                gap: 9,
                background,
                transition: 'all 0.15s',
              }}
            >
              <Icon
                name={item.icon}
                size={15}
                color={isActive ? 'oklch(100% 0 0)' : 'rgba(255,255,255,0.4)'}
              />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'oklch(100% 0 0)' : 'rgba(255,255,255,0.5)',
                }}
              >
                {item.label}
              </span>
              {item.hasDot && (
                <span
                  className="ml-auto shrink-0"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: 'oklch(50% 0.16 25)',
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* User section */}
      <div
        style={{
          padding: '12px 8px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'rgba(255,255,255,0.1)',
            }}
          >
            <Icon name="user" size={13} color="rgba(255,255,255,0.6)" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'oklch(100% 0 0)',
              }}
            >
              Sarah Chen
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Admin
            </div>
          </div>
          <span className="ml-auto shrink-0">
            <Icon name="settings" size={13} color="rgba(255,255,255,0.4)" />
          </span>
        </div>
      </div>
    </aside>
  )
}
