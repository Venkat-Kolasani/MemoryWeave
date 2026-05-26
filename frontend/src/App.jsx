/**
 * App.jsx
 *
 * Root router — defines all MemoryWeave routes via react-router-dom.
 * Navigation is URL-based; use useNavigate() for programmatic navigation.
 *
 * Used by: main.jsx
 * Depends on: page components
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import GraphPage from './pages/GraphPage.jsx'
import WorkflowsPage from './pages/WorkflowsPage.jsx'
import RiskPage from './pages/RiskPage.jsx'
import AssistantPage from './pages/AssistantPage.jsx'
import SourcesPage from './pages/SourcesPage.jsx'

/**
 * Application route table — 7 pages, landing at `/`.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<OverviewPage />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="/workflows" element={<WorkflowsPage />} />
      <Route path="/risk" element={<RiskPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/sources" element={<SourcesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
