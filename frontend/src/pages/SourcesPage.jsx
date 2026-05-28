/**
 * SourcesPage.jsx
 *
 * Data source management with drag-and-drop ingest upload.
 * Shows connected sources, stats, and POST /ingest pipeline status.
 *
 * Used by: App.jsx route /sources
 * Depends on: DashboardShell, StatCard, Badge, Button, Icon, useAppStore, api.js
 */

import { useRef, useState } from 'react'
import DashboardShell from '../components/layout/DashboardShell.jsx'
import StatCard from '../components/atoms/StatCard.jsx'
import Badge from '../components/atoms/Badge.jsx'
import Button from '../components/atoms/Button.jsx'
import Icon from '../components/atoms/Icon.jsx'
import useAppStore from '../stores/appStore.js'
import * as api from '../services/api.js'
import { MOCK_SOURCES } from '../data/mockData.js'

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.json', '.csv']

/** Maps source status to Badge variant and label. */
function statusBadge(status) {
  switch (status) {
    case 'active':
      return { variant: 'success', label: 'Active' }
    case 'syncing':
      return { variant: 'accent', label: 'Syncing' }
    default:
      return { variant: 'default', label: 'Inactive' }
  }
}

/**
 * Upload zone + source cards. Triggers background extraction via POST /ingest.
 */
export default function SourcesPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [ingestingFileName, setIngestingFileName] = useState('')

  const fileInputRef = useRef(null)
  const ingestionStatus = useAppStore((s) => s.ingestionStatus)
  const setIngestionStatus = useAppStore((s) => s.setIngestionStatus)
  const knowledgeStats = useAppStore((s) => s.knowledgeStats)
  const fetchGraph = useAppStore((s) => s.fetchGraph)
  const fetchStats = useAppStore((s) => s.fetchStats)

  const handleFile = async (file) => {
    if (!file) return

    const ext = file.name.includes('.')
      ? `.${file.name.split('.').pop().toLowerCase()}`
      : ''
    if (ext && !ACCEPTED_EXTENSIONS.includes(ext)) {
      setIngestingFileName(file.name)
      setIngestionStatus('error')
      setTimeout(() => {
        setIngestionStatus(null)
        setIngestingFileName('')
      }, 5000)
      return
    }

    setIngestingFileName(file.name)
    setIngestionStatus('processing')

    try {
      await api.ingestFile(file)
      setIngestionStatus('complete')
      setTimeout(() => {
        fetchGraph()
        fetchStats()
      }, 35000)
      setTimeout(() => {
        setIngestionStatus(null)
        setIngestingFileName('')
      }, 8000)
    } catch (err) {
      console.error('[SourcesPage] ingest failed:', err)
      setIngestionStatus('error')
      setTimeout(() => {
        setIngestionStatus(null)
        setIngestingFileName('')
      }, 5000)
    }
  }

  const onFileInputChange = (event) => {
    const file = event.target.files?.[0]
    if (file) handleFile(file)
    event.target.value = ''
  }

  const onDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const nodeCount = knowledgeStats.nodes
    ? knowledgeStats.nodes.toLocaleString()
    : '—'

  return (
    <DashboardShell
      title="Data Sources"
      subtitle="Connected intelligence pipelines"
      actions={
        <Button variant="primary" size="sm" icon="plus">
          Connect Source
        </Button>
      }
    >
      <div className="flex flex-col" style={{ gap: 24, animation: 'fadeIn 0.3s ease both' }}>
        {/* Upload zone */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click()
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 32,
            textAlign: 'center',
            marginBottom: 24,
            background: isDragging ? 'var(--accent-light)' : 'var(--bg)',
            borderColor: isDragging ? 'var(--accent)' : 'var(--border)',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.csv"
            style={{ display: 'none' }}
            onChange={onFileInputChange}
            onClick={(event) => event.stopPropagation()}
          />

          <div style={{ marginBottom: 12 }}>
            <Icon name="file" size={32} color="var(--text-tertiary)" />
          </div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-primary)',
              margin: '0 0 4px',
            }}
          >
            Drop Slack exports, incident reports, or docs here
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              margin: '0 0 16px',
              letterSpacing: '0.02em',
            }}
          >
            Accepts .txt .md .json .csv
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              fileInputRef.current?.click()
            }}
          >
            Browse files
          </Button>
        </div>

        {/* Ingestion status */}
        {ingestionStatus === 'processing' && (
          <div
            className="flex items-center"
            style={{ gap: 10, marginBottom: 16, marginTop: -8 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent)',
                flexShrink: 0,
                animation: 'pulse-dot 1.2s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
              Extracting knowledge from {ingestingFileName || 'upload'}...
            </span>
            <Badge variant="accent" size="xs">
              Processing
            </Badge>
          </div>
        )}

        {ingestionStatus === 'complete' && (
          <div
            className="flex items-center"
            style={{ gap: 10, marginBottom: 16, marginTop: -8 }}
          >
            <Icon name="check" size={16} color="var(--success)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
              Extraction complete — graph updating...
            </span>
            <Badge variant="success" size="xs">
              Complete
            </Badge>
          </div>
        )}

        {ingestionStatus === 'error' && (
          <div
            className="flex items-center"
            style={{ gap: 10, marginBottom: 16, marginTop: -8 }}
          >
            <Icon name="alert" size={16} color="var(--danger)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
              Extraction failed — check file type and try again
            </span>
            <Badge variant="danger" size="xs">
              Failed
            </Badge>
          </div>
        )}

        {/* Row 1 — Stats */}
        <div className="grid grid-cols-4" style={{ gap: 16 }}>
          <StatCard label="Connected" value="6" delay={0} />
          <StatCard label="Active Pipelines" value="5" delay={60} />
          <StatCard label="Nodes Extracted" value={nodeCount} delay={120} />
          <StatCard label="Last Sync" value="4 min ago" delay={180} />
        </div>

        {/* Row 2 — Sources grid */}
        <div className="grid grid-cols-3" style={{ gap: 16 }}>
          {MOCK_SOURCES.map((source) => {
            const badge = statusBadge(source.status)
            const isInactive = source.status === 'inactive'

            return (
              <div
                key={source.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xs)',
                  padding: 24,
                }}
              >
                <div
                  className="flex items-start justify-between"
                  style={{ marginBottom: 16 }}
                >
                  <div className="flex items-center">
                    <Icon name={source.icon} size={20} color="var(--text-secondary)" />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginLeft: 10,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {source.name}
                    </span>
                  </div>
                  <Badge variant={badge.variant} size="xs">
                    {badge.label}
                  </Badge>
                </div>

                <div
                  className="flex"
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: 16,
                    marginBottom: 16,
                  }}
                >
                  {[
                    `${source.nodes.toLocaleString()} nodes`,
                    `Synced ${source.lastSync}`,
                    `${source.channels} sources`,
                  ].map((stat, index) => (
                    <div
                      key={stat}
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        textAlign: 'center',
                        borderRight:
                          index < 2 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      {stat}
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={isInactive ? 'plus' : undefined}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isInactive ? 'Connect' : 'Manage'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
