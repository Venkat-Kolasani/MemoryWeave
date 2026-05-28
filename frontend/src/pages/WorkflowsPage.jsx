/**
 * WorkflowsPage.jsx
 *
 * Operational workflow cards showing documentation status and risk.
 * Hardcoded for hackathon demo — no API call needed.
 *
 * Used by: App.jsx route /workflows
 * Depends on: DashboardShell, Badge, Button, Icon, StatCard
 */

import { useMemo, useState } from 'react'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import StatCard from '../components/atoms/StatCard.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'

/** Acme Corp demo workflows — aligns with graph/risk narrative (Patel, Walsh). */
const WORKFLOWS = [
  {
    id: 'w1',
    name: 'Payment Service Rollback',
    owner: 'A. Patel',
    team: 'Engineering',
    documented: false,
    steps: 5,
    lastRun: '2 days ago',
    frequency: 'Weekly',
    systems: ['Payment API', 'Redis Cache'],
    risk: 'critical',
    description:
      'Emergency rollback for payment service deployments. Steps 4 and 5 are undocumented and known only to A. Patel.',
  },
  {
    id: 'w2',
    name: 'Incident Response Protocol',
    owner: 'J. Brooks',
    team: 'Infrastructure',
    documented: true,
    steps: 8,
    lastRun: '5 days ago',
    frequency: 'On-demand',
    systems: ['PagerDuty', 'Slack'],
    risk: 'low',
    description:
      'Standard incident escalation and communication protocol. Fully documented with runbook.',
  },
  {
    id: 'w3',
    name: 'Deploy Pipeline',
    owner: 'T. Walsh',
    team: 'Infrastructure',
    documented: false,
    steps: null,
    lastRun: '1 day ago',
    frequency: 'Daily',
    systems: ['Deploy System', 'GitHub Actions'],
    risk: 'high',
    description:
      'Production deployment pipeline. Environment variable configuration is undocumented — only Walsh knows the trigger conditions.',
  },
]

/** Maps workflow risk level to Badge variant. */
function riskBadgeVariant(risk) {
  switch (risk) {
    case 'critical':
      return 'danger'
    case 'high':
      return 'warning'
    default:
      return 'success'
  }
}

/** Maps workflow risk level to display label. */
function riskBadgeLabel(risk) {
  return String(risk || 'low').toUpperCase()
}

/** Single meta row item with icon + DM Mono label. */
function WorkflowMetaItem({ icon, children }) {
  return (
    <span className="flex items-center" style={{ gap: 6 }}>
      <Icon name={icon} size={12} color="var(--text-tertiary)" strokeWidth={1.5} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
        }}
      >
        {children}
      </span>
    </span>
  )
}

/** One workflow card with documentation status, systems, and actions. */
function WorkflowCard({ workflow, delay = 0 }) {
  const [isHovered, setIsHovered] = useState(false)

  const stepsLabel =
    workflow.steps != null ? `${workflow.steps} steps` : 'Steps unknown'

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 24,
        boxShadow: isHovered ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
        transition: 'box-shadow 0.2s ease',
        animation: `fadeUp 0.4s ease ${delay}ms both`,
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 16 }}>
        <div>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {workflow.name}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              marginTop: 2,
              marginBottom: 0,
            }}
          >
            {workflow.owner} · {workflow.team}
          </p>
        </div>
        <Badge variant={riskBadgeVariant(workflow.risk)} size="sm">
          {riskBadgeLabel(workflow.risk)}
        </Badge>
      </div>

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginTop: 12,
          marginBottom: 16,
        }}
      >
        {workflow.description}
      </p>

      <div
        className="flex flex-wrap"
        style={{
          gap: 24,
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <WorkflowMetaItem icon="workflow">{stepsLabel}</WorkflowMetaItem>
        <WorkflowMetaItem icon="zap">{workflow.frequency}</WorkflowMetaItem>
        <WorkflowMetaItem icon="check">Last run: {workflow.lastRun}</WorkflowMetaItem>
      </div>

      <div className="flex flex-wrap items-center" style={{ gap: 8, marginTop: 16 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            marginRight: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Affects:
        </span>
        {workflow.systems.map((system) => (
          <Badge key={system} variant="default" size="xs">
            {system}
          </Badge>
        ))}
      </div>

      <div
        className="flex items-center justify-between"
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
        }}
      >
        <Badge variant={workflow.documented ? 'success' : 'danger'} size="sm">
          {workflow.documented ? 'Documented' : 'Undocumented'}
        </Badge>
        <div className="flex" style={{ gap: 8 }}>
          <Button variant="ghost" size="sm" icon="eye">
            View Steps
          </Button>
          {!workflow.documented && (
            <Button variant="accent" size="sm" icon="zap">
              Extract Steps
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

/** Workflows inventory with documentation and risk summary for Acme Corp demo. */
export default function WorkflowsPage() {
  const stats = useMemo(() => {
    const documented = WORKFLOWS.filter((w) => w.documented).length
    const highCritical = WORKFLOWS.filter(
      (w) => w.risk === 'critical' || w.risk === 'high',
    ).length
    return {
      total: WORKFLOWS.length,
      documented,
      undocumented: WORKFLOWS.length - documented,
      highCritical,
    }
  }, [])

  return (
    <DashboardShell
      title="Workflows"
      subtitle="Operational procedures & runbooks"
      actions={
        <Button variant="secondary" size="sm" icon="plus">
          Add Workflow
        </Button>
      }
    >
      <div className="flex flex-col" style={{ gap: 24, animation: 'fadeIn 0.3s ease both' }}>
        <div className="grid grid-cols-4" style={{ gap: 16 }}>
          <StatCard label="Total Workflows" value={String(stats.total)} delay={0} />
          <StatCard label="Documented" value={String(stats.documented)} delay={60} />
          <StatCard label="Undocumented" value={String(stats.undocumented)} delay={120} />
          <StatCard
            label="High / Critical Risk"
            value={String(stats.highCritical)}
            delay={180}
          />
        </div>

        <div className="flex flex-col" style={{ gap: 16 }}>
          {WORKFLOWS.map((workflow, index) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              delay={index * 60}
            />
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
