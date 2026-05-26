/**
 * mockData.js
 *
 * Acme Corp demo scenario — 20-person SaaS startup with deliberate knowledge skew.
 * A. Patel: 95% bus factor on Payment Service, resolved 8 of 12 P0 incidents.
 * Demo narrative: "What breaks if Patel doesn't come in Monday?"
 *
 * Used by: api.js (Phase 1 mocks), page components (Phase 1)
 */

/** Node type colors — matches design token system in index.css */
const NODE_COLORS = {
  person: 'oklch(50% 0.12 240)',
  system: 'oklch(52% 0.14 160)',
  incident: 'oklch(50% 0.16 25)',
  workflow: 'oklch(60% 0.14 65)',
}

/** 15 knowledge graph nodes for the Acme Corp organizational map. */
export const MOCK_GRAPH_NODES = [
  // People
  {
    id: 'p1',
    x: 160,
    y: 140,
    r: 26,
    type: 'person',
    label: 'A. Patel',
    sublabel: 'Eng Lead',
    color: NODE_COLORS.person,
    details: {
      team: 'Engineering',
      role: 'Lead',
      systems: 'Payment API, Auth Service',
      incidents: '8 P0s resolved',
      risk: 'CRITICAL — 95% bus factor',
    },
  },
  {
    id: 'p2',
    x: 300,
    y: 230,
    r: 22,
    type: 'person',
    label: 'R. Chen',
    sublabel: 'Backend Eng',
    color: NODE_COLORS.person,
    details: {
      team: 'Engineering',
      role: 'Engineer',
      systems: 'Auth Service, Data Bus',
      incidents: '3 P1s resolved',
      risk: 'HIGH — 78% auth ownership',
    },
  },
  {
    id: 'p3',
    x: 480,
    y: 120,
    r: 20,
    type: 'person',
    label: 'M. Kim',
    sublabel: 'Data Eng',
    color: NODE_COLORS.person,
    details: {
      team: 'Data',
      role: 'Engineer',
      systems: 'Data Bus, Analytics',
      risk: 'MEDIUM',
    },
  },
  {
    id: 'p4',
    x: 580,
    y: 280,
    r: 18,
    type: 'person',
    label: 'T. Walsh',
    sublabel: 'DevOps',
    color: NODE_COLORS.person,
    details: {
      team: 'Infrastructure',
      role: 'Engineer',
      systems: 'Deploy System',
      risk: 'LOW',
    },
  },
  {
    id: 'p5',
    x: 100,
    y: 300,
    r: 16,
    type: 'person',
    label: 'J. Brooks',
    sublabel: 'SRE',
    color: NODE_COLORS.person,
    details: {
      team: 'Infrastructure',
      role: 'SRE',
      systems: 'Monitoring',
      risk: 'LOW',
    },
  },
  // Systems
  {
    id: 's1',
    x: 280,
    y: 110,
    r: 18,
    type: 'system',
    label: 'Payment API',
    sublabel: 'Production',
    color: NODE_COLORS.system,
    details: {
      criticality: 'P0',
      status: 'Healthy',
      owner: 'A. Patel (sole)',
      dependents: 4,
      documented: 'No',
      last_incident: 'Apr 14',
    },
  },
  {
    id: 's2',
    x: 420,
    y: 190,
    r: 16,
    type: 'system',
    label: 'Auth Service',
    sublabel: 'Production',
    color: NODE_COLORS.system,
    details: {
      criticality: 'P0',
      status: 'Healthy',
      owner: 'R. Chen',
      dependents: 6,
    },
  },
  {
    id: 's3',
    x: 560,
    y: 170,
    r: 14,
    type: 'system',
    label: 'Data Bus',
    sublabel: 'Infrastructure',
    color: NODE_COLORS.system,
    details: {
      criticality: 'P1',
      status: 'Healthy',
      owner: 'M. Kim + R. Chen',
      dependents: 3,
    },
  },
  {
    id: 's4',
    x: 620,
    y: 350,
    r: 13,
    type: 'system',
    label: 'Deploy System',
    sublabel: 'Infrastructure',
    color: NODE_COLORS.system,
    details: {
      criticality: 'P1',
      status: 'Healthy',
      owner: 'T. Walsh (sole)',
      documented: 'No',
    },
  },
  {
    id: 's5',
    x: 500,
    y: 340,
    r: 11,
    type: 'system',
    label: 'Analytics',
    sublabel: 'Beta',
    color: NODE_COLORS.system,
    details: {
      criticality: 'P2',
      status: 'Beta',
      owner: 'M. Kim',
    },
  },
  // Incidents
  {
    id: 'i1',
    x: 220,
    y: 240,
    r: 13,
    type: 'incident',
    label: 'P-4021',
    sublabel: '47min P0',
    color: NODE_COLORS.incident,
    details: {
      title: 'Payment Gateway Outage',
      date: 'Apr 14',
      severity: 'P0',
      duration: '47 min',
      resolved_by: 'A. Patel',
      systems: 'Payment API',
    },
  },
  {
    id: 'i2',
    x: 380,
    y: 290,
    r: 11,
    type: 'incident',
    label: 'P-3882',
    sublabel: '22min P1',
    color: NODE_COLORS.incident,
    details: {
      title: 'Auth Token Failure',
      date: 'Mar 28',
      severity: 'P1',
      duration: '22 min',
      resolved_by: 'R. Chen',
    },
  },
  // Workflows
  {
    id: 'w1',
    x: 140,
    y: 220,
    r: 14,
    type: 'workflow',
    label: 'Deploy Flow',
    sublabel: 'Undocumented',
    color: NODE_COLORS.workflow,
    details: {
      owner: 'T. Walsh',
      documented: 'No',
      steps: 'Unknown',
      frequency: 'Daily',
    },
  },
  {
    id: 'w2',
    x: 350,
    y: 170,
    r: 12,
    type: 'workflow',
    label: 'Rollback Proc',
    sublabel: 'Partial docs',
    color: NODE_COLORS.workflow,
    details: {
      owner: 'A. Patel',
      documented: 'Partial',
      steps: 5,
      frequency: 'Weekly',
    },
  },
  {
    id: 'w3',
    x: 460,
    y: 270,
    r: 11,
    type: 'workflow',
    label: 'Incident Resp',
    sublabel: 'Documented',
    color: NODE_COLORS.workflow,
    details: {
      owner: 'J. Brooks',
      documented: 'Yes',
      steps: 8,
      frequency: 'On-demand',
    },
  },
]

/** 21 graph edges — weight >= 1.5 is solid; dashed flag overrides for weak deps. */
export const MOCK_GRAPH_EDGES = [
  { from: 'p1', to: 's1', weight: 2.0 },
  { from: 'p1', to: 'i1', weight: 1.8 },
  { from: 'p1', to: 'w2', weight: 1.5 },
  { from: 'p2', to: 's2', weight: 1.8 },
  { from: 'p2', to: 'i2', weight: 1.5 },
  { from: 'p3', to: 's3', weight: 1.5 },
  { from: 'p4', to: 's4', weight: 1.8 },
  { from: 'p4', to: 'w1', weight: 1.5 },
  { from: 'p5', to: 'w3', weight: 1.2 },
  { from: 's1', to: 's2', weight: 1.2, dashed: true },
  { from: 's2', to: 's3', weight: 1.0, dashed: true },
  { from: 's3', to: 's5', weight: 1.0, dashed: true },
  { from: 'i1', to: 's1', weight: 1.5 },
  { from: 'i2', to: 's2', weight: 1.2 },
  { from: 'w1', to: 's4', weight: 1.5 },
  { from: 'w2', to: 's1', weight: 1.2, dashed: true },
  { from: 'w3', to: 's2', weight: 1.0, dashed: true },
  { from: 'p1', to: 'p2', weight: 1.0, dashed: true },
  { from: 'p3', to: 'p2', weight: 0.8, dashed: true },
  { from: 's4', to: 's1', weight: 1.2, dashed: true },
  { from: 'p5', to: 'i1', weight: 0.8, dashed: true },
]

/** Bus-factor risk inventory — Patel skew drives the demo narrative. */
export const MOCK_RISK_ITEMS = [
  {
    id: 'r1',
    name: 'Payment Service',
    owner: 'A. Patel',
    score: 95,
    level: 'critical',
    systems: 4,
    undoc: true,
    note: 'Sole resolver of 8/12 P0 incidents',
  },
  {
    id: 'r2',
    name: 'Auth Pipeline',
    owner: 'R. Chen',
    score: 78,
    level: 'high',
    systems: 6,
    undoc: true,
    note: 'Single team dependency, no backup owner',
  },
  {
    id: 'r3',
    name: 'Data Ingestion',
    owner: 'M. Kim',
    score: 64,
    level: 'medium',
    systems: 3,
    undoc: false,
    note: 'Moderate concentration, documented',
  },
  {
    id: 'r4',
    name: 'Deploy System',
    owner: 'T. Walsh',
    score: 41,
    level: 'low',
    systems: 2,
    undoc: false,
    note: 'Runbook exists, low incident rate',
  },
  {
    id: 'r5',
    name: 'Analytics',
    owner: 'M. Kim',
    score: 38,
    level: 'low',
    systems: 1,
    undoc: false,
    note: 'Beta system, low operational impact',
  },
]

export const MOCK_STATS = {
  nodes: 2847,
  undocumented: 134,
  risks: 3,
  queries: 48,
}

export const MOCK_HEATMAP = [
  { label: 'Engineering', value: 82 },
  { label: 'Platform', value: 71 },
  { label: 'Infrastructure', value: 67 },
  { label: 'Security', value: 45 },
  { label: 'Data', value: 38 },
  { label: 'Product', value: 22 },
]

export const MOCK_BOTTLENECKS = [
  { label: 'A. Patel resolves 85% of payment incidents — sole critical path', level: 'critical' },
  { label: 'Payment API has no documented recovery procedure', level: 'critical' },
  { label: 'Deploy System runbook has 3 undocumented steps known only to T. Walsh', level: 'high' },
  { label: 'Auth Service backup owner has never run an incident independently', level: 'high' },
]

export const MOCK_SOURCES = [
  { id: 'src1', name: 'Slack', icon: 'slack', status: 'active', nodes: 1240, lastSync: '4 min ago', channels: 12 },
  { id: 'src2', name: 'GitHub', icon: 'gitBranch', status: 'active', nodes: 630, lastSync: '12 min ago', channels: 8 },
  { id: 'src3', name: 'Jira', icon: 'grid', status: 'active', nodes: 450, lastSync: '1 hr ago', channels: 3 },
  { id: 'src4', name: 'Confluence', icon: 'file', status: 'syncing', nodes: 280, lastSync: 'Syncing...', channels: 5 },
  { id: 'src5', name: 'PagerDuty', icon: 'alert', status: 'active', nodes: 89, lastSync: '6 min ago', channels: 1 },
  { id: 'src6', name: 'Zoom Meetings', icon: 'messageSquare', status: 'active', nodes: 120, lastSync: '2 hr ago', channels: 24 },
  { id: 'src7', name: 'Linear', icon: 'layers', status: 'inactive', nodes: 0, lastSync: 'Never', channels: 0 },
  { id: 'src8', name: 'Notion', icon: 'file', status: 'inactive', nodes: 0, lastSync: 'Never', channels: 0 },
]

/** Pre-loaded assistant chat — demonstrates structured recovery response. */
export const MOCK_INITIAL_MESSAGES = [
  {
    id: 'm0',
    role: 'assistant',
    type: 'text',
    content:
      "Hi! I'm your operational intelligence assistant, grounded in 2,847 knowledge nodes from your connected sources. Ask me about workflows, incidents, system dependencies, or who owns what.",
  },
  {
    id: 'm1',
    role: 'user',
    type: 'text',
    content: 'How do we recover payment service failures?',
  },
  {
    id: 'm2',
    role: 'assistant',
    type: 'structured',
    content:
      'Based on 12 historical incidents and internal runbooks, here is the standard payment service recovery procedure:',
    steps: [
      'Check payment-api health endpoint: GET /health on port 8080. Expected: { status: "ok" }',
      'Inspect Stripe webhook dashboard for failed events queued in the last 15 minutes',
      'Restart payment-worker pods via kubectl: kubectl rollout restart deploy/payment-worker -n prod',
      'Verify Redis connection pool — payment-api uses Redis for idempotency keys. Check REDIS_URL env var',
      'If pods fail to restart, escalate to A. Patel directly — sole holder of billing DB credentials',
    ],
    related: {
      systems: ['Payment API', 'Stripe Webhook Service', 'Redis Cache'],
      people: ['A. Patel (primary — 9/12 incidents)', 'R. Chen (backup — never resolved solo)'],
      incidents: ['P-4021 (Apr 14, 47min)', 'P-3722 (Mar 2, 31min)', 'P-3509 (Jan 19, 18min)'],
      warnings: [
        'CRITICAL: A. Patel has resolved 9 of 12 payment incidents. No documented backup owner exists.',
      ],
    },
  },
]

/** Default structured AI response template for mock sendQuery. */
export const MOCK_QUERY_RESPONSE = {
  type: 'structured',
  content:
    'Based on 12 historical incidents and internal runbooks, here is the standard payment service recovery procedure:',
  steps: [
    'Check payment-api health endpoint: GET /health on port 8080. Expected: { status: "ok" }',
    'Inspect Stripe webhook dashboard for failed events queued in the last 15 minutes',
    'Restart payment-worker pods via kubectl: kubectl rollout restart deploy/payment-worker -n prod',
    'Verify Redis connection pool — payment-api uses Redis for idempotency keys. Check REDIS_URL env var',
    'If pods fail to restart, escalate to A. Patel directly — sole holder of billing DB credentials',
  ],
  related: {
    systems: ['Payment API', 'Stripe Webhook Service', 'Redis Cache'],
    people: ['A. Patel (primary — 9/12 incidents)', 'R. Chen (backup — never resolved solo)'],
    incidents: ['P-4021 (Apr 14, 47min)', 'P-3722 (Mar 2, 31min)', 'P-3509 (Jan 19, 18min)'],
    warnings: [
      'CRITICAL: A. Patel has resolved 9 of 12 payment incidents. No documented backup owner exists.',
    ],
  },
}
