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
    useCoralQuery: false,

    // Dashboard & risk
    knowledgeStats: { ...MOCK_STATS },
    riskItems: [],
    riskHeatmap: [],
    riskBottlenecks: [],

    // Sources & ingestion
    sources: [],
    ingestionStatus: null,

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
        const useCoralQuery = get().useCoralQuery
        const response = useCoralQuery
          ? await api.sendCoralQuery(text)
          : await api.sendQuery(text)

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
              (useCoralQuery ? 'coral_sql_join' : 'hybrid_rag'),
            coral_sql: response.coral_sql || null,
            coral_rows: response.coral_rows ?? null,
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
