import './ErrorBanner.css'

/**
 * ErrorBanner – contextual error display for the dashboard.
 *
 * Props:
 *  - error      : Error | ApiError | null
 *  - onDismiss  : () => void
 *  - onRetry    : () => void
 */
export default function ErrorBanner({ error, onDismiss, onRetry }) {
    if (!error) return null

    const message = error.userMessage || error.message || 'An unexpected error occurred'

    return (
        <div className="error-banner" role="alert">
            <div className="error-banner__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <div className="error-banner__content">
                <p className="error-banner__title">Unable to load dashboard data</p>
                <p className="error-banner__message">{message}</p>
            </div>
            <div className="error-banner__actions">
                <button className="error-banner__btn error-banner__btn--retry" onClick={onRetry}>
                    Retry
                </button>
                <button className="error-banner__btn error-banner__btn--dismiss" onClick={onDismiss}>
                    Dismiss
                </button>
            </div>
        </div>
    )
}
