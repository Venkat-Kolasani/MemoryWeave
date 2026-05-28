/**
 * api.js
 *
 * All backend API calls. Single source of truth for HTTP communication.
 * Functions match the shapes expected by Zustand store actions.
 *
 * Used by: appStore.js async actions
 */

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

let backendWarmStarted = false

/** True when API base is local dev — skip Render wake pings. */
function isLocalApiBase() {
  return /localhost|127\.0\.0\.1/.test(BASE)
}

/**
 * Fire-and-forget pings to wake Render free tier before dashboard API calls.
 * Safe to call multiple times; only the first invocation sends requests.
 */
export function warmBackend() {
  if (backendWarmStarted || isLocalApiBase()) return
  backendWarmStarted = true

  const ping = (path) => {
    fetch(`${BASE}${path}`, { method: 'GET', mode: 'cors', keepalive: true }).catch(
      () => {},
    )
  }

  ping('/')
  ping('/health')

  // Second wave during typical cold-start window while user reads landing page
  window.setTimeout(() => {
    ping('/')
    ping('/health')
  }, 8000)
}

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
 * Maps Coral or legacy query JSON to AssistantPage message shape.
 * @param {object} data
 * @returns {{ type: string, content: string, steps?: string[], related?: object, sources?: unknown, coral_sql?: string, coral_rows?: number, retrieval_method?: string }}
 */
function mapQueryResponse(data) {
  const steps = data.steps ?? null
  return {
    type: steps && steps.length > 0 ? 'structured' : 'text',
    content: data.answer || data.content || '',
    steps: steps || undefined,
    related: data.related,
    sources: data.sources,
    coral_sql: data.coral_sql,
    coral_rows: data.coral_rows,
    retrieval_method: data.retrieval_method,
  }
}

/**
 * Primary Assistant path: Coral SQL JOIN, then legacy RAG if Coral is unavailable.
 * @param {string} question
 */
export async function sendAssistantQuery(question) {
  try {
    return await sendCoralQuery(question)
  } catch (coralErr) {
    console.warn('[api] Coral unavailable, using /query fallback:', coralErr)
    return sendQuery(question)
  }
}

/**
 * Legacy retrieval: Chroma + Neo4j + Fireworks (`POST /query`).
 * @param {string} question
 */
export async function sendQuery(question) {
  const res = await fetch(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error(`/query failed: ${res.status}`)
  return mapQueryResponse(await res.json())
}

/**
 * Coral SQL cross-source JOIN + Fireworks (`POST /coral-query`).
 * @param {string} question
 * @returns {Promise<{ answer: string, steps?: string[], related?: object, sources?: unknown, coral_sql?: string, coral_rows?: number, retrieval_method?: string }>}
 */
export async function sendCoralQuery(question) {
  const res = await fetch(`${BASE}/coral-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error(`/coral-query failed: ${res.status}`)
  return mapQueryResponse(await res.json())
}

export async function fetchCoralSchema() {
  const res = await fetch(`${BASE}/coral-schema`)
  if (!res.ok) throw new Error(`/coral-schema failed: ${res.status}`)
  return res.json()
}

export async function fetchCoralReport() {
  const res = await fetch(`${BASE}/coral-report`)
  if (!res.ok) throw new Error(`/coral-report failed: ${res.status}`)
  return res.json()
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
