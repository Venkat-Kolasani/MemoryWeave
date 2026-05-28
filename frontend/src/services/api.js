/**
 * api.js
 *
 * All backend API calls. Single source of truth for HTTP communication.
 * Functions match the shapes expected by Zustand store actions.
 *
 * Used by: appStore.js async actions
 */

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/**
 * Fetches the full knowledge graph for visualization.
 * @returns {Promise<{ nodes: import('../data/mockData.js').MOCK_GRAPH_NODES, edges: import('../data/mockData.js').MOCK_GRAPH_EDGES }>}
 */
export async function fetchGraph() {
  const res = await fetch(`${BASE}/graph`)
  if (!res.ok) throw new Error(`/graph failed: ${res.status}`)
  return res.json()
}

/**
 * Fetches bus-factor risk report with heatmap and bottlenecks.
 * @returns {Promise<{ risks: unknown[], heatmap: unknown[], bottlenecks: unknown[] }>}
 */
export async function fetchRiskReport() {
  const res = await fetch(`${BASE}/risk-report`)
  if (!res.ok) throw new Error(`/risk-report failed: ${res.status}`)
  return res.json()
}

/**
 * Fetches dashboard stat numbers.
 * @returns {Promise<{ nodes: number, undocumented: number, risks: number, queries: number }>}
 */
export async function fetchStats() {
  const res = await fetch(`${BASE}/stats`)
  if (!res.ok) throw new Error(`/stats failed: ${res.status}`)
  return res.json()
}

/**
 * Sends a natural-language query to the AI assistant.
 * Maps backend `answer` field to frontend `content` for AssistantPage.
 * @param {string} question
 * @returns {Promise<{ type: string, content: string, steps?: string[], related?: object, sources?: object[] }>}
 */
export async function sendQuery(question) {
  const res = await fetch(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error(`/query failed: ${res.status}`)

  const data = await res.json()
  const steps = data.steps ?? null

  return {
    type: steps && steps.length > 0 ? 'structured' : 'text',
    content: data.answer || data.content || '',
    steps: steps || undefined,
    related: data.related,
    sources: data.sources,
  }
}

/**
 * Uploads a file and triggers the ingestion pipeline.
 * @param {File} file
 * @returns {Promise<{ status: string, job_id: string, filename?: string, source_type?: string, message?: string }>}
 */
export async function ingestFile(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/ingest`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`/ingest failed: ${res.status}`)
  return res.json()
}

export { BASE }
