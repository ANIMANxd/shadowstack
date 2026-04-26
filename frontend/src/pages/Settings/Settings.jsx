import { useState, useEffect } from 'react'
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
        {type === 'success' ? 'Γ£ô' : type === 'error' ? 'Γ£ò' : 'Γä╣'}
      </span>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={onClose} aria-label="Close">
        Γ£ò
      </button>
    </div>
  )
}

/**
 * Settings ΓÇô repository connection and account management.
 */
export default function Settings() {
  const { token, logout, user } = useAuth()
  const [repo, setRepo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message }
  const [connectedRepo, setConnectedRepo] = useState(
    () => localStorage.getItem('connected_repo')
  )

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
      // POST request to /api/integrations/github/webhook
      const response = await apiClient.post('/api/integrations/github/webhook', {
        repository_full_name: trimmed,
        github_access_token: token,
      })

      const msg = response.data?.message || `Successfully connected to ${trimmed}`
      showToast('success', msg)

      // Persist connected repo
      localStorage.setItem('connected_repo', trimmed)
      setConnectedRepo(trimmed)
      setRepo('')
    } catch (err) {
      // Mock fallback if backend is not available
      if (import.meta.env.DEV && (err.status === 0 || err.code === 'ERR_NETWORK')) {
        console.warn('[Settings] Backend unreachable ΓÇö simulating successful connection.')
        showToast('success', `Simulated connection to ${trimmed}`)
        localStorage.setItem('connected_repo', trimmed)
        setConnectedRepo(trimmed)
        setRepo('')
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to connect repository. Please try again.'
        showToast('error', msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section aria-labelledby="settings-title" className="settings-page">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Page header */}
      <header className="page-header">
        <p className="page-header__eyebrow">Configuration</p>
        <h1 className="page-header__title" id="settings-title">Settings</h1>
        <p className="page-header__subtitle">
          Connect your GitHub repositories and manage your account.
        </p>
      </header>

      <div className="settings__grid">
        {/* ΓöÇΓöÇ Repository Connection Card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon settings-card__icon--github" aria-hidden="true">
              ≡ƒöù
            </div>
            <div>
              <h2 className="settings-card__title">Repository Connection</h2>
              <p className="settings-card__desc">
                Connect a GitHub repository to enable webhook-driven cost predictions.
              </p>
            </div>
          </div>

          <form className="settings-form" onSubmit={handleConnect}>
            <label className="settings-form__label" htmlFor="repo-input">
              Repository
            </label>
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
              <button
                id="connect-repo-btn"
                className="settings-form__submit"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner-small" aria-label="Loading..." />
                ) : (
                  'Connect'
                )}
              </button>
            </div>
            <p className="settings-form__hint">
              Example: <code>acme/api-service</code>
            </p>
          </form>

          {/* Currently Connected Repository List/Card */}
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

        {/* ΓöÇΓöÇ Account Card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon settings-card__icon--user" aria-hidden="true">
              ≡ƒæñ
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
                {token ? `${token.slice(0, 8)}ΓÇª${token.slice(-4)}` : 'ΓÇö'}
              </span>
            </div>
          </div>

          <button
            id="logout-btn"
            className="settings-logout-btn"
            onClick={logout}
            type="button"
          >
            Sign Out
          </button>
        </div>
      </div>
    </section>
  )
}
