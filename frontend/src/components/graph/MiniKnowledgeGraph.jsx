/**
 * MiniKnowledgeGraph.jsx
 *
 * Static SVG knowledge graph preview. 9 nodes, lightweight.
 *
 * Used by: LandingPage (hero preview), OverviewPage (dashboard card)
 * Depends on: nothing
 */

import { useId } from 'react'

const NODES = [
  { id: 'n1', x: 120, y: 110, r: 18, type: 'person', label: 'A. Patel', color: 'oklch(50% 0.12 240)' },
  { id: 'n2', x: 230, y: 75, r: 14, type: 'system', label: 'Payment API', color: 'oklch(52% 0.14 160)' },
  { id: 'n3', x: 340, y: 120, r: 12, type: 'system', label: 'Auth Service', color: 'oklch(52% 0.14 160)' },
  { id: 'n4', x: 200, y: 170, r: 16, type: 'person', label: 'R. Chen', color: 'oklch(50% 0.12 240)' },
  { id: 'n5', x: 310, y: 185, r: 10, type: 'incident', label: 'P-4021', color: 'oklch(50% 0.16 25)' },
  { id: 'n6', x: 80, y: 175, r: 11, type: 'workflow', label: 'Deploy Flow', color: 'oklch(60% 0.14 65)' },
  { id: 'n7', x: 400, y: 70, r: 9, type: 'person', label: 'M. Kim', color: 'oklch(50% 0.12 240)' },
  { id: 'n8', x: 450, y: 150, r: 12, type: 'system', label: 'Data Bus', color: 'oklch(52% 0.14 160)' },
  { id: 'n9', x: 160, y: 210, r: 8, type: 'workflow', label: 'Rollback', color: 'oklch(60% 0.14 65)' },
]

const EDGES = [
  ['n1', 'n2'],
  ['n1', 'n4'],
  ['n2', 'n3'],
  ['n2', 'n5'],
  ['n4', 'n5'],
  ['n3', 'n7'],
  ['n3', 'n8'],
  ['n1', 'n6'],
  ['n4', 'n9'],
  ['n7', 'n8'],
  ['n6', 'n9'],
]

/** Resolves a node by id for edge rendering. */
function getNode(id) {
  return NODES.find((node) => node.id === id)
}

/** Lightweight static knowledge graph SVG for previews. */
export default function MiniKnowledgeGraph() {
  const gradientId = useId()

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 520 250"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(98% 0.005 240)" />
          <stop offset="100%" stopColor="oklch(100% 0 0)" />
        </radialGradient>
      </defs>

      <rect width="520" height="250" fill={`url(#${gradientId})`} />

      {EDGES.map(([from, to], index) => {
        const a = getNode(from)
        const b = getNode(to)
        if (!a || !b) return null

        return (
          <line
            key={`${from}-${to}-${index}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )
      })}

      {NODES.map((node, index) => (
        <g
          key={node.id}
          style={{ animation: `nodeAppear 0.4s ease ${index * 0.06}s both` }}
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r + 4}
            fill={node.color}
            opacity="0.08"
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill="var(--surface)"
            stroke={node.color}
            strokeWidth="1.5"
          />
          <text
            x={node.x}
            y={node.y + node.r + 10}
            textAnchor="middle"
            fontSize="8"
            fill="var(--text-tertiary)"
            fontFamily="var(--font-mono)"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
