/**
 * GraphPage.jsx
 *
 * Interactive SVG knowledge graph with filter, node selection, and detail panel.
 *
 * Used by: App.jsx route /graph
 * Depends on: DashboardShell, Badge, Icon, Button, useAppStore, useNavigate
 */

import { useEffect, useId, useMemo } from 'react'
import useAppStore from '../stores/appStore.js'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Icon from '../components/atoms/Icon.jsx'
import {
  graphViewBox,
  layoutGraphNodes,
  nodeDisplayLabel,
} from '../utils/graphLayout.js'

/** When the graph exceeds this size, hide weak edges until a node is selected. */
const DENSE_GRAPH_NODE_THRESHOLD = 24

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'People', value: 'person' },
  { label: 'Systems', value: 'system' },
  { label: 'Incidents', value: 'incident' },
  { label: 'Workflows', value: 'workflow' },
]

const TYPE_LABELS = {
  person: 'People',
  system: 'Systems',
  incident: 'Incidents',
  workflow: 'Workflows',
}

const TYPE_COLORS = {
  person: 'oklch(50% 0.12 240)',
  system: 'oklch(52% 0.14 160)',
  incident: 'oklch(50% 0.16 25)',
  workflow: 'oklch(60% 0.14 65)',
}

const LOADING_PLACEHOLDERS = [
  { cx: 180, cy: 140, r: 22 },
  { cx: 320, cy: 200, r: 18 },
  { cx: 460, cy: 120, r: 16 },
  { cx: 400, cy: 280, r: 14 },
  { cx: 540, cy: 220, r: 12 },
]

/** Maps graph node type to Badge variant. */
function nodeBadgeVariant(type) {
  switch (type) {
    case 'incident':
      return 'danger'
    case 'workflow':
      return 'warning'
    case 'system':
      return 'success'
    default:
      return 'accent'
  }
}

/** Formats detail values for the side panel. */
function formatDetailValue(value) {
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

/** Interactive full-page knowledge graph with filters and node detail panel. */
export default function GraphPage() {
  const gridPatternId = useId()

  const graphNodes = useAppStore((s) => s.graphNodes)
  const graphEdges = useAppStore((s) => s.graphEdges)
  const isGraphLoading = useAppStore((s) => s.isGraphLoading)
  const filterType = useAppStore((s) => s.filterType)
  const selectedNode = useAppStore((s) => s.selectedNode)
  const fetchGraph = useAppStore((s) => s.fetchGraph)
  const setFilterType = useAppStore((s) => s.setFilterType)
  const setSelectedNode = useAppStore((s) => s.setSelectedNode)

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  const isLoading = isGraphLoading || graphNodes.length === 0

  const laidOutNodes = useMemo(
    () => layoutGraphNodes(graphNodes),
    [graphNodes],
  )

  const viewBox = useMemo(() => graphViewBox(laidOutNodes), [laidOutNodes])

  const isDenseGraph = laidOutNodes.length > DENSE_GRAPH_NODE_THRESHOLD

  const graphSubtitle = isLoading
    ? 'Loading graph…'
    : `${graphNodes.length} nodes · ${graphEdges.length} edges · Updated just now`

  /** Legend counts reflect the active filter, not the full graph totals. */
  const typeCounts = useMemo(
    () =>
      Object.keys(TYPE_LABELS).reduce((counts, type) => {
        if (filterType === 'all') {
          counts[type] = laidOutNodes.filter((node) => node.type === type).length
        } else {
          counts[type] =
            type === filterType
              ? laidOutNodes.filter((node) => node.type === type).length
              : 0
        }
        return counts
      }, {}),
    [laidOutNodes, filterType],
  )

  const filterButtons = (
    <div className="flex" style={{ gap: 8 }}>
      {FILTERS.map(({ label, value }) => {
        const isActive = filterType === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setFilterType(value)}
            style={{
              fontSize: 12,
              padding: '5px 12px',
              borderRadius: 6,
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
              background: isActive ? 'var(--surface)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  return (
    <DashboardShell
      title="Knowledge Graph"
      subtitle={graphSubtitle}
      actions={filterButtons}
      contentPadding={0}
      contentOverflow="hidden"
    >
      <div className="flex overflow-hidden" style={{ height: '100%' }}>
        {/* SVG canvas */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          {!isLoading && isDenseGraph && !selectedNode && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 2,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                boxShadow: 'var(--shadow-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
              }}
            >
              Click a node for labels · weak edges hidden
            </div>
          )}
          <svg
            width="100%"
            height="100%"
            viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block', background: 'var(--bg)' }}
          >
            <defs>
              <pattern
                id={gridPatternId}
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>

            <rect
              x={viewBox.minX}
              y={viewBox.minY}
              width={viewBox.width}
              height={viewBox.height}
              fill={`url(#${gridPatternId})`}
            />

            {!isLoading &&
              graphEdges.map((edge, index) => {
                const fromNode = laidOutNodes.find((node) => node.id === edge.from)
                const toNode = laidOutNodes.find((node) => node.id === edge.to)
                if (!fromNode || !toNode) return null

                const bothVisible =
                  filterType === 'all' ||
                  (fromNode.type === filterType && toNode.type === filterType)

                const edgeWeight = edge.weight ?? 1
                const isWeak = edgeWeight < 1.5 || edge.dashed
                const touchesSelection =
                  selectedNode &&
                  (edge.from === selectedNode.id || edge.to === selectedNode.id)

                const hideWeak =
                  isDenseGraph && isWeak && !touchesSelection && filterType === 'all'

                if (hideWeak) return null

                return (
                  <line
                    key={`${edge.from}-${edge.to}-${index}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={bothVisible ? 'var(--border)' : 'transparent'}
                    strokeWidth={edgeWeight >= 1.5 ? 1.5 : 1}
                    strokeDasharray={isWeak ? '4,4' : 'none'}
                    style={{
                      transition: 'stroke 0.3s ease, stroke-opacity 0.3s ease',
                      opacity: bothVisible ? (isWeak && isDenseGraph ? 0.45 : 1) : 0,
                    }}
                  />
                )
              })}

            {!isLoading &&
              laidOutNodes.map((node, index) => {
                const isVisible = filterType === 'all' || node.type === filterType
                const isSelected = selectedNode?.id === node.id
                const showLabels =
                  isSelected || (!isDenseGraph && (node.r ?? 12) >= 16)

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    style={{
                      cursor: 'pointer',
                      opacity: isVisible ? 1 : 0.08,
                      transition: 'opacity 0.3s',
                      animation: `nodeAppear 0.4s ease ${Math.min(index * 0.02, 0.4)}s both`,
                    }}
                  >
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.r + 10}
                        fill={node.color}
                        opacity="0.12"
                      />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 5}
                      fill={node.color}
                      opacity="0.08"
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r}
                      fill="var(--surface)"
                      stroke={node.color}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                    {showLabels && (
                      <text
                        x={node.x}
                        y={node.y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: node.r > 15 ? 8 : 7,
                          fontFamily: 'var(--font-mono)',
                          fill: node.color,
                          pointerEvents: 'none',
                          fontWeight: 500,
                        }}
                      >
                        {nodeDisplayLabel(node)}
                      </text>
                    )}
                    {isSelected && node.sublabel && (
                      <text
                        x={node.x}
                        y={node.y + node.r + 11}
                        textAnchor="middle"
                        style={{
                          fontSize: 7,
                          fontFamily: 'var(--font-mono)',
                          fill: 'var(--text-tertiary)',
                          pointerEvents: 'none',
                        }}
                      >
                        {String(node.sublabel).slice(0, 28)}
                      </text>
                    )}
                  </g>
                )
              })}

            {isLoading &&
              LOADING_PLACEHOLDERS.map((placeholder, index) => (
                <circle
                  key={index}
                  cx={placeholder.cx}
                  cy={placeholder.cy}
                  r={placeholder.r}
                  fill="var(--bg-tertiary)"
                  stroke="var(--border)"
                  strokeWidth="1"
                  style={{ animation: 'pulse-dot 1.5s ease-in-out infinite' }}
                />
              ))}
          </svg>

          {/* Legend */}
          {!isLoading && (
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <div
                  key={type}
                  className="flex items-center"
                  style={{ gap: 8, marginBottom: 6 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: TYPE_COLORS[type],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      marginLeft: 'auto',
                      paddingLeft: 8,
                    }}
                  >
                    {typeCounts[type] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <aside
          style={{
            width: selectedNode ? 300 : 0,
            transition: 'width 0.3s ease',
            borderLeft: selectedNode ? '1px solid var(--border)' : 'none',
            background: 'var(--surface)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {selectedNode && (
            <div
              style={{
                width: 300,
                padding: 24,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div className="flex items-start justify-between">
                <Badge variant={nodeBadgeVariant(selectedNode.type)} size="xs">
                  {TYPE_LABELS[selectedNode.type]}
                </Badge>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    padding: 4,
                  }}
                  aria-label="Close detail panel"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  marginTop: 12,
                }}
              >
                {selectedNode.label}
              </h3>

              {selectedNode.sublabel && (
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    marginTop: 2,
                  }}
                >
                  {selectedNode.sublabel}
                </p>
              )}

              {selectedNode.details && (
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    marginTop: 20,
                    paddingTop: 20,
                  }}
                >
                  {Object.entries(selectedNode.details).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between"
                      style={{
                        paddingTop: 10,
                        paddingBottom: 10,
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {key}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          textAlign: 'right',
                          maxWidth: 180,
                        }}
                      >
                        {formatDetailValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </DashboardShell>
  )
}
