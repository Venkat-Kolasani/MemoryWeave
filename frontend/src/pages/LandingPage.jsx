/**
 * LandingPage.jsx
 *
 * Marketing landing page. 11 sections, scroll-reveal animations.
 * Navigates to /dashboard for primary CTAs; feature links route to app pages.
 *
 * Used by: App.jsx route /
 * Depends on: Nav, DashboardPreview, MiniKnowledgeGraph, Button, Badge, Icon, useNavigate
 */

import { useEffect, useRef, useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/layout/Nav.jsx'
import DashboardPreview from '../components/graph/DashboardPreview.jsx'
import MiniKnowledgeGraph from '../components/graph/MiniKnowledgeGraph.jsx'
import Button from '../components/atoms/Button.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Icon from '../components/atoms/Icon.jsx'
import { MOCK_RISK_ITEMS } from '../data/mockData.js'

const COMPANIES = ['Stripe', 'Vercel', 'Figma', 'Linear', 'Notion']

const INTEGRATIONS = [
  'Slack',
  'GitHub',
  'Jira',
  'Confluence',
  'PagerDuty',
  'Notion',
  'Linear',
  'Meetings',
]

const PROBLEM_STATS = [
  {
    value: '42%',
    label: 'of operational knowledge is undocumented',
    color: 'oklch(50% 0.16 25)',
  },
  {
    value: '$4.5M',
    label: 'average cost of knowledge loss per departure',
    color: 'oklch(60% 0.14 65)',
  },
  {
    value: '6 months',
    label: 'avg time to recover critical workflows after turnover',
    color: 'var(--accent)',
  },
  {
    value: '73%',
    label: 'of organizations affected by knowledge gaps',
    color: 'oklch(52% 0.14 160)',
  },
]

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Connect Sources',
    body: 'Connect Slack, GitHub, Jira, meeting transcripts, and internal documentation. MemoryWeave ingests activity across your operational stack.',
  },
  {
    step: '02',
    title: 'AI Extraction',
    body: 'Our multi-agent system extracts workflows, maps dependencies, identifies expertise concentration, and reconstructs undocumented processes.',
  },
  {
    step: '03',
    title: 'Graph Construction',
    body: 'People, systems, incidents, and workflows are automatically linked into a living organizational intelligence map.',
  },
  {
    step: '04',
    title: 'Operational Intelligence',
    body: 'Query the system in natural language. Get structured operational guidance, runbooks, and risk signals.',
  },
]

const USE_CASES = [
  {
    title: 'Employee Transition Risk',
    body: 'Before a critical engineer departs, extract and preserve their undocumented operational knowledge into structured runbooks and dependency maps.',
  },
  {
    title: 'Incident Reconstruction',
    body: "When production issues arise, surface historical resolution patterns, past incident timelines, and the engineers who've solved similar problems.",
  },
  {
    title: 'Accelerated Onboarding',
    body: 'New hires get instant access to institutional context — understanding who knows what, how systems connect, and how decisions have been made.',
  },
  {
    title: 'M&A Due Diligence',
    body: 'Map knowledge concentration risks across an acquired organization before integration. Identify undocumented systems and critical dependencies.',
  },
  {
    title: 'Compliance & Audit',
    body: 'Maintain a continuous audit trail of operational decisions and their rationale, with full chain-of-custody for governance requirements.',
  },
  {
    title: 'Operational Continuity',
    body: 'Ensure that distributed, undocumented knowledge is systematically captured, so organizational continuity is not dependent on any single individual.',
  },
]

const SECURITY_FEATURES = [
  {
    icon: 'shield',
    title: 'SOC 2 Type II',
    body: 'Fully audited security controls and access management',
  },
  {
    icon: 'lock',
    title: 'Zero-trust Architecture',
    body: 'No data leaves your environment without explicit authorization',
  },
  {
    icon: 'database',
    title: 'VPC Deployment',
    body: 'Deploy within your own cloud infrastructure or on-prem',
  },
  {
    icon: 'eye',
    title: 'Audit Logging',
    body: 'Complete audit trail for all data access and AI queries',
  },
]

const FOOTER_LINKS = ['Product', 'Architecture', 'Security', 'Docs', 'Privacy', 'Terms']

const SECTION_CONTAINER = { maxWidth: 1100, margin: '0 auto', width: '100%' }

/**
 * Scroll-reveal wrapper using IntersectionObserver.
 * @param {{ children: React.ReactNode, style?: React.CSSProperties }} props
 */
function ScrollReveal({ children, style }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.15 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(20px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Overline label used in marketing sections. */
function Overline({ children, light = false, accent = false, center = false }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 16,
        textAlign: center ? 'center' : 'left',
        color: accent
          ? 'var(--accent-text)'
          : light
            ? 'rgba(255,255,255,0.4)'
            : 'var(--text-tertiary)',
      }}
    >
      {children}
    </p>
  )
}

/** Marketing landing page with 11 scroll-revealed sections. */
export default function LandingPage() {
  const navigate = useNavigate()
  const topRisks = MOCK_RISK_ITEMS.slice(0, 3)

  return (
    <div style={{ background: 'var(--bg)' }}>
      {/* Section 1 — Nav */}
      <Nav />

      {/* Section 2 — Hero */}
      <section
        className="flex flex-col items-center text-center"
        style={{
          minHeight: '100vh',
          justifyContent: 'center',
          padding: '120px 24px 80px',
        }}
      >
        <div style={{ ...SECTION_CONTAINER, maxWidth: 820 }}>
          <div
            className="inline-flex items-center"
            style={{
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 100,
              padding: '6px 14px 6px 8px',
              marginBottom: 36,
              boxShadow: 'var(--shadow-xs)',
              animation: 'fadeUp 0.5s ease 0.1s both',
            }}
          >
            <Badge variant="dark" size="xs">
              NEW
            </Badge>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Knowledge Graph v2 — Now with dependency risk scoring
            </span>
            <Icon name="arrowRight" size={12} color="var(--text-tertiary)" />
          </div>

          <h1
            style={{
              fontSize: 'clamp(40px, 5vw, 68px)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              color: 'var(--text-primary)',
              margin: '0 auto 24px',
              animation: 'fadeUp 0.6s ease 0.2s both',
            }}
          >
            Your organization loses
            <br />
            knowledge every day.
          </h1>

          <p
            style={{
              fontSize: 18,
              color: 'var(--text-secondary)',
              maxWidth: 560,
              margin: '0 auto 40px',
              lineHeight: 1.6,
              animation: 'fadeUp 0.6s ease 0.3s both',
            }}
          >
            MemoryWeave reconstructs operational intelligence from conversations,
            workflows, and organizational activity — before it disappears.
          </p>

          <div
            className="flex flex-wrap justify-center"
            style={{ gap: 12, animation: 'fadeUp 0.6s ease 0.35s both' }}
          >
            <Button
              variant="primary"
              size="lg"
              icon="arrowRight"
              onClick={() => navigate('/dashboard')}
            >
              Request Demo
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon="graph"
              onClick={() => navigate('/dashboard')}
            >
              View Architecture
            </Button>
          </div>

          <div style={{ marginTop: 20, animation: 'fadeUp 0.5s ease 0.45s both' }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Trusted by teams at{' '}
            </span>
            {COMPANIES.map((company, index) => (
              <span
                key={company}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-tertiary)',
                }}
              >
                {index > 0 ? ', ' : ''}
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Dashboard preview */}
      <section style={{ padding: '32px 24px 80px', ...SECTION_CONTAINER }}>
        <ScrollReveal>
          <DashboardPreview />
        </ScrollReveal>

        <ScrollReveal style={{ marginTop: 32, textAlign: 'center' }}>
          <div className="flex flex-wrap justify-center" style={{ gap: 8 }}>
            {INTEGRATIONS.map((name) => (
              <span
                key={name}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '4px 12px',
                  background: 'var(--surface)',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Section 4 — Problem Statement */}
      <section style={{ background: '#111110', padding: '96px 24px' }}>
        <ScrollReveal style={SECTION_CONTAINER}>
          <div
            className="grid items-center"
            style={{ gridTemplateColumns: '1fr 1fr', gap: 64 }}
          >
            <div>
              <Overline accent>The Problem</Overline>
              <h2
                style={{
                  fontSize: 'clamp(28px, 3vw, 42px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: 'oklch(100% 0 0)',
                  marginBottom: 24,
                }}
              >
                Critical operational knowledge exists only in people&apos;s heads.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                Slack threads, meeting notes, incident post-mortems, GitHub
                comments — the real operational intelligence of your organization
                is scattered across dozens of tools, held by a handful of
                individuals.
              </p>
              <p
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.7,
                }}
              >
                When those individuals leave, the knowledge leaves with them.
                MemoryWeave changes that.
              </p>
            </div>

            <div className="grid grid-cols-2" style={{ gap: 16 }}>
              {PROBLEM_STATS.map((stat) => (
                <div
                  key={stat.value}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      letterSpacing: '-0.04em',
                      color: stat.color,
                      marginBottom: 8,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.5,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 5 — How It Works */}
      <section
        style={{
          background: 'var(--bg)',
          padding: '80px 24px 96px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <ScrollReveal style={{ ...SECTION_CONTAINER, maxWidth: 1100 }}>
          <Overline center>How It Works</Overline>
          <h2
            style={{
              fontSize: 'clamp(28px, 3vw, 42px)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--text-primary)',
              marginBottom: 48,
              maxWidth: 640,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            From raw data to operational intelligence
          </h2>

          <div className="how-it-works-track">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <Fragment key={step.step}>
                <div className="how-it-works-step">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      border: '1px solid var(--border)',
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      marginBottom: 16,
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {step.step}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 8,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
                {index < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="how-it-works-connector" aria-hidden="true" />
                )}
              </Fragment>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Section 6 — Core Capabilities */}
      <section style={{ background: 'var(--bg-secondary)', padding: '96px 24px' }}>
        <ScrollReveal style={SECTION_CONTAINER}>
          <Overline>Core Capabilities</Overline>
          <h2
            style={{
              fontSize: 'clamp(28px, 3vw, 38px)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              marginBottom: 48,
              maxWidth: 480,
            }}
          >
            Every critical dimension of organizational memory
          </h2>

          {/* Block A — Knowledge Graph */}
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: '1fr 1.3fr',
              gap: 48,
              marginBottom: 32,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 40,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <Badge variant="accent" size="sm">
                Knowledge Graph
              </Badge>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  marginTop: 16,
                  marginBottom: 14,
                  color: 'var(--text-primary)',
                }}
              >
                Living organizational intelligence map
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: 20,
                }}
              >
                Automatically maps the relationships between people, systems,
                workflows, and incidents. Identifies who knows what, which systems
                depend on which people, and where your operational risks are
                concentrated.
              </p>
              <Button variant="ghost" size="sm" onClick={() => navigate('/graph')}>
                Explore Graph
              </Button>
            </div>
            <div
              className="relative overflow-hidden"
              style={{
                height: 240,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
              }}
            >
              <MiniKnowledgeGraph />
            </div>
          </div>

          {/* Block B — Risk Detection */}
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: '1.3fr 1fr',
              gap: 48,
              marginBottom: 32,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 40,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 12,
                padding: 24,
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 16,
                }}
              >
                Dependency Risk · Critical
              </div>
              {topRisks.map((item) => (
                <div
                  key={item.id}
                  style={{
                    marginBottom: 16,
                    padding: '12px 14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.name}
                    </span>
                    <Badge
                      variant={item.score > 80 ? 'danger' : 'warning'}
                      size="xs"
                    >
                      {item.score}% RISK
                    </Badge>
                  </div>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Icon name="user" size={10} color="var(--text-tertiary)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Sole owner: <strong>{item.owner}</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      height: 4,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${item.score}%`,
                        background:
                          item.score > 80
                            ? 'oklch(50% 0.16 25)'
                            : 'oklch(60% 0.14 65)',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <Badge variant="danger" size="sm">
                Risk Detection
              </Badge>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  marginTop: 16,
                  marginBottom: 14,
                  color: 'var(--text-primary)',
                }}
              >
                Identify knowledge concentration before it becomes a crisis
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: 20,
                }}
              >
                Proactively surface single points of knowledge failure. When
                critical systems depend on one person&apos;s undocumented expertise,
                MemoryWeave flags it and helps you extract it.
              </p>
              <Button variant="ghost" size="sm" onClick={() => navigate('/risk')}>
                View Risk Report
              </Button>
            </div>
          </div>

          {/* Block C — AI Assistant */}
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: '1fr 1.3fr',
              gap: 48,
              marginBottom: 32,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 40,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <Badge variant="success" size="sm">
                AI Assistant
              </Badge>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  marginTop: 16,
                  marginBottom: 14,
                  color: 'var(--text-primary)',
                }}
              >
                Operational mentor, available always
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: 20,
                }}
              >
                Ask questions in natural language. Get structured answers grounded
                in your organization&apos;s actual operational history — not generic
                AI responses.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/assistant')}
              >
                Try AI Assistant
              </Button>
            </div>
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div
                className="flex items-center"
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  gap: 8,
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'var(--text-primary)',
                  }}
                >
                  <Icon name="ai" size={12} color="oklch(100% 0 0)" />
                </div>
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}
                >
                  Operational Mentor
                </span>
              </div>
              <div
                className="flex flex-col"
                style={{ padding: 16, gap: 12 }}
              >
                <div
                  style={{
                    background: 'var(--text-primary)',
                    color: 'oklch(100% 0 0)',
                    borderRadius: '10px 10px 10px 2px',
                    padding: '10px 14px',
                    alignSelf: 'flex-end',
                    maxWidth: '85%',
                  }}
                >
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                    How do we recover payment service failures?
                  </p>
                </div>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px 10px 2px 10px',
                    padding: '12px 14px',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                      marginBottom: 10,
                    }}
                  >
                    Based on 12 historical incidents, here&apos;s the recovery
                    protocol:
                  </p>
                  {[
                    'Check payment-api health at /status endpoint',
                    'Review Stripe webhook delivery in admin console',
                    'Escalate to A. Patel (primary on-call) or R. Chen (backup)',
                  ].map((stepText, stepIndex) => (
                    <div
                      key={stepText}
                      className="flex items-start"
                      style={{ gap: 8, marginBottom: 6 }}
                    >
                      <div
                        className="flex shrink-0 items-center justify-center"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: 'var(--accent-light)',
                          border: '1px solid oklch(88% 0.06 240)',
                          marginTop: 1,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 8,
                            color: 'var(--accent-text)',
                          }}
                        >
                          {stepIndex + 1}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {stepText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Block D — Data Sources */}
          <div
            className="grid items-center"
            style={{
              gridTemplateColumns: '1.3fr 1fr',
              gap: 48,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 40,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="grid grid-cols-2"
              style={{
                gap: 12,
                background: 'var(--bg)',
                borderRadius: 12,
                padding: 24,
                border: '1px solid var(--border)',
              }}
            >
              {[
                { name: 'Slack', icon: 'slack', nodes: '1,240' },
                { name: 'GitHub', icon: 'gitBranch', nodes: '630' },
                { name: 'Jira', icon: 'grid', nodes: '450' },
                { name: 'PagerDuty', icon: 'alert', nodes: '89' },
              ].map((source) => (
                <div
                  key={source.name}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                  }}
                >
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
                    <Icon name={source.icon} size={14} color="var(--text-secondary)" />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {source.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {source.nodes} nodes
                  </span>
                </div>
              ))}
            </div>
            <div>
              <Badge variant="dark" size="sm">
                Data Sources
              </Badge>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  marginTop: 16,
                  marginBottom: 14,
                  color: 'var(--text-primary)',
                }}
              >
                Connect your operational stack
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  marginBottom: 20,
                }}
              >
                Ingest knowledge from Slack, GitHub, Jira, Confluence, PagerDuty,
                and meeting transcripts. Every connected source enriches the
                organizational memory graph.
              </p>
              <Button variant="ghost" size="sm" onClick={() => navigate('/sources')}>
                View Data Sources
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 7 — Use Cases */}
      <section style={{ background: 'var(--bg)', padding: '96px 24px' }}>
        <ScrollReveal style={{ ...SECTION_CONTAINER, textAlign: 'center' }}>
          <Overline center>Use Cases</Overline>
          <h2
            style={{
              fontSize: 'clamp(28px, 3vw, 38px)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              marginBottom: 48,
            }}
          >
            Built for enterprise operations
          </h2>
          <div className="grid grid-cols-3 gap-4 text-left">
            {USE_CASES.map((useCase, index) => (
              <div
                key={useCase.title}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 28,
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginTop: 12,
                    marginBottom: 10,
                  }}
                >
                  {useCase.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {useCase.body}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Section 8 — Security */}
      <section style={{ background: '#111110', padding: '96px 24px' }}>
        <ScrollReveal style={SECTION_CONTAINER}>
          <div
            className="grid items-center"
            style={{ gridTemplateColumns: '1fr 1fr', gap: 64 }}
          >
            <div>
              <Overline light>Enterprise Security</Overline>
              <h2
                style={{
                  fontSize: 'clamp(28px, 3vw, 38px)',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: 'oklch(100% 0 0)',
                  marginBottom: 24,
                }}
              >
                Built for enterprise security requirements
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.7,
                }}
              >
                MemoryWeave is designed for organizations where security and data
                governance are non-negotiable. All data remains in your
                infrastructure or your dedicated cloud environment.
              </p>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 12 }}>
              {SECURITY_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <Icon name={feature.icon} size={18} color="rgba(255,255,255,0.6)" />
                  <h4
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'oklch(100% 0 0)',
                      marginTop: 12,
                      marginBottom: 8,
                    }}
                  >
                    {feature.title}
                  </h4>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 9 — CTA */}
      <section style={{ padding: '96px 24px', textAlign: 'center' }}>
        <ScrollReveal style={{ ...SECTION_CONTAINER, maxWidth: 640 }}>
          <h2
            style={{
              fontSize: 'clamp(32px, 3vw, 48px)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              color: 'var(--text-primary)',
              marginBottom: 32,
            }}
          >
            The digital twin of your human capital.
          </h2>
          <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
            <Button
              variant="primary"
              size="xl"
              icon="arrowRight"
              onClick={() => navigate('/dashboard')}
            >
              Request Demo
            </Button>
            <Button
              variant="secondary"
              size="xl"
              onClick={() => navigate('/dashboard')}
            >
              Talk to Sales
            </Button>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 10 — Footer */}
      <footer
        className="flex flex-wrap items-center justify-between"
        style={{
          padding: '40px 24px',
          borderTop: '1px solid var(--border)',
          ...SECTION_CONTAINER,
          gap: 16,
        }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 22,
              height: 22,
              background: 'var(--text-primary)',
              borderRadius: 6,
            }}
          >
            <Icon name="layers" size={11} color="oklch(100% 0 0)" />
          </div>
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            MemoryWeave
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Preserve what your team knows
          </span>
        </div>

        <div className="flex flex-wrap" style={{ gap: 20 }}>
          {FOOTER_LINKS.map((link) => (
            <span
              key={link}
              style={{ fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              {link}
            </span>
          ))}
        </div>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-tertiary)',
          }}
        >
          © 2026 MemoryWeave, Inc.
        </span>
      </footer>
    </div>
  )
}
