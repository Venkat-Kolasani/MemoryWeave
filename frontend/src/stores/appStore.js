/**
 * appStore.js
 *
 * Single Zustand store for MemoryWeave data state (graph, assistant, risk, ingestion).
 * Routing is handled by react-router-dom — not stored here.
 *
 * Used by: page and layout components
 * Depends on: services/api.js, data/mockData.js
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import * as api from '../services/api.js'
import {
  MOCK_INITIAL_MESSAGES,
  MOCK_STATS,
  MOCK_GRAPH_NODES,
  MOCK_GRAPH_EDGES,
} from '../data/mockData.js'

/** @typedef {'all' | 'person' | 'system' | 'incident' | 'workflow'} FilterType */
/** @typedef {null | 'processing' | 'complete' | 'error'} IngestionStatus */
/** @typedef {'idle' | 'loading' | 'ready' | 'error'} CoralFetchStatus */

/** Coral schema/report TTL — matches Settings “Cache TTL” display. */
export const CORAL_CACHE_TTL_MS = 5 * 60 * 1000

/** @param {number|null|undefined} fetchedAt */
function isCoralCacheFresh(fetchedAt) {
  return Boolean(fetchedAt && Date.now() - fetchedAt < CORAL_CACHE_TTL_MS)
}

const useAppStore = create(
  immer((set, get) => ({
    // Graph — seed with mocks so UI is never blank before/after failed fetch
    selectedNode: null,
    filterType: 'all',
    graphNodes: [],
    graphEdges: [],
    isGraphLoading: true,

    // Assistant
    messages: [...MOCK_INITIAL_MESSAGES],
    isLoading: false,
    /** Default true — Coral SQL is the primary retrieval path. */
    useCoralQuery: true,

    // Dashboard & risk
    knowledgeStats: { ...MOCK_STATS },
    riskItems: [],
    riskHeatmap: [],
    riskBottlenecks: [],

    // Sources & ingestion
    sources: [],
    ingestionStatus: null,

    // Coral (Settings / Reports / MCP) — cached across route changes
    coralSchema: null,
    coralSchemaStatus: 'idle',
    coralSchemaFetchedAt: null,
    coralSchemaError: null,

    coralReport: null,
    coralReportStatus: 'idle',
    coralReportFetchedAt: null,
    coralReportError: null,

    coralMcpConfig: null,
    coralMcpStatus: 'idle',
    coralMcpFetchedAt: null,

    // ─── Synchronous actions ───────────────────────────────────────────────

    setSelectedNode: (node) => {
      set((state) => {
        state.selectedNode = node
      })
    },

    setFilterType: (type) => {
      set((state) => {
        state.filterType = type
      })
    },

    addMessage: (msg) => {
      set((state) => {
        state.messages.push(msg)
      })
    },

    setLoading: (bool) => {
      set((state) => {
        state.isLoading = bool
      })
    },

    setIngestionStatus: (status) => {
      set((state) => {
        state.ingestionStatus = status
      })
    },

    /** Toggle Assistant retrieval: false = /query, true = /coral-query. */
    toggleCoralQuery: () => {
      set((state) => {
        state.useCoralQuery = !state.useCoralQuery
      })
    },

    // ─── Async actions ─────────────────────────────────────────────────────

    fetchGraph: async () => {
      set((state) => {
        state.isGraphLoading = true
      })
      try {
        const data = await api.fetchGraph()
        set((state) => {
          state.graphNodes = data.nodes
          state.graphEdges = data.edges
          state.isGraphLoading = false
        })
      } catch (err) {
        console.error('[store] fetchGraph failed:', err)
        set((state) => {
          state.graphNodes = [...MOCK_GRAPH_NODES]
          state.graphEdges = [...MOCK_GRAPH_EDGES]
          state.isGraphLoading = false
        })
      }
    },

    fetchRiskReport: async () => {
      try {
        const data = await api.fetchRiskReport()
        set((state) => {
          state.riskItems = data.risks
          state.riskHeatmap = data.heatmap
          state.riskBottlenecks = data.bottlenecks
        })
      } catch (err) {
        console.error('[store] fetchRiskReport failed:', err)
      }
    },

    fetchStats: async () => {
      try {
        const stats = await api.fetchStats()
        set((state) => {
          state.knowledgeStats = stats
        })
      } catch (err) {
        console.error('[store] fetchStats failed:', err)
      }
    },

    /**
     * Load /coral-schema with session cache (5 min). Revisit Settings without refetch spinners.
     * @param {{ force?: boolean }} [options]
     */
    fetchCoralSchema: async ({ force = false } = {}) => {
      const { coralSchema, coralSchemaFetchedAt } = get()
      if (!force && isCoralCacheFresh(coralSchemaFetchedAt) && coralSchema) {
        return coralSchema
      }

      const showLoading = !coralSchema
      if (showLoading) {
        set((state) => {
          state.coralSchemaStatus = 'loading'
        })
      }

      try {
        const data = await api.fetchCoralSchema()
        set((state) => {
          state.coralSchema = data
          state.coralSchemaStatus = 'ready'
          state.coralSchemaFetchedAt = Date.now()
          state.coralSchemaError = null
        })
        return data
      } catch (err) {
        console.error('[store] fetchCoralSchema failed:', err)
        set((state) => {
          state.coralSchemaStatus = 'error'
          state.coralSchemaError =
            err instanceof Error ? err.message : 'Failed to load schema'
          state.coralSchemaFetchedAt = Date.now()
          if (!state.coralSchema) {
            state.coralSchema = { available: false }
          }
        })
        return get().coralSchema
      }
    },

    /**
     * Load /coral-report with session cache. Reports page keeps data when navigating away.
     * @param {{ force?: boolean }} [options]
     */
    fetchCoralReport: async ({ force = false } = {}) => {
      const { coralReport, coralReportFetchedAt } = get()
      if (!force && isCoralCacheFresh(coralReportFetchedAt) && coralReport) {
        return coralReport
      }

      const showLoading = !coralReport
      if (showLoading) {
        set((state) => {
          state.coralReportStatus = 'loading'
        })
      }

      try {
        const data = await api.fetchCoralReport()
        set((state) => {
          state.coralReport = data
          state.coralReportStatus = 'ready'
          state.coralReportFetchedAt = Date.now()
          state.coralReportError = null
        })
        return data
      } catch (err) {
        console.error('[store] fetchCoralReport failed:', err)
        set((state) => {
          state.coralReportStatus = 'error'
          state.coralReportError =
            err instanceof Error ? err.message : 'Failed to load report'
          state.coralReportFetchedAt = Date.now()
        })
        throw err
      }
    },

    /** Load /coral-mcp-config once per session (Settings MCP block). */
    fetchCoralMcpConfig: async ({ force = false } = {}) => {
      const { coralMcpConfig, coralMcpFetchedAt } = get()
      if (!force && isCoralCacheFresh(coralMcpFetchedAt) && coralMcpConfig) {
        return coralMcpConfig
      }

      const showLoading = !coralMcpConfig
      if (showLoading) {
        set((state) => {
          state.coralMcpStatus = 'loading'
        })
      }

      try {
        const data = await api.fetchCoralMcpConfig()
        set((state) => {
          state.coralMcpConfig = data
          state.coralMcpStatus = 'ready'
          state.coralMcpFetchedAt = Date.now()
        })
        return data
      } catch (err) {
        console.error('[store] fetchCoralMcpConfig failed:', err)
        const fallback = {
          available: false,
          cli_available: false,
          config: {
            mcpServers: {
              'memoryweave-coral': {
                command: 'coral',
                args: ['mcp', '--sources', 'backend/coral/sources.yaml'],
                description:
                  'MemoryWeave Coral SQL layer — query knowledge_nodes, knowledge_edges, incident_reports, slack_messages as SQL tables',
              },
            },
          },
          instructions:
            'Could not reach the API — using placeholder paths. Install Coral locally: brew install withcoral/tap/coral',
        }
        set((state) => {
          state.coralMcpConfig = fallback
          state.coralMcpStatus = 'ready'
          state.coralMcpFetchedAt = Date.now()
        })
        return fallback
      }
    },

    sendMessage: async (text) => {
      if (!text.trim()) return

      let shouldSend = false

      set((state) => {
        if (state.isLoading) return
        shouldSend = true
        state.messages.push({
          id: `u-${Date.now()}`,
          role: 'user',
          type: 'text',
          content: text.trim(),
        })
        state.isLoading = true
      })

      if (!shouldSend) return

      try {
        const preferCoral = get().useCoralQuery
        let response
        let usedCoral = false
        let fellBackToRag = false

        if (preferCoral) {
          try {
            response = await api.sendCoralQuery(text)
            usedCoral = true
          } catch (coralErr) {
            console.warn('[store] Coral query failed, falling back to /query:', coralErr)
            response = await api.sendQuery(text)
            fellBackToRag = true
          }
        } else {
          response = await api.sendQuery(text)
        }

        set((state) => {
          state.messages.push({
            id: `a-${Date.now()}`,
            role: 'assistant',
            type:
              response.type === 'structured' || response.steps
                ? 'structured'
                : response.type,
            content: response.content,
            steps: response.steps,
            related: response.related,
            sources: response.sources,
            retrieval_method:
              response.retrieval_method ||
              (usedCoral ? 'coral_sql_join' : 'hybrid_rag'),
            coral_sql: response.coral_sql || null,
            coral_rows: response.coral_rows ?? null,
            retrieval_fallback: fellBackToRag || undefined,
          })
          state.isLoading = false
        })
      } catch (err) {
        console.error('[store] sendMessage failed:', err)
        set((state) => {
          state.messages.push({
            id: `a-${Date.now()}`,
            role: 'assistant',
            type: 'text',
            content:
              'Sorry, I could not retrieve an answer. Please check the backend is running.',
          })
          state.isLoading = false
        })
      }
    },
  })),
)

export default useAppStore
