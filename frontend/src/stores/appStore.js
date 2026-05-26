/**
 * appStore.js
 *
 * Single Zustand store for MemoryWeave global state (graph, assistant, data).
 * Routing is handled by react-router-dom — not stored here.
 *
 * Used by: page and layout components
 */

import { create } from 'zustand'

const useAppStore = create(() => ({
  // Graph, assistant, ingestion, and risk slices added in subsequent phases
}))

export default useAppStore
