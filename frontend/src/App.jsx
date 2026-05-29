/**
 * App.jsx
 *
 * Root router — defines all MemoryWeave routes via react-router-dom.
 * Navigation is URL-based; use useNavigate() for programmatic navigation.
 *
 * Used by: main.jsx
 * Depends on: page components
 */

import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { boostBackendWarm, warmBackend } from './services/api.js'
import LandingPage from './pages/LandingPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import GraphPage from './pages/GraphPage.jsx'
import WorkflowsPage from './pages/WorkflowsPage.jsx'
import RiskPage from './pages/RiskPage.jsx'
import AssistantPage from './pages/AssistantPage.jsx'
import SourcesPage from './pages/SourcesPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

/**
 * Application route table — landing at `/`, dashboard pages under app routes.
 */
export default function App() {
  const location = useLocation()

  // Wake Render as soon as the SPA loads (production only).
  useEffect(() => {
    warmBackend()
  }, [])

  // Extra ping when leaving landing — user often opens dashboard next.
  useEffect(() => {
    if (location.pathname !== '/') {
      boostBackendWarm()
    }
  }, [location.pathname])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<OverviewPage />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="/workflows" element={<WorkflowsPage />} />
      <Route path="/risk" element={<RiskPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/sources" element={<SourcesPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
