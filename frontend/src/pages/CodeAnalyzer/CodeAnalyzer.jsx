import { useState, useEffect } from 'react'
import apiClient from '../../services/apiClient'
import './CodeAnalyzer.css'

const SEVERITY_COLORS = {
  high: '#fc8181',
  medium: '#ecc94b',
  low: '#48bb78',
}

function getSeverity(rec) {
  if (!rec) return 'low'
  const lower = rec.toLowerCase()
  if (lower.includes('refactor') || lower.includes('nested') || lower.includes('o(n²)')) return 'high'
  if (lower.includes('reduce') || lower.includes('simplify') || lower.includes('consider')) return 'medium'
  return 'low'
}

function formatCurrency(val) {
  if (val == null) return '$0.00'
  const num = typeof val === 'string' ? parseFloat(val) : val
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CodeAnalyzer() {
  const [prs, setPrs] = useState([])
  const [selectedPR, setSelectedPR] = useState(null)
  const [prFiles, setPrFiles] = useState([])
  const [expandedFile, setExpandedFile] = useState(null)
  const [isLoadingPRs, setIsLoadingPRs] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [repo, setRepo] = useState(() => localStorage.getItem('connected_repo'))

  // Fetch open PRs on mount or when repo changes
  useEffect(() => {
    const connected = localStorage.getItem('connected_repo')
    setRepo(connected)
    if (!connected) {
      setPrs([])
      return
    }
    setIsLoadingPRs(true)
    apiClient.get('/api/github/prs', { params: { repo: connected } })
      .then(res => setPrs(res.data?.prs || []))
      .catch(err => {
        console.warn('Failed to fetch PRs:', err)
        setPrs([])
      })
      .finally(() => setIsLoadingPRs(false))
  }, [])

  const handleSelectPR = async (pr) => {
    setSelectedPR(pr)
    setPrFiles([])
    setExpandedFile(null)
    setResult(null)
    setError(null)
    setIsLoadingFiles(true)
    try {
      const res = await apiClient.get(`/api/github/prs/${pr.number}/files`, { params: { repo } })
      setPrFiles(res.data?.files || [])
    } catch (err) {
      setError('Failed to fetch PR files from GitHub.')
      console.warn(err)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedPR || !repo) return
    setIsAnalyzing(true)
    setError(null)
    setResult(null)
    try {
      const defaultService = localStorage.getItem('default_service_name') || 'compute'
      const defaultResource = localStorage.getItem('default_resource_type') || 't3.micro'
      const res = await apiClient.post('/api/analyze-pr', {
        pr_number: selectedPR.number,
        repository_full_name: repo,
        service_name: defaultService,
        resource_type: defaultResource,
      })
      setResult(res.data)
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Analysis failed.'
      setError(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleFile = (idx) => {
    setExpandedFile(expandedFile === idx ? null : idx)
  }

  const renderPatch = (patch) => {
    if (!patch) return <span style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-xs)' }}>No diff available</span>
    return (
      <pre className="analyzer__diff">
        {patch.split('\n').map((line, i) => {
          let color = 'var(--clr-text-secondary)'
          if (line.startsWith('+')) color = '#48bb78'
          else if (line.startsWith('-')) color = '#fc8181'
          else if (line.startsWith('@@')) color = '#63b3ed'
          return <div key={i} style={{ color }}>{line}</div>
        })}
      </pre>
    )
  }

  return (
    <section aria-labelledby="analyzer-title">
      <header className="page-header">
        <p className="page-header__eyebrow">AI Analysis</p>
        <h1 className="page-header__title" id="analyzer-title">PR Analyzer</h1>
        <p className="page-header__subtitle">
          Select an open Pull Request to analyse code changes, predict cost impact, and get AI-powered optimisation suggestions.
        </p>
      </header>

      {!repo && (
        <div className="widget" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
            <span style={{ fontSize: '2rem' }}>🔗</span>
            <p style={{ marginTop: 'var(--space-3)' }}>
              No repository connected. Go to <strong>Settings</strong> to connect a GitHub repo first.
            </p>
          </div>
        </div>
      )}

      <div className="analyzer__grid">
        {/* ── Left Panel: PR Selector & Files ────────────── */}
        <div className="widget">
          <div className="widget__header">
            <div className="widget__title-group">
              <p className="widget__label">GitHub</p>
              <h2 className="widget__title">Open Pull Requests</h2>
            </div>
          </div>
          <div style={{ padding: 'var(--space-4)' }}>
            {isLoadingPRs ? (
              <div className="analyzer__empty">
                <span className="spinner-small" aria-label="Loading PRs..." />
                <p>Fetching open PRs...</p>
              </div>
            ) : prs.length === 0 ? (
              <div className="analyzer__empty">
                <span aria-hidden="true" style={{ fontSize: '2rem' }}>📭</span>
                <p>{repo ? 'No open PRs found in this repository.' : 'Connect a repository to see open PRs.'}</p>
              </div>
            ) : (
              <div className="analyzer__pr-list">
                {prs.map((pr) => (
                  <button
                    key={pr.number}
                    className={`analyzer__pr-item${selectedPR?.number === pr.number ? ' analyzer__pr-item--active' : ''}`}
                    onClick={() => handleSelectPR(pr)}
                  >
                    <div className="analyzer__pr-title">#{pr.number} {pr.title}</div>
                    <div className="analyzer__pr-meta">
                      by {pr.user} &middot; branch: {pr.branch} &middot; {new Date(pr.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* PR Files */}
            {selectedPR && (
              <div style={{ marginTop: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--clr-text-primary)' }}>
                  Changed Files ({prFiles.length})
                </h3>
                {isLoadingFiles ? (
                  <div className="analyzer__empty"><span className="spinner-small" /></div>
                ) : (
                  <div className="analyzer__file-list">
                    {prFiles.map((file, idx) => (
                      <div key={idx} className="analyzer__file-item">
                        <button
                          className="analyzer__file-header"
                          onClick={() => toggleFile(idx)}
                        >
                          <span className="analyzer__file-name">{file.filename}</span>
                          <span className="analyzer__file-badge" style={{
                            background: file.status === 'added' ? 'rgba(72,187,120,0.15)' :
                                       file.status === 'removed' ? 'rgba(252,129,129,0.15)' :
                                       'rgba(99,179,237,0.15)',
                            color: file.status === 'added' ? '#48bb78' :
                                   file.status === 'removed' ? '#fc8181' :
                                   '#63b3ed',
                          }}>
                            {file.status}
                          </span>
                          <span className="analyzer__file-stats">
                            +{file.additions} / -{file.deletions}
                          </span>
                        </button>
                        {expandedFile === idx && (
                          <div className="analyzer__file-body">
                            {renderPatch(file.patch)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="settings-form__submit"
                  style={{ marginTop: 'var(--space-4)', width: '100%' }}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || prFiles.length === 0}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="spinner-small" aria-label="Analyzing..." />
                      &nbsp; Analysing with AI...
                    </>
                  ) : (
                    '🔮 Analyse PR with AI'
                  )}
                </button>

                {error && (
                  <div className="analyzer__error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Analysis Results ──────────────── */}
        <div className="widget">
          <div className="widget__header">
            <div className="widget__title-group">
              <p className="widget__label">Results</p>
              <h2 className="widget__title">Analysis Report</h2>
            </div>
          </div>
          <div style={{ padding: 'var(--space-4)' }}>
            {!result ? (
              <div className="analyzer__empty">
                <span className="analyzer__empty-icon" aria-hidden="true">🤖</span>
                <p>
                  Select an open Pull Request and click <strong>Analyse PR with AI</strong> to see:
                </p>
                <ul style={{ textAlign: 'left', marginTop: 'var(--space-3)', fontSize: 'var(--fs-sm)', lineHeight: 1.8 }}>
                  <li>AST complexity metrics</li>
                  <li>Predicted cost impact vs baseline</li>
                  <li>Google Gemini AI optimisation suggestions</li>
                </ul>
              </div>
            ) : (
              <div className="analyzer__results">
                {/* Cost Cards */}
                <div className="analyzer__score-row">
                  <div className="analyzer__score-card">
                    <span className="analyzer__score-label">Baseline</span>
                    <span className="analyzer__score-value">{formatCurrency(result.baseline_cost_usd)}</span>
                  </div>
                  <div className="analyzer__score-card">
                    <span className="analyzer__score-label">Predicted</span>
                    <span className="analyzer__score-value" style={{ color: '#63b3ed' }}>
                      {formatCurrency(result.predicted_cost_usd)}
                    </span>
                  </div>
                  <div className="analyzer__score-card">
                    <span className="analyzer__score-label">Delta</span>
                    <span className="analyzer__score-value" style={{ color: result.delta_usd > 0 ? '#fc8181' : '#48bb78' }}>
                      {result.delta_usd >= 0 ? '+' : ''}{formatCurrency(result.delta_usd)}
                    </span>
                  </div>
                </div>

                {/* Complexity Score */}
                <div className="analyzer__score-row">
                  <div className="analyzer__score-card">
                    <span className="analyzer__score-label">Complexity</span>
                    <span className="analyzer__score-value" style={{
                      color: result.ast_metrics.complexity_score >= 7 ? '#fc8181' :
                             result.ast_metrics.complexity_score >= 4 ? '#ecc94b' : '#48bb78'
                    }}>
                      {result.ast_metrics.complexity_score}/10
                    </span>
                  </div>
                  <div className="analyzer__score-card">
                    <span className="analyzer__score-label">Files Analysed</span>
                    <span className="analyzer__score-value">{result.files_analyzed}</span>
                  </div>
                  <div className="analyzer__score-card">
                    <span className="analyzer__score-label">Service</span>
                    <span className="analyzer__score-value" style={{ fontSize: 'var(--fs-lg)', textTransform: 'capitalize' }}>
                      {result.service_name}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="analyzer__metrics">
                  <div className="analyzer__metric">
                    <span className="analyzer__metric-label">Functions</span>
                    <span className="analyzer__metric-value">{result.ast_metrics.function_count}</span>
                  </div>
                  <div className="analyzer__metric">
                    <span className="analyzer__metric-label">Loops</span>
                    <span className="analyzer__metric-value">{result.ast_metrics.loop_count}</span>
                  </div>
                  <div className="analyzer__metric">
                    <span className="analyzer__metric-label">Nested</span>
                    <span className="analyzer__metric-value" style={{ color: result.ast_metrics.nested_loop_count > 0 ? '#fc8181' : undefined }}>
                      {result.ast_metrics.nested_loop_count}
                    </span>
                  </div>
                  <div className="analyzer__metric">
                    <span className="analyzer__metric-label">Branches</span>
                    <span className="analyzer__metric-value">{result.ast_metrics.branch_count}</span>
                  </div>
                  <div className="analyzer__metric">
                    <span className="analyzer__metric-label">Cyclomatic</span>
                    <span className="analyzer__metric-value">{result.ast_metrics.cyclomatic_complexity}</span>
                  </div>
                  <div className="analyzer__metric">
                    <span className="analyzer__metric-label">Resource Units</span>
                    <span className="analyzer__metric-value">{result.ast_metrics.resource_units}</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="analyzer__summary">
                  <strong>Summary:</strong> {result.ast_metrics.summary}
                </div>

                {/* Gemini AI Suggestions */}
                {result.gemini_analysis ? (
                  <div className="analyzer__recommendations">
                    <h3 className="analyzer__section-title">
                      <span aria-hidden="true">🤖</span> Gemini AI Optimisation Suggestions
                    </h3>
                    <div
                      className="analyzer__gemini-output"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(result.gemini_analysis) }}
                    />
                  </div>
                ) : (
                  <div className="analyzer__recommendations">
                    <h3 className="analyzer__section-title">Rule-Based Recommendations</h3>
                    {result.ast_metrics.recommendations.map((rec, i) => {
                      const severity = getSeverity(rec)
                      return (
                        <div
                          key={i}
                          className="analyzer__recommendation"
                          style={{ borderLeftColor: SEVERITY_COLORS[severity] }}
                        >
                          <span className="analyzer__rec-dot" style={{ background: SEVERITY_COLORS[severity] }} />
                          <span className="analyzer__rec-text">{rec}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Simple markdown-to-HTML renderer for Gemini output
function renderMarkdown(md) {
  if (!md) return ''

  // Split into blocks (paragraphs, lists, code blocks) separated by blank lines
  const blocks = md.split(/\n\n+/)
  const out = []

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    // Code blocks
    if (trimmed.startsWith('```')) {
      const langMatch = trimmed.match(/^```(\w*)\n([\s\S]*?)```$/)
      if (langMatch) {
        out.push(`<pre style="background:var(--clr-bg-surface);padding:var(--space-3);border-radius:var(--radius-md);overflow-x:auto;font-family:monospace;font-size:var(--fs-xs);line-height:1.5;margin:var(--space-3) 0;"><code>${escapeHtml(langMatch[2])}</code></pre>`)
      } else {
        out.push(`<pre style="background:var(--clr-bg-surface);padding:var(--space-3);border-radius:var(--radius-md);overflow-x:auto;font-family:monospace;font-size:var(--fs-xs);line-height:1.5;margin:var(--space-3) 0;"><code>${escapeHtml(trimmed.replace(/^```|```$/g, '').trim())}</code></pre>`)
      }
      continue
    }

    // Unordered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '))
      const lis = items.map(item => {
        const content = item.trim().replace(/^[-*]\s+/, '')
        return `<li style="margin-bottom:var(--space-2);color:var(--clr-text-secondary);">${inlineMarkdown(content)}</li>`
      }).join('')
      out.push(`<ul style="padding-left:var(--space-4);margin:var(--space-3) 0;">${lis}</ul>`)
      continue
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      out.push(`<h3 style="font-size:var(--fs-md);font-weight:600;margin:var(--space-3) 0;color:var(--clr-text-primary);">${escapeHtml(trimmed.slice(4))}</h3>`)
      continue
    }
    if (trimmed.startsWith('## ')) {
      out.push(`<h2 style="font-size:var(--fs-lg);font-weight:600;margin:var(--space-4) 0;color:var(--clr-text-primary);">${escapeHtml(trimmed.slice(3))}</h2>`)
      continue
    }
    if (trimmed.startsWith('# ')) {
      out.push(`<h1 style="font-size:var(--fs-xl);font-weight:700;margin:var(--space-4) 0;color:var(--clr-text-primary);">${escapeHtml(trimmed.slice(2))}</h1>`)
      continue
    }

    // Regular paragraph
    out.push(`<p style="margin-bottom:var(--space-3);color:var(--clr-text-secondary);">${inlineMarkdown(trimmed)}</p>`)
  }

  return out.join('')
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--clr-text-primary);">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--clr-bg-surface);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:var(--fs-xs);">$1</code>')
}
