import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

/**
 * Login – GitHub OAuth entry point for ShadowStack.
 *
 * Renders a polished sign-in page with:
 *  - Animated ambient background
 *  - "Sign in with GitHub" OAuth button
 *  - Scope badges showing requested permissions
 *  - Feature callouts for first-time users
 *  - Automatic redirect if already authenticated
 *
 * On click, the user is sent to GitHub's authorization URL.
 * After authorization, GitHub redirects to /callback with ?code=.
 */

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID
const REDIRECT_URI = `${window.location.origin}/callback`
const SCOPES = 'repo admin:repo_hook'

const GITHUB_AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
  GITHUB_CLIENT_ID || '',
)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`

// ── Inline SVGs ────────────────────────────────────────────────────────────

const GitHubMark = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const GitPrIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M13 6h3a2 2 0 0 1 2 2v7M6 9v12" />
  </svg>
)

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

// ── Feature highlights for first-time users ────────────────────────────────

const FEATURES = [
  {
    Icon: GitPrIcon,
    title: 'PR Cost Prediction',
    desc: 'Know the cost before you merge',
  },
  {
    Icon: ChartIcon,
    title: 'Trend Analysis',
    desc: 'Visualize spend across services',
  },
  {
    Icon: ShieldIcon,
    title: 'Webhook Automation',
    desc: 'Auto-analyze every pull request',
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export default function Login() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // If already authenticated, redirect to intended destination or dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location.state])

  const handleLogin = () => {
    if (!GITHUB_CLIENT_ID) {
      console.error(
        '[Login] VITE_GITHUB_CLIENT_ID is not set. Add it to your .env file.',
      )
      return
    }
    window.location.href = GITHUB_AUTH_URL
  }

  return (
    <div className="login-page">
      {/* Animated grid background */}
      <div className="login-grid" aria-hidden="true" />

      <div className="login-card">
        {/* Brand */}
        <div className="login-card__logo" aria-hidden="true">⚡</div>
        <h1 className="login-card__title">ShadowStack</h1>
        <p className="login-card__subtitle">
          Predict the cost impact of every pull request before it merges.
          Connect your GitHub to get started.
        </p>

        {/* OAuth button */}
        <button
          id="github-login-btn"
          className="login-card__github-btn"
          onClick={handleLogin}
          type="button"
        >
          <GitHubMark />
          Sign in with GitHub
        </button>

        {/* Permission scopes */}
        <div className="login-card__scopes">
          <span className="login-card__scope-tag">🔒 repo</span>
          <span className="login-card__scope-tag">🪝 admin:repo_hook</span>
        </div>

        {/* Divider */}
        <div className="login-card__divider" />

        {/* Feature highlights */}
        <div className="login-card__features">
          {FEATURES.map(({ Icon, title, desc }) => ( // eslint-disable-line no-unused-vars
            <div className="login-feature" key={title}>
              <div className="login-feature__icon">
                <Icon />
              </div>
              <div className="login-feature__text">
                <span className="login-feature__title">{title}</span>
                <span className="login-feature__desc">{desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="login-card__footer">
          By continuing, you authorize ShadowStack to access your repositories
          and manage webhooks for cost prediction analysis.
        </p>
      </div>
    </div>
  )
}
