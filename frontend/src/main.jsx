/**
 * main.jsx
 *
 * React 18 entry point — mounts the MemoryWeave SPA into #root.
 *
 * Depends on: App.jsx, index.css, react-router-dom
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { warmBackend } from './services/api.js'
import './index.css'

warmBackend()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
