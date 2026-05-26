/**
 * main.jsx
 *
 * React 18 entry point — mounts the MemoryWeave SPA into #root.
 *
 * Depends on: App.jsx, index.css
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
