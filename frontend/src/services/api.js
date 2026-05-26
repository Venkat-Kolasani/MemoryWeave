/**
 * api.js
 *
 * All backend API calls for MemoryWeave. Phase 1 returns mock data;
 * Phase 4 switches to real fetch — no component changes required.
 *
 * Used by: appStore.js async actions
 */

import {
  MOCK_GRAPH_NODES,
  MOCK_GRAPH_EDGES,
  MOCK_RISK_ITEMS,
  MOCK_HEATMAP,
  MOCK_BOTTLENECKS,
  MOCK_STATS,
  MOCK_QUERY_RESPONSE,
} from '../data/mockData.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/** Simulates network latency for mock responses. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetches the full knowledge graph for visualization.
 * @returns {Promise<{ nodes: typeof MOCK_GRAPH_NODES, edges: typeof MOCK_GRAPH_EDGES }>}
 */
export async function fetchGraph() {
  // MOCK: replace with real fetch calls in Phase 4
  // const res = await fetch(`${BASE}/graph`)
  // if (!res.ok) throw new Error('Failed to fetch graph')
  // return res.json()
  await delay(100)
  return { nodes: MOCK_GRAPH_NODES, edges: MOCK_GRAPH_EDGES }
}

/**
 * Fetches bus-factor risk report with heatmap and bottlenecks.
 * @returns {Promise<{ risks: typeof MOCK_RISK_ITEMS, heatmap: typeof MOCK_HEATMAP, bottlenecks: typeof MOCK_BOTTLENECKS }>}
 */
export async function fetchRiskReport() {
  // MOCK: replace with real fetch calls in Phase 4
  // const res = await fetch(`${BASE}/risk-report`)
  // if (!res.ok) throw new Error('Failed to fetch risk report')
  // return res.json()
  await delay(100)
  return {
    risks: MOCK_RISK_ITEMS,
    heatmap: MOCK_HEATMAP,
    bottlenecks: MOCK_BOTTLENECKS,
  }
}

/**
 * Fetches dashboard stat numbers.
 * @returns {Promise<typeof MOCK_STATS>}
 */
export async function fetchStats() {
  // MOCK: replace with real fetch calls in Phase 4
  // const res = await fetch(`${BASE}/stats`)
  // if (!res.ok) throw new Error('Failed to fetch stats')
  // return res.json()
  await delay(100)
  return MOCK_STATS
}

/**
 * Sends a natural-language query to the AI assistant.
 * @param {string} question
 * @returns {Promise<{ type: string, content: string, steps: string[], related: object }>}
 */
export async function sendQuery(question) {
  // MOCK: replace with real fetch calls in Phase 4
  // const res = await fetch(`${BASE}/query`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ question }),
  // })
  // if (!res.ok) throw new Error('Failed to send query')
  // return res.json()
  await delay(1500)
  return {
    ...MOCK_QUERY_RESPONSE,
    content: `Based on your organization's operational data, here is what I found regarding "${question}":`,
  }
}

/**
 * Uploads a file and triggers the ingestion pipeline.
 * @param {File} file
 * @returns {Promise<{ status: string, job_id: string }>}
 */
export async function ingestFile(file) {
  // MOCK: replace with real fetch calls in Phase 4
  // const res = await fetch(`${BASE}/ingest`, { method: 'POST', body: formData })
  void file
  await delay(800)
  return { status: 'processing', job_id: 'demo-001' }
}

export { BASE }
