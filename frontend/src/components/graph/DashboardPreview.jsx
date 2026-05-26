/**
 * DashboardPreview.jsx
 *
 * Clickable browser mockup shown in landing hero. Contains MiniKnowledgeGraph.
 *
 * Used by: LandingPage
 * Depends on: MiniKnowledgeGraph, react-router-dom, Icon
 */

import { useNavigate } from 'react-router-dom'
import Icon from '../atoms/Icon.jsx'
import MiniKnowledgeGraph from './MiniKnowledgeGraph.jsx'

const SIDEBAR_ICONS = ['home', 'graph', 'workflow', 'alert', 'ai', 'database', 'reports', 'settings']

const RISK_SIGNALS = [
  {
    name: 'Payment Service',
    owner: 'A. Patel',
    risk: 95,
    dotColor: 'var(--danger)',
    barColor: 'oklch(50% 0.16 25)',
  },
  {
    name: 'Auth Pipeline',
    owner: 'R. Chen',
    risk: 78,
    dotColor: 'var(--warning)',
    barColor: 'oklch(60% 0.14 65)',
  },
  {
    name: 'Data Ingestion',
    owner: 'M. Kim',
    risk: 64,
    dotColor: 'var(--accent)',
    barColor: 'oklch(50% 0.12 240)',
  },
  {
    name: 'Deploy System',
    owner: 'T. Walsh',
    risk: 41,
    dotColor: 'var(--success)',
    barColor: 'oklch(52% 0.14 160)',
  },
]

const STAT_STRIP = [
  { label: 'Critical Deps', value: '3' },
  { label: 'At-risk nodes', value: '11' },
  { label: 'Undocumented', value: '47%' },
]

/** Browser-style dashboard mockup; navigates to /dashboard on click. */
export default function DashboardPreview() {
  const navigate = useNavigate()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate('/dashboard')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate('/dashboard')
        }
      }}
      className="overflow-hidden cursor-pointer"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-lg)',
        animation: 'float 6s ease-in-out infinite',
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center"
        style={{
          height: 40,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '0 16px',
          gap: 8,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />

        <div className="flex flex-1 justify-center">
          <div
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              minWidth: 200,
            }}
          >
            app.memoryweave.ai/graph
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: 380 }}>
        {/* Icon sidebar */}
        <div
          className="flex shrink-0 flex-col items-center"
          style={{
            width: 52,
            background: '#111110',
            padding: '16px 0',
            gap: 8,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'oklch(100% 0 0)',
              marginBottom: 4,
            }}
          >
            <Icon name="layers" size={13} color="#111110" />
          </div>

          {SIDEBAR_ICONS.map((iconName, index) => {
            const isGraph = index === 1
            return (
              <div
                key={iconName}
                className="flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isGraph
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon
                  name={iconName}
                  size={14}
                  color={isGraph ? 'oklch(100% 0 0)' : 'rgba(255,255,255,0.4)'}
                />
              </div>
            )
          })}
        </div>

        {/* Main area */}
        <div
          className="flex min-w-0 flex-1 flex-col overflow-hidden"
          style={{
            background: 'var(--bg)',
            padding: 16,
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Knowledge Graph
            </div>
            <div className="flex" style={{ gap: 6 }}>
              {['Filter', 'Export'].map((label) => (
                <div
                  key={label}
                  style={{
                    fontSize: 10,
                    padding: '4px 10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 5,
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative min-h-0 flex-1 overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}
          >
            <MiniKnowledgeGraph />
          </div>

          {/* Stat strip */}
          <div
            className="grid grid-cols-3"
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 12,
              marginTop: 12,
              gap: 8,
            }}
          >
            {STAT_STRIP.map((stat) => (
              <div
                key={stat.label}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                }}
              >
                {stat.label}:{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk signals panel */}
        <aside
          className="shrink-0 overflow-hidden"
          style={{
            width: 200,
            background: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-primary)',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            Risk Signals
          </div>

          {RISK_SIGNALS.map((item, index) => (
            <div
              key={item.name}
              style={{
                padding: '12px 16px',
                borderBottom:
                  index < RISK_SIGNALS.length - 1
                    ? '1px solid var(--border-subtle)'
                    : 'none',
              }}
            >
              <div className="flex items-center" style={{ gap: 10 }}>
                <span
                  className="shrink-0"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: item.dotColor,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {item.owner}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: item.barColor,
                    flexShrink: 0,
                  }}
                >
                  {item.risk}%
                </span>
              </div>

              <div
                style={{
                  height: 4,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 2,
                  marginTop: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${item.risk}%`,
                    background: item.barColor,
                    borderRadius: 2,
                    animation: `slideRight 0.8s ease ${index * 0.15}s both`,
                    transformOrigin: 'left',
                  }}
                />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
