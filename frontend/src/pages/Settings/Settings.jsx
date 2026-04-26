import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../services/apiClient'
import './Settings.css'

/**
 * Toast Notification Component
 */
function Toast({ type, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast toast--${type}`} role="alert">
      <span aria-hidden="true" className="toast__icon">
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>
  )
}

const SERVICES = [
  { value: 'compute', label: 'Compute (EC2)' },
  { value: 'database', label: 'Database (RDS)' },
  { value: 'storage', label: 'Storage (S3)' },
  { value: 'cdn', label: 'CDN (CloudFront)' },
  { value: 'functions', label: 'Functions (Lambda)' },
]

const RESOURCES = {
  compute: ['t3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge'],
  database: ['RDS-postgres', 'RDS-mysql', 'RDS-mariadb'],
  storage: ['S3-standard', 'S3-ia', 'S3-glacier'],
  cdn: ['CloudFront', 'Fastly'],
  functions: ['Lambda-128MB', 'Lambda-512MB', 'Lambda-1GB', 'Lambda-3GB'],
}

/**
 * Settings – repository connection, deployment config, and manual prediction.
 */
export default function Settings() {
  const { token, logout, user } = useAuth()
  const navigate = useNavigate()
  const [repo, setRepo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [connectedRepo, setConnectedRepo] = useState(
    () => localStorage.getItem('connected_repo')
  )

  // Deployment settings
  const [serviceName, setServiceName] = useState('compute')
  const [resourceType, setResourceType] = useState('t3.micro')
  const [complexityScore, setComplexityScore] = useState(5.0)
  const [resourceUnits, setResourceUnits] = useState(150)
  const [prNumber, setPrNumber] = useState(1)

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  const handleConnect = async (e) => {
    e.preventDefault()
    const trimmed = repo.trim()
    if (!trimmed || !trimmed.includes('/')) {
      showToast('error', 'Please enter a valid repository in owner/repo format.')
      return
    }
    setIsLoading(true)
    try {
      const response = await apiClient.post('/api/integrations/github/webhook', {
        repository_full_name: trimmed,
        github_access_token: token,
      })
      const msg = response.data?.message || `Successfully connected to ${trimmed}`
      showToast('success', msg)
      localStorage.setItem('connected_repo', trimmed)
      setConnectedRepo(trimmed)
      setRepo('')
    } catch (err) {
      if (import.meta.env.DEV && (err.status === 0 || err.code === 'ERR_NETWORK')) {
        showToast('success', `Simulated connection to ${trimmed}`)
        localStorage.setItem('connected_repo', trimmed)
        setConnectedRepo(trimmed)
        setRepo('')
      } else {
        const msg = err?.response?.data?.message || err?.message || 'Failed to connect repository.'
        showToast('error', msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunPrediction = async () => {
    setIsLoading(true)
    try {
      const payload = {
        pr_number: Number(prNumber),
        repository_full_name: connectedRepo || undefined,
        complexity_score: Number(complexityScore),
        resource_units: Number(resourceUnits),
        service_name: serviceName,
        resource_type: resourceType,
      }
      const response = await apiClient.post('/api/predict', payload)
      const cost = response.data.predicted_cost_usd
      showToast('success', `Predicted cost: $${cost}/month for PR #${prNumber}`)
      setPrNumber((n) => Number(n) + 1)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Prediction failed.'
      showToast('error', msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section aria-labelledby="settings-title" className="settings-page">
      {toast && (
        <div className="toast-container">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      <header className="page-header">
        <p className="page-header__eyebrow">Configuration</p>
        <h1 className="page-header__title" id="settings-title">Settings</h1>
        <p className="page-header__subtitle">
          Connect your GitHub repositories, configure deployment settings, and run predictions.
        </p>
      </header>

      <div className="settings__grid">
        {/* ── Repository Connection Card ─────────────────── */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon settings-card__icon--github" aria-hidden="true">
              🔗
            </div>
            <div>
              <h2 className="settings-card__title">Repository Connection</h2>
              <p className="settings-card__desc">
                Connect a GitHub repository to enable webhook-driven cost predictions.
              </p>
            </div>
          </div>

          <form className="settings-form" onSubmit={handleConnect}>
            <label className="settings-form__label" htmlFor="repo-input">Repository</label>
            <div className="settings-form__input-group">
              <input
                id="repo-input"
                className="settings-form__input"
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="owner/repository"
                autoComplete="off"
                spellCheck="false"
                disabled={isLoading}
              />
              <button id="connect-repo-btn" className="settings-form__submit" type="submit" disabled={isLoading}>
                {isLoading ? <span className="spinner-small" aria-label="Loading..." /> : 'Connect'}
              </button>
            </div>
            <p className="settings-form__hint">Example: <code>acme/api-service</code></p>
          </form>

          {connectedRepo && (
            <div className="settings-connected">
              <span className="settings-form__label">Currently Connected Repository</span>
              <div className="settings-connected__item">
                <span className="settings-connected__repo">
                  <span className="settings-connected__dot" aria-hidden="true" />
                  {connectedRepo}
                </span>
                <span className="badge badge--green">Active</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Deployment Settings Card ───────────────────── */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon settings-card__icon--deploy" aria-hidden="true">
              ⚙️
            </div>
            <div>
              <h2 className="settings-card__title">Deployment Settings</h2>
              <p className="settings-card__desc">
                Select the cloud service and resource type for cost predictions.
              </p>
            </div>
          </div>

          <div className="settings-form">
            <div className="settings-form__row">
              <div className="settings-form__field">
                <label className="settings-form__label" htmlFor="service-select">Service</label>
                <select
                  id="service-select"
                  className="settings-form__input"
                  value={serviceName}
                  onChange={(e) => { setServiceName(e.target.value); setResourceType(RESOURCES[e.target.value][0]) }}
                >
                  {SERVICES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="settings-form__field">
                <label className="settings-form__label" htmlFor="resource-select">Resource Type</label>
                <select
                  id="resource-select"
                  className="settings-form__input"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                >
                  {RESOURCES[serviceName].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="settings-form__row">
              <div className="settings-form__field">
                <label className="settings-form__label" htmlFor="complexity-input">Complexity Score</label>
                <input
                  id="complexity-input"
                  className="settings-form__input"
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={complexityScore}
                  onChange={(e) => setComplexityScore(e.target.value)}
                />
              </div>
              <div className="settings-form__field">
                <label className="settings-form__label" htmlFor="units-input">Resource Units</label>
                <input
                  id="units-input"
                  className="settings-form__input"
                  type="number"
                  min="1"
                  value={resourceUnits}
                  onChange={(e) => setResourceUnits(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Manual Prediction Card ─────────────────────── */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon settings-card__icon--predict" aria-hidden="true">
              🔮
            </div>
            <div>
              <h2 className="settings-card__title">Run Prediction</h2>
              <p className="settings-card__desc">
                Manually trigger a cost prediction for the connected repository.
              </p>
            </div>
          </div>

          <div className="settings-form">
            <div className="settings-form__row">
              <div className="settings-form__field">
                <label className="settings-form__label" htmlFor="pr-input">PR Number</label>
                <input
                  id="pr-input"
                  className="settings-form__input"
                  type="number"
                  min="1"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                />
              </div>
            </div>
            <button
              className="settings-form__submit"
              onClick={handleRunPrediction}
              disabled={isLoading}
              style={{ marginTop: 'var(--space-3)' }}
            >
              {isLoading ? <span className="spinner-small" aria-label="Loading..." /> : 'Run Prediction'}
            </button>
          </div>
        </div>

        {/* ── Account Card ───────────────────────────────── */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon settings-card__icon--user" aria-hidden="true">
              👤
            </div>
            <div>
              <h2 className="settings-card__title">Account</h2>
              <p className="settings-card__desc">
                Your session details and sign-out option.
              </p>
            </div>
          </div>

          <div className="settings-account">
            {user && (
              <div className="settings-account__row">
                <span className="settings-account__label">User</span>
                <span className="settings-account__value">{user.login || user.name}</span>
              </div>
            )}
            <div className="settings-account__row">
              <span className="settings-account__label">Authentication</span>
              <span className="settings-account__value">GitHub OAuth</span>
            </div>
            <div className="settings-account__row">
              <span className="settings-account__label">Token Status</span>
              <span className="badge badge--green">Active</span>
            </div>
            <div className="settings-account__row">
              <span className="settings-account__label">Access Token</span>
              <span className="settings-account__value" style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)' }}>
                {token ? `${token.slice(0, 8)}…${token.slice(-4)}` : '—'}
              </span>
            </div>
          </div>

          <button id="logout-btn" className="settings-logout-btn" onClick={logout} type="button">
            Sign Out
          </button>
        </div>
      </div>
    </section>
  )
}
