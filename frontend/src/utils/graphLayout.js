/**
 * graphLayout.js
 *
 * Client-side knowledge graph layout — spreads nodes by type with minimum spacing
 * so dense Neo4j graphs (40+ nodes) do not overlap in the fixed 720×400 seed box.
 *
 * Used by: GraphPage.jsx
 */

const ROW_Y = {
  person: 100,
  system: 280,
  incident: 460,
  workflow: 620,
}

const MIN_GAP = 88
const H_PADDING = 100

/**
 * Recomputes x/y for all nodes in type rows with collision-safe spacing.
 * Preserves node data; overrides backend coordinates when graph is crowded.
 * @param {Array<{ id: string, type: string, r?: number, [key: string]: unknown }>} nodes
 * @returns {typeof nodes}
 */
export function layoutGraphNodes(nodes) {
  if (!nodes?.length) return []

  const byType = { person: [], system: [], incident: [], workflow: [] }
  for (const node of nodes) {
    const bucket = byType[node.type]
    if (bucket) bucket.push(node)
    else byType.system.push(node)
  }

  for (const key of Object.keys(byType)) {
    byType[key].sort((a, b) =>
      String(a.label || a.id).localeCompare(String(b.label || b.id)),
    )
  }

  const laidOut = []

  for (const [type, list] of Object.entries(byType)) {
    if (!list.length) continue

    const rowY = ROW_Y[type] ?? 320
    const span = list.length <= 1 ? 0 : (list.length - 1) * MIN_GAP
    const rowWidth = Math.max(520, span + H_PADDING * 2)

    list.forEach((node, index) => {
      const x =
        list.length <= 1
          ? rowWidth / 2
          : H_PADDING + index * MIN_GAP

      laidOut.push({
        ...node,
        x: Math.round(x),
        y: rowY,
      })
    })
  }

  return laidOut
}

/**
 * Bounding box for SVG viewBox (includes label margin below nodes).
 * @param {Array<{ x: number, y: number, r?: number }>} nodes
 */
export function graphViewBox(nodes) {
  if (!nodes.length) {
    return { minX: 0, minY: 0, width: 720, height: 400 }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const node of nodes) {
    const pad = (node.r || 12) + 28
    minX = Math.min(minX, node.x - pad)
    maxX = Math.max(maxX, node.x + pad)
    minY = Math.min(minY, node.y - pad)
    maxY = Math.max(maxY, node.y + pad)
  }

  const width = maxX - minX
  const height = maxY - minY

  return {
    minX: minX - 24,
    minY: minY - 24,
    width: Math.max(width + 48, 720),
    height: Math.max(height + 48, 400),
  }
}

/**
 * Short label for inside node circle — avoids long ingest strings overlapping.
 * @param {{ type: string, label?: string, id?: string }} node
 */
export function nodeDisplayLabel(node) {
  const label = String(node.label || node.id || '').trim()
  if (!label) return '?'

  if (node.type === 'person') {
    const match = label.match(/^([A-Za-z])\.?\s*/)
    if (match) return `${match[1]}.`
    return label.slice(0, 2)
  }

  if (label.length <= 9) return label

  const first = label.split(/[\s_-]+/)[0]
  if (first.length <= 9) return first
  return `${first.slice(0, 7)}…`
}
