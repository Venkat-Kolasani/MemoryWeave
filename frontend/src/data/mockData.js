/**
 * mockData.js
 *
 * Acme Corp demo scenario — all hardcoded data while backend is in development.
 * Narrative skew: A. Patel is overloaded (95% bus factor on Payment Service).
 *
 * Used by: api.js (Phase 1 mocks), page components (Phase 1)
 */

/** Knowledge graph nodes — 15 nodes for Acme Corp demo. */
export const MOCK_GRAPH_NODES = [
  { id: 'p1', x: 300, y: 200, r: 26, type: 'person', label: 'A. Patel', sublabel: 'Eng Lead', color: 'oklch(50% 0.12 240)', details: { role: 'Engineering Lead', systems: ['Payment API', 'Billing'], incidents: 8, risk: 95 } },
  { id: 'p2', x: 500, y: 140, r: 22, type: 'person', label: 'R. Chen', sublabel: 'Backend Eng', color: 'oklch(50% 0.12 240)', details: { role: 'Backend Engineer', systems: ['Auth Service', 'Data Bus'], incidents: 5, risk: 78 } },
  { id: 'p3', x: 180, y: 340, r: 20, type: 'person', label: 'M. Kim', sublabel: 'Data Eng', color: 'oklch(50% 0.12 240)', details: { role: 'Data Engineer', systems: ['Data Bus', 'Analytics'], incidents: 3, risk: 64 } },
  { id: 'p4', x: 650, y: 280, r: 18, type: 'person', label: 'T. Walsh', sublabel: 'DevOps', color: 'oklch(50% 0.12 240)', details: { role: 'DevOps Engineer', systems: ['Deploy System'], incidents: 2, risk: 41 } },
  { id: 'p5', x: 400, y: 380, r: 16, type: 'person', label: 'J. Brooks', sublabel: 'SRE', color: 'oklch(50% 0.12 240)', details: { role: 'Site Reliability', systems: ['Monitoring'], incidents: 6, risk: 55 } },
  { id: 's1', x: 480, y: 260, r: 22, type: 'system', label: 'Payment API', color: 'oklch(52% 0.14 160)', details: { type: 'Service', dependencies: 4, owners: ['A. Patel'], status: 'Production' } },
  { id: 's2', x: 620, y: 180, r: 18, type: 'system', label: 'Auth Service', color: 'oklch(52% 0.14 160)', details: { type: 'Service', dependencies: 6, owners: ['R. Chen'], status: 'Production' } },
  { id: 's3', x: 260, y: 420, r: 16, type: 'system', label: 'Data Bus', color: 'oklch(52% 0.14 160)', details: { type: 'Infrastructure', dependencies: 3, owners: ['M. Kim', 'R. Chen'], status: 'Production' } },
  { id: 's4', x: 700, y: 360, r: 14, type: 'system', label: 'Deploy System', color: 'oklch(52% 0.14 160)', details: { type: 'Infrastructure', dependencies: 2, owners: ['T. Walsh'], status: 'Production' } },
  { id: 's5', x: 160, y: 200, r: 14, type: 'system', label: 'Analytics', color: 'oklch(52% 0.14 160)', details: { type: 'Service', dependencies: 1, owners: ['M. Kim'], status: 'Beta' } },
  { id: 'i1', x: 390, y: 280, r: 16, type: 'incident', label: 'P-4021', sublabel: 'Outage', color: 'oklch(50% 0.16 25)', details: { title: 'Payment Gateway Outage', date: 'Apr 14', severity: 'P0', duration: '47 min', resolver: 'A. Patel' } },
  { id: 'i2', x: 580, y: 330, r: 12, type: 'incident', label: 'P-3882', sublabel: 'Auth fail', color: 'oklch(50% 0.16 25)', details: { title: 'Auth Token Validation Fail', date: 'Mar 28', severity: 'P1', duration: '22 min', resolver: 'R. Chen' } },
  { id: 'w1', x: 200, y: 130, r: 14, type: 'workflow', label: 'Deploy Flow', color: 'oklch(60% 0.14 65)', details: { steps: 7, documented: false, lastRun: '2d ago', owner: 'T. Walsh' } },
  { id: 'w2', x: 340, y: 460, r: 12, type: 'workflow', label: 'Rollback', color: 'oklch(60% 0.14 65)', details: { steps: 4, documented: true, lastRun: '1w ago', owner: 'A. Patel' } },
  { id: 'w3', x: 100, y: 300, r: 11, type: 'workflow', label: 'Incident Resp', color: 'oklch(60% 0.14 65)', details: { steps: 9, documented: false, lastRun: '3d ago', owner: 'J. Brooks' } },
]

/** @type {{ from: string, to: string, weight: number }[]} */
export const MOCK_GRAPH_EDGES = [
  { from: 'p1', to: 's1', weight: 2 },
  { from: 'p1', to: 'i1', weight: 1.5 },
  { from: 'p1', to: 'w2', weight: 1 },
  { from: 'p1', to: 'p2', weight: 1 },
  { from: 'p2', to: 's2', weight: 2 },
  { from: 'p2', to: 'i2', weight: 1.5 },
  { from: 'p2', to: 's3', weight: 1 },
  { from: 'p3', to: 's3', weight: 2 },
  { from: 'p3', to: 's5', weight: 1.5 },
  { from: 'p4', to: 's4', weight: 2 },
  { from: 'p4', to: 'w1', weight: 1.5 },
  { from: 'p5', to: 'i1', weight: 1 },
  { from: 'p5', to: 'i2', weight: 1 },
  { from: 'p5', to: 'w3', weight: 1.5 },
  { from: 's1', to: 'i1', weight: 1 },
  { from: 's2', to: 'i2', weight: 1 },
  { from: 's1', to: 's2', weight: 1 },
  { from: 'w1', to: 's4', weight: 1 },
  { from: 'w2', to: 's1', weight: 1 },
  { from: 'w3', to: 'i1', weight: 1 },
  { from: 'p2', to: 'p5', weight: 1 },
]

export const MOCK_RISK_ITEMS = [
  { name: 'Payment Service', owner: 'A. Patel', score: 95, level: 'critical', systems: 4, undoc: true, note: 'Sole owner with no documented recovery procedures. Departure risk is imminent based on organizational signals.' },
  { name: 'Auth Pipeline', owner: 'R. Chen', score: 78, level: 'high', systems: 6, undoc: true, note: 'Token validation logic undocumented across 3 integration points. High complexity.' },
  { name: 'Data Ingestion', owner: 'M. Kim', score: 64, level: 'medium', systems: 3, undoc: false, note: 'Partial documentation exists. Some edge cases in ETL pipeline remain undocumented.' },
  { name: 'Deploy System', owner: 'T. Walsh', score: 41, level: 'low', systems: 2, undoc: false, note: 'Basic runbook exists. Deployment triggers and rollback procedure documented.' },
  { name: 'Analytics Pipeline', owner: 'M. Kim', score: 38, level: 'low', systems: 1, undoc: false, note: 'Well documented. Minor undocumented edge cases in data normalization.' },
]

export const MOCK_HEATMAP = [
  { label: 'Engineering', value: 82 },
  { label: 'Platform', value: 71 },
  { label: 'Infrastructure', value: 67 },
  { label: 'Security', value: 45 },
  { label: 'Data', value: 38 },
  { label: 'Product', value: 22 },
]

export const MOCK_BOTTLENECKS = [
  { label: 'A. Patel is the sole resolver for 8/12 P0 incidents', level: 'critical' },
  { label: 'Payment API has no secondary ownership', level: 'critical' },
  { label: '3 systems have zero documentation in 90 days', level: 'high' },
  { label: 'Deploy Flow undocumented for 6 months', level: 'high' },
]

export const MOCK_STATS = {
  nodes: 2847,
  undocumented: 134,
  risks: 3,
  queries: 48,
}

export const MOCK_SOURCES = [
  { name: 'Slack Workspace', icon: 'slack', status: 'active', nodes: 1240, lastSync: '4 min ago', channels: 48 },
  { name: 'GitHub Organization', icon: 'gitBranch', status: 'active', nodes: 630, lastSync: '12 min ago', channels: 23 },
  { name: 'Jira Project Board', icon: 'alert', status: 'active', nodes: 450, lastSync: '1 hr ago', channels: 8 },
  { name: 'Confluence Spaces', icon: 'file', status: 'syncing', nodes: 280, lastSync: 'Now', channels: 12 },
  { name: 'PagerDuty Incidents', icon: 'bell', status: 'active', nodes: 89, lastSync: '2 hr ago', channels: 5 },
  { name: 'Zoom Transcripts', icon: 'messageSquare', status: 'active', nodes: 120, lastSync: '6 hr ago', channels: 94 },
  { name: 'Linear Issues', icon: 'zap', status: 'inactive', nodes: 0, lastSync: 'Never', channels: 0 },
  { name: 'Notion Workspace', icon: 'layers', status: 'inactive', nodes: 0, lastSync: 'Never', channels: 0 },
]

export const MOCK_INITIAL_MESSAGES = [
  {
    role: 'assistant',
    type: 'welcome',
    content: "I have access to your organization's complete operational history — incidents, workflows, dependencies, and expertise maps. What would you like to know?",
  },
  {
    role: 'user',
    content: 'How do we recover payment service failures?',
  },
  {
    role: 'assistant',
    type: 'structured',
    content: 'Based on 12 historical P0/P1 incidents with the payment service, here is the documented recovery protocol:',
    steps: [
      'Check payment-api health endpoint at /internal/health and review error rate in Datadog',
      'Inspect Stripe webhook delivery dashboard for failed events — check for queue backlog',
      'If DB connection issues detected, restart payment-worker pods in Kubernetes',
      'Escalate to A. Patel (primary on-call) — available via Slack @patel or PagerDuty',
      'If A. Patel unavailable, escalate to R. Chen — familiar with billing integration layer',
    ],
    related: {
      systems: ['Payment API', 'Stripe Webhook Service', 'Postgres Billing DB'],
      people: ['A. Patel (primary)', 'R. Chen (backup)', 'J. Brooks (SRE)'],
      incidents: ['P-4021 (Apr 14)', 'P-3891 (Mar 2)', 'P-3722 (Jan 18)'],
      warnings: ['Sole owner risk: A. Patel has resolved 9 of 12 payment incidents'],
    },
  },
]

/** Default structured AI response template for mock sendQuery. */
export const MOCK_QUERY_RESPONSE = {
  type: 'structured',
  content: 'Based on 12 historical incidents involving the payment service, here is the documented recovery protocol:',
  steps: [
    'Check payment-api health endpoint at /internal/health and review error rate in Datadog',
    'Inspect Stripe webhook delivery dashboard for failed events — check for queue backlog',
    'If DB connection issues detected, restart payment-worker pods in Kubernetes',
    'Escalate to A. Patel (primary on-call) — available via Slack @patel or PagerDuty',
    'If A. Patel unavailable, escalate to R. Chen — familiar with billing integration layer',
  ],
  related: {
    systems: ['Payment API', 'Stripe Webhook Service', 'Postgres Billing DB'],
    people: ['A. Patel (primary)', 'R. Chen (backup)', 'J. Brooks (SRE)'],
    incidents: ['P-4021 (Apr 14)', 'P-3891 (Mar 2)', 'P-3722 (Jan 18)'],
    warnings: ['Sole owner risk: A. Patel has resolved 9 of 12 payment incidents'],
  },
}
