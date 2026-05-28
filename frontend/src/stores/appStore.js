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
  immer((set) => ({
    // Graph — seed with mocks so UI is never blank before/after failed fetch
    selectedNode: null,
    filterType: 'all',
    graphNodes: [...MOCK_GRAPH_NODES],
    graphEdges: [...MOCK_GRAPH_EDGES],

    // Assistant
    messages: [...MOCK_INITIAL_MESSAGES],
    isLoading: false,

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

    // ─── Async actions ─────────────────────────────────────────────────────

    fetchGraph: async () => {
      try {
        const data = await api.fetchGraph()
        set((state) => {
          state.graphNodes = data.nodes
          state.graphEdges = data.edges
        })
      } catch (err) {
        console.error('[store] fetchGraph failed:', err)
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
        const response = await api.sendQuery(text)
        set((state) => {
          state.messages.push({
            id: `a-${Date.now()}`,
            role: 'assistant',
            ...response,
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
