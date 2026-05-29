/**
 * McpIntegrationSection.jsx
 *
 * Settings UI for Coral MCP server setup — copy-paste config, tool list, example query.
 * Fetches /coral-mcp-config; falls back to static config when API is unreachable.
 *
 * Used by: SettingsPage
 * Depends on: Badge, Button, api.fetchCoralMcpConfig
 */

import { useState, useEffect } from 'react'
import Badge from '../atoms/Badge.jsx'
import Button from '../atoms/Button.jsx'
import { fetchCoralMcpConfig } from '../../services/api.js'

const MCP_TOOLS = [
  {
    name: 'coral_query_nodes',
    description: 'Query people, systems, incidents as SQL',
  },
  {
    name: 'coral_query_edges',
    description: 'Query relationships and ownership as SQL',
  },
  {
    name: 'coral_query_incidents',
    description: 'Query incident postmortems as SQL',
  },
  {
    name: 'coral_cross_join',
    description: 'JOIN across all sources in one query',
  },
  {
    name: 'github_issues',
    description: 'Live GitHub issues (github.issues) when GITHUB_TOKEN is set',
  },
]

const EXAMPLE_MCP_QUERY = `// Claude Desktop with MemoryWeave MCP:
// "What are all the systems A. Patel owns?"
// → Coral executes: SELECT * FROM knowledge_edges WHERE from_name LIKE '%Patel%'
// → Returns structured rows, no context window pollution`

/** Static fallback when /coral-mcp-config is unreachable (local dev setup). */
const PLACEHOLDER_MCP_CONFIG = {
  mcpServers: {
    'memoryweave-coral': {
      command: 'coral',
      args: ['mcp', '--sources', 'backend/coral/sources.yaml'],
      description:
        'MemoryWeave Coral SQL layer — query knowledge_nodes, knowledge_edges, incident_reports, slack_messages as SQL tables',
    },
  },
}

/**
 * Coral MCP integration block for Settings — config copy, tools, example query.
 */
export default function McpIntegrationSection() {
  const [mcpPayload, setMcpPayload] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchCoralMcpConfig()
      .then((data) => {
        if (!cancelled) setMcpPayload(data)
      })
      .catch(() => {
        if (!cancelled) {
          setMcpPayload({
            available: false,
            cli_available: false,
            config: PLACEHOLDER_MCP_CONFIG,
            instructions:
              'Could not reach the API — using placeholder paths. Install Coral locally: brew install withcoral/tap/coral',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const config = mcpPayload?.config ?? PLACEHOLDER_MCP_CONFIG
  const configJson = JSON.stringify(config, null, 2)
  const mcpAvailable = mcpPayload?.available === true
  const cliAvailable = mcpPayload?.cli_available !== false

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(configJson)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 4,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          MCP Integration
        </h3>
        <Badge variant="accent" size="xs">
          Recommended
        </Badge>
      </div>
      <p
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
          marginBottom: 16,
        }}
      >
        Connect MemoryWeave&apos;s Coral SQL layer directly to Claude Desktop or any MCP
        client.
      </p>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 24,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            1. Add to your MCP config
          </p>
          <div style={{ position: 'relative' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1,
                color: '#a8d8a8',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <pre
              style={{
                margin: 0,
                padding: 16,
                paddingRight: 72,
                background: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.6,
                color: '#a8d8a8',
                overflowX: 'auto',
                whiteSpace: 'pre',
              }}
            >
              {configJson}
            </pre>
          </div>
          {mcpPayload?.instructions && (
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              {mcpPayload.instructions}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            2. Available tools in MCP
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            {MCP_TOOLS.map((tool) => (
              <div
                key={tool.name}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                    color: 'var(--accent-text)',
                    marginBottom: 4,
                  }}
                >
                  {tool.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {tool.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            3. Example MCP query
          </p>
          <pre
            style={{
              margin: 0,
              padding: 16,
              background: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.6,
              color: '#a8d8a8',
              whiteSpace: 'pre-wrap',
            }}
          >
            {EXAMPLE_MCP_QUERY}
          </pre>
        </div>

        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              flex: 1,
              minWidth: 200,
            }}
          >
            Production uses CLI subprocess; MCP is for local agent clients.
          </span>
          <Badge variant="default" size="xs">
            CLI {cliAvailable ? 'active in production' : 'check Render deploy'}
          </Badge>
          <Badge variant={mcpAvailable ? 'success' : 'default'} size="xs">
            MCP {mcpAvailable ? 'available locally' : 'install coral CLI'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
