/**
 * appStore.js
 *
 * Single Zustand store for MemoryWeave global state (navigation, graph, assistant, data).
 *
 * Used by: App.jsx and all page/layout components
 */

import { create } from 'zustand'

const useAppStore = create((set) => ({
  // Navigation
  currentPage: 'landing',
  setCurrentPage: (page) => set({ currentPage: page }),
}))

export default useAppStore
