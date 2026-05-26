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
import { MOCK_INITIAL_MESSAGES } from '../data/mockData.js'

/** @typedef {'all' | 'person' | 'system' | 'incident' | 'workflow'} FilterType */
/** @typedef {null | 'processing' | 'complete' | 'error'} IngestionStatus */

/**
 * @typedef {Object} GraphNode
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} r
 * @property {string} type
 * @property {string} label
 * @property {string} [sublabel]
 * @property {string} color
 * @property {Record<string, unknown>} [details]
 */

/**
 * @typedef {Object} GraphEdge
 * @property {string} from
 * @property {string} to
 * @property {number} weight
 */

const useAppStore = create(
  immer((set) => ({
    // Graph
    selectedNode: null,
    filterType: 'all',
    graphNodes: [],
    graphEdges: [],

    // Assistant
    messages: [...MOCK_INITIAL_MESSAGES],
    isLoading: false,

    // Dashboard & risk
    knowledgeStats: { nodes: 2847, undocumented: 134, risks: 3, queries: 48 },
    riskItems: [],

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

    // ─── Async actions ─────────────────────────────────────────────────────

    fetchGraph: async () => {
      try {
        const data = await api.fetchGraph()
        set((state) => {
          state.graphNodes = data.nodes
          state.graphEdges = data.edges
        })
      } catch (err) {
        console.error('fetchGraph failed:', err)
      }
    },

    fetchRiskReport: async () => {
      try {
        const data = await api.fetchRiskReport()
        set((state) => {
          state.riskItems = data.risks
        })
      } catch (err) {
        console.error('fetchRiskReport failed:', err)
      }
    },

    fetchStats: async () => {
      try {
        const stats = await api.fetchStats()
        set((state) => {
          state.knowledgeStats = stats
        })
      } catch (err) {
        console.error('fetchStats failed:', err)
      }
    },

    sendMessage: async (text) => {
      if (!text.trim()) return

      set((state) => {
        state.messages.push({ role: 'user', content: text })
        state.isLoading = true
      })

      try {
        const response = await api.sendQuery(text)
        set((state) => {
          state.messages.push({ role: 'assistant', ...response })
          state.isLoading = false
        })
      } catch (err) {
        console.error('sendMessage failed:', err)
        set((state) => {
          state.isLoading = false
        })
      }
    },
  })),
)

export default useAppStore
