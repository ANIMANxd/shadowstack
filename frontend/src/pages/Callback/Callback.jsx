import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../services/apiClient'
import './Callback.css'

/**
 * Callback – GitHub OAuth redirect handler.
 *
 * After the user authorizes on GitHub, they are redirected here with
 * a ?code= query parameter. This component:
 *  1. Reads the authorization code from the URL
 *  2. Sends it to POST /api/auth/github on the backend
 *  3. Receives { access_token, user } back
 *  4. Stores the token + user via AuthContext
 *  5. Redirects to the dashboard
 *
 * Dev-mode fallback:
 *  If the backend is unreachable (common during frontend-first development),
 *  a mock token is generated so the auth flow can be tested end-to-end.
 */

const DEV_MODE = import.meta.env.DEV

export default function Callback() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuth()
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('Authenticating…')
  const hasExchanged = useRef(false)

  useEffect(() => {
    // Prevent double-fire in StrictMode
    if (hasExchanged.current) return
    hasExchanged.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorParam = params.get('error')

    // GitHub may redirect with ?error= if the user denies access
    if (errorParam) {
      setError(
        `GitHub authorization denied: ${params.get('error_description') || errorParam}`,
      )
      return
    }

    if (!code) {
      setError('No authorization code received from GitHub.')
      return
    }

    async function exchangeCode() {
      try {
        setStatus('Exchanging authorization code…')

        const response = await apiClient.post('/api/auth/github', { code })
        const { access_token, user } = response.data

        if (!access_token) {
          throw new Error('No access_token in server response.')
        }

        setToken(access_token)
        if (user) {
          setUser(user)
        }

        setStatus('Success! Redirecting…')

        // Brief pause so the user sees the success state
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 400)
      } catch (err) {
        // ── Dev-mode fallback ────────────────────────────────────────────
        // If the backend isn't running yet, simulate a successful exchange
        // so the frontend auth flow can be tested independently.
        if (DEV_MODE && (isNetworkError(err) || err?.status === 500)) {
          console.warn(
            '[Callback] Backend OAuth not configured — using dev-mode mock token.',
          )

          const mockToken = `dev_mock_token_${Date.now()}`
          const mockUser = {
            login: 'dev-user',
            avatar_url: '',
            name: 'Developer',
          }

          setToken(mockToken)
          setUser(mockUser)
          setStatus('Success! (mock mode) Redirecting…')

          setTimeout(() => {
            navigate('/', { replace: true })
          }, 600)
          return
        }

        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to exchange authorization code.'
        setError(msg)
      }
    }

    exchangeCode()
  }, [navigate, setToken, setUser])

  const handleRetry = () => {
    navigate('/login', { replace: true })
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="callback-page">
        <div className="callback-card callback-card--error">
          <div className="callback-error-icon" aria-hidden="true">✕</div>
          <h1 className="callback-card__title">Authentication Failed</h1>
          <p className="callback-card__message">
            We couldn&apos;t complete the GitHub sign-in.
          </p>
          <div className="callback-card__error-detail">{error}</div>
          <button
            id="callback-retry-btn"
            className="callback-card__retry-btn"
            onClick={handleRetry}
            type="button"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    )
  }

  // ── Loading state (exchanging code) ────────────────────────────────────
  return (
    <div className="callback-page">
      <div className="callback-card">
        <div className="callback-spinner" aria-label="Authenticating" />
        <h1 className="callback-card__title">{status}</h1>
        <p className="callback-card__message">
          Verifying your GitHub authorization. This will only take a moment.
        </p>
        <div className="callback-progress">
          <div className="callback-progress__bar" />
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Detect if an error is a network / connection failure
 * (as opposed to a 4xx/5xx from a reachable server).
 */
function isNetworkError(err) {
  if (!err) return false
  // Axios network errors have no response
  if (!err.response && (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED')) {
    return true
  }
  // Our custom ApiError with status 0 means no response
  if (err.status === 0) return true
  return false
}
