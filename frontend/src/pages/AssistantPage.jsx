/**
 * AssistantPage.jsx
 *
 * Conversational interface grounded in organizational knowledge.
 * Full-height layout with chat area left and context panel right.
 *
 * Used by: App.jsx route /assistant
 * Depends on: DashboardShell, Badge, Icon, Button, useAppStore
 */

import { useEffect, useRef, useState } from 'react'
import useAppStore from '../stores/appStore.js'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Icon from '../components/atoms/Icon.jsx'

const SUGGESTIONS = [
  'How do we recover payment service failures?',
  'Who owns the auth pipeline?',
  'What happened in incident P-4021?',
  'Which systems have no backup owner?',
  'What breaks if Patel is out Monday?',
  'Show bus factor on Payment API',
  'Who resolved incident P-3722?',
  'Q4 deployment history for Deploy System',
]

const RECENT_QUERIES = [
  'Payment recovery after P-4021',
  'Systems without backup owner',
  'Auth pipeline ownership',
  'Patel bus factor risk',
]

const GRID_CATEGORIES = ['systems', 'people', 'incidents']

/** Subtle Coral attribution label for page chrome. */
function PoweredByCoral() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        marginLeft: 6,
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        color: 'var(--accent-text)',
        letterSpacing: '0.04em',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'pulse-dot 1.5s ease-in-out infinite',
        }}
      />
      Powered by Coral SQL
    </span>
  )
}

/** Renders avatar for user or assistant messages. */
function MessageAvatar({ role }) {
  const isAssistant = role === 'assistant'
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        marginTop: 2,
        background: isAssistant ? 'var(--text-primary)' : 'var(--bg-tertiary)',
        border: isAssistant ? 'none' : '1px solid var(--border)',
      }}
    >
      <Icon
        name={isAssistant ? 'ai' : 'user'}
        size={14}
        color={isAssistant ? '#ffffff' : 'var(--text-secondary)'}
      />
    </div>
  )
}

/** Renders related entities grid plus full-width warning alert boxes (not badges). */
function RelatedEntities({ related }) {
  if (!related) return null

  const warnings = related.warnings || []

  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        paddingTop: 14,
        marginTop: 14,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {GRID_CATEGORIES.map((category) => {
          const values = related[category]
          if (!values?.length) return null

          return (
            <div key={category}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                {category}
              </div>
              <div className="flex flex-wrap" style={{ gap: 4 }}>
                {values.map((item) => (
                  <Badge key={item} variant="default" size="xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {warnings.length > 0 && (
        <div className="flex flex-col" style={{ gap: 8, marginTop: 14 }}>
          {warnings.map((warning) => (
            <div
              key={warning}
              className="flex items-start"
              style={{
                gap: 8,
                background: 'oklch(97% 0.04 25)',
                border: '1px solid oklch(90% 0.07 25)',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <Icon name="alert" size={14} color="var(--danger)" />
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--danger)',
                  lineHeight: 1.45,
                  fontWeight: 500,
                }}
              >
                {warning}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Renders a single chat message bubble. */
function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const isStructured = message.type === 'structured' || Boolean(message.steps)

  if (isUser) {
    return (
      <div
        style={{
          background: 'var(--text-primary)',
          color: '#ffffff',
          borderRadius: '10px 10px 10px 2px',
          padding: '10px 14px',
          display: 'inline-block',
        }}
      >
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{message.content}</p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px 10px 2px 10px',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          marginBottom: isStructured && message.steps ? 16 : 0,
          marginTop: 0,
        }}
      >
        {message.content}
      </p>

      {message.steps && (
        <div className="flex flex-col" style={{ gap: 10, marginBottom: 16 }}>
          {message.steps.map((step, stepIndex) => (
            <div key={step} className="flex" style={{ gap: 10 }}>
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  border: '1px solid oklch(88% 0.06 240)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'var(--accent-text)',
                }}
              >
                {stepIndex + 1}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {step}
              </p>
            </div>
          ))}
        </div>
      )}

      {isStructured && message.related && (
        <RelatedEntities related={message.related} />
      )}

      {message.retrieval_fallback && (
        <p
          style={{
            marginTop: 10,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--warning)',
            letterSpacing: '0.02em',
          }}
        >
          Coral unavailable — answered via Standard RAG fallback
        </p>
      )}

      {message.coral_sql && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                color: 'var(--accent-text)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Coral SQL · {message.coral_rows} rows retrieved
            </span>
          </div>
          <code
            style={{
              display: 'block',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 60,
              overflow: 'hidden',
            }}
          >
            {message.coral_sql.split('\n').slice(0, 5).join('\n')}
            {message.coral_sql.split('\n').length > 5 ? '\n...' : ''}
          </code>
        </div>
      )}
    </div>
  )
}

/** Loading indicator with pulsing dots. */
function LoadingIndicator() {
  return (
    <div className="flex items-start" style={{ gap: 10 }}>
      <MessageAvatar role="assistant" />
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px 10px 2px 10px',
          padding: '14px 16px',
        }}
      >
        <div className="flex" style={{ gap: 6 }}>
          {[0, 0.2, 0.4].map((delay, index) => (
            <span
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                animation: `pulse-dot 1.2s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** AI assistant page with chat, suggestions, and knowledge context panel. */
export default function AssistantPage() {
  const messages = useAppStore((s) => s.messages)
  const isLoading = useAppStore((s) => s.isLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const useCoralQuery = useAppStore((s) => s.useCoralQuery)
  const toggleCoralQuery = useAppStore((s) => s.toggleCoralQuery)
  const knowledgeStats = useAppStore((s) => s.knowledgeStats)
  const fetchStats = useAppStore((s) => s.fetchStats)

  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  const contextStats = [
    { label: 'Active Sources', value: '8', icon: 'database' },
    {
      label: 'Nodes',
      value: knowledgeStats.nodes
        ? knowledgeStats.nodes.toLocaleString()
        : '—',
      icon: 'graph',
    },
    {
      label: 'Critical Risks',
      value: String(knowledgeStats.risks ?? '—'),
      icon: 'alert',
    },
    {
      label: 'Undocumented',
      value: knowledgeStats.undocumented
        ? knowledgeStats.undocumented.toLocaleString()
        : '—',
      icon: 'workflow',
    },
  ]

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage(text)
    setInput('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const hasInput = input.trim().length > 0

  return (
    <DashboardShell
      title="AI Assistant"
      subtitle={
        useCoralQuery
          ? 'Operational Mentor · Cross-source SQL retrieval'
          : 'Operational Mentor · Grounded in organizational memory'
      }
      contentPadding={0}
      contentOverflow="hidden"
    >
      <div className="flex overflow-hidden" style={{ height: '100%' }}>
        {/* Chat area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className="flex flex-1 flex-col overflow-y-auto"
            style={{ padding: '24px 32px', gap: 16 }}
          >
            {messages.map((message, index) => (
              <div
                key={message.id ?? `${message.role}-${index}`}
                className="flex items-start"
                style={{ gap: 10, animation: 'fadeUp 0.3s ease both' }}
              >
                <MessageAvatar role={message.role} />
                <div className="min-w-0 flex-1">
                  <ChatMessage message={message} />
                </div>
              </div>
            ))}

            {isLoading && <LoadingIndicator />}
            <div ref={scrollRef} />
          </div>

          {/* Suggestions */}
          <div
            className="flex flex-wrap"
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '12px 32px',
              gap: 8,
            }}
          >
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '16px 32px',
            }}
          >
            <div
              className="flex items-end"
              style={{
                gap: 10,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 12px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about workflows, incidents, dependencies..."
                rows={1}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fontSize: 14,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  lineHeight: 1.5,
                  maxHeight: 120,
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!hasInput || isLoading}
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: 'none',
                  cursor: hasInput && !isLoading ? 'pointer' : 'not-allowed',
                  background: hasInput ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                }}
              >
                <Icon
                  name={hasInput ? 'ai' : 'send'}
                  size={14}
                  color={hasInput ? '#ffffff' : 'var(--text-tertiary)'}
                />
              </button>
            </div>
            <p
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-tertiary)',
                textAlign: 'center',
              }}
            >
              {useCoralQuery ? (
                'Coral SQL mode · Powered by Coral SQL · cross-source JOINs'
              ) : (
                <>
                  Grounded in {knowledgeStats.nodes.toLocaleString()} knowledge nodes ·
                  live organizational memory
                </>
              )}
            </p>
          </div>
        </div>

        {/* Context panel */}
        <aside
          style={{
            width: 260,
            flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            background: 'var(--surface)',
            overflowY: 'auto',
            padding: 20,
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
            Knowledge Context
          </div>

          {contextStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center"
              style={{ gap: 10, marginBottom: 12 }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  background: 'var(--bg-secondary)',
                  borderRadius: 7,
                }}
              >
                <Icon name={stat.icon} size={14} color="var(--text-secondary)" />
              </div>
              <div className="flex flex-col">
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            </div>
          ))}

          <div
            style={{
              padding: 16,
              marginLeft: -20,
              marginRight: -20,
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600 }}>Retrieval Mode</span>
              {useCoralQuery && <PoweredByCoral />}
            </div>

            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !useCoralQuery) {
                  toggleCoralQuery()
                }
              }}
              onClick={() => !useCoralQuery && toggleCoralQuery()}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 6,
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: `1px solid ${useCoralQuery ? 'var(--accent)' : 'var(--border)'}`,
                background: useCoralQuery ? 'var(--accent-light)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: useCoralQuery ? 'var(--accent-text)' : 'var(--text-primary)',
                  }}
                >
                  Coral SQL JOIN
                </div>
                {useCoralQuery && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      animation: 'pulse-dot 1.2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                  marginTop: 2,
                }}
              >
                Primary · Cross-source SQL · No ETL
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && useCoralQuery) {
                  toggleCoralQuery()
                }
              }}
              onClick={() => useCoralQuery && toggleCoralQuery()}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: `1px solid ${!useCoralQuery ? 'var(--accent)' : 'var(--border)'}`,
                background: !useCoralQuery ? 'var(--accent-light)' : 'transparent',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: !useCoralQuery ? 'var(--accent-text)' : 'var(--text-primary)',
                }}
              >
                Standard RAG
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                  marginTop: 2,
                }}
              >
                Fallback · ChromaDB + Neo4j Cypher
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Recent Queries
          </div>

          {RECENT_QUERIES.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => sendMessage(query)}
              style={{
                width: '100%',
                textAlign: 'left',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '8px 12px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                background: 'transparent',
                cursor: 'pointer',
                marginBottom: 6,
              }}
            >
              {query}
            </button>
          ))}
        </aside>
      </div>
    </DashboardShell>
  )
}
