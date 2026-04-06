import { useState, useEffect } from 'react'
import './StatusBar.css'

/**
 * StatusBar – real-time data status indicator.
 *
 * Shows polling status, last updated time, and refresh controls.
 *
 * Props:
 *  - isLoading     : boolean
 *  - isRefreshing  : boolean
 *  - isPolling     : boolean
 *  - lastUpdated   : string | null  (ISO timestamp)
 *  - errorCount    : number
 *  - error         : Error | null
 *  - onRefresh     : () => void
 *  - onPause       : () => void
 *  - onResume      : () => void
 */
export default function StatusBar({
    isLoading,
    isRefreshing,
    isPolling,
    lastUpdated,
    errorCount,
    error,
    onRefresh,
    onPause,
    onResume,
}) {
    const [relativeTime, setRelativeTime] = useState('')

    // Update relative time every 10 seconds
    useEffect(() => {
        if (!lastUpdated) return

        const update = () => {
            const diff = Date.now() - new Date(lastUpdated).getTime()
            const secs = Math.floor(diff / 1000)
            if (secs < 5) setRelativeTime('just now')
            else if (secs < 60) setRelativeTime(`${secs}s ago`)
            else {
                const mins = Math.floor(secs / 60)
                setRelativeTime(`${mins}m ago`)
            }
        }

        update()
        const timer = setInterval(update, 10000)
        return () => clearInterval(timer)
    }, [lastUpdated])

    const statusClass = error
        ? 'status-bar--error'
        : isRefreshing
            ? 'status-bar--refreshing'
            : isPolling
                ? 'status-bar--live'
                : 'status-bar--paused'

    return (
        <div className={`status-bar ${statusClass}`} role="status" aria-live="polite">
            {/* Left: status indicator */}
            <div className="status-bar__left">
                <span className="status-bar__dot" aria-hidden="true" />
                <span className="status-bar__label">
                    {isLoading ? 'Loading data…' :
                     error ? 'Connection error' :
                     isRefreshing ? 'Refreshing…' :
                     isPolling ? 'Live' : 'Paused'}
                </span>
                {lastUpdated && !isLoading && (
                    <span className="status-bar__time">
                        Updated {relativeTime}
                    </span>
                )}
                {errorCount > 0 && (
                    <span className="status-bar__error-count">
                        {errorCount} error{errorCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Right: controls */}
            <div className="status-bar__right">
                <button
                    className="status-bar__btn"
                    onClick={onRefresh}
                    disabled={isLoading || isRefreshing}
                    title="Refresh now"
                    aria-label="Refresh data"
                >
                    <RefreshIcon spinning={isRefreshing} />
                </button>
                <button
                    className="status-bar__btn"
                    onClick={isPolling ? onPause : onResume}
                    title={isPolling ? 'Pause auto-refresh' : 'Resume auto-refresh'}
                    aria-label={isPolling ? 'Pause polling' : 'Resume polling'}
                >
                    {isPolling ? <PauseIcon /> : <PlayIcon />}
                </button>
            </div>
        </div>
    )
}

// ── Inline icons ─────────────────────────────────────────────────────────────
function RefreshIcon({ spinning }) {
    return (
        <svg
            className={`status-bar__icon${spinning ? ' status-bar__icon--spin' : ''}`}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    )
}

function PauseIcon() {
    return (
        <svg className="status-bar__icon" width="14" height="14" viewBox="0 0 24 24"
            fill="currentColor" stroke="none">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
    )
}

function PlayIcon() {
    return (
        <svg className="status-bar__icon" width="14" height="14" viewBox="0 0 24 24"
            fill="currentColor" stroke="none">
            <polygon points="5,3 19,12 5,21" />
        </svg>
    )
}
