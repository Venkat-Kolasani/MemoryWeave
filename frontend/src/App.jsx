/**
 * App.jsx
 *
 * Root page switcher — renders the active view based on currentPage in Zustand.
 * No react-router; navigation updates currentPage via setCurrentPage.
 *
 * Used by: main.jsx
 * Depends on: appStore, page components
 */

import useAppStore from './stores/appStore.js'
import LandingPage from './pages/LandingPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import GraphPage from './pages/GraphPage.jsx'
import WorkflowsPage from './pages/WorkflowsPage.jsx'
import RiskPage from './pages/RiskPage.jsx'
import AssistantPage from './pages/AssistantPage.jsx'
import SourcesPage from './pages/SourcesPage.jsx'

/**
 * Renders the active page component based on Zustand currentPage state.
 */
export default function App() {
  const currentPage = useAppStore((s) => s.currentPage)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)

  switch (currentPage) {
    case 'landing':
      return <LandingPage setCurrentPage={setCurrentPage} />
    case 'dashboard':
      return <OverviewPage setCurrentPage={setCurrentPage} />
    case 'graph':
      return <GraphPage setCurrentPage={setCurrentPage} />
    case 'workflows':
      return <WorkflowsPage setCurrentPage={setCurrentPage} />
    case 'risk':
      return <RiskPage setCurrentPage={setCurrentPage} />
    case 'assistant':
      return <AssistantPage setCurrentPage={setCurrentPage} />
    case 'sources':
      return <SourcesPage setCurrentPage={setCurrentPage} />
    default:
      return <LandingPage setCurrentPage={setCurrentPage} />
  }
}
