/**
 * StatusBadge – shows whether dashboard data is coming from
 * the live FastAPI backend (green) or the mock fallback (amber).
 */
import './StatusBadge.css'

interface StatusBadgeProps {
    isLive: boolean
    lastUpdated: Date | null
    onRefresh: () => void
    isLoading: boolean
}

function fmt(d: Date): string {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function StatusBadge({ isLive, lastUpdated, onRefresh, isLoading }: StatusBadgeProps): JSX.Element {
    return (
        <div className="status-bar">
            <span className={`status-badge ${isLive ? 'status-badge--live' : 'status-badge--mock'}`}>
                <span className="status-badge__dot" aria-hidden="true" />
                {isLive ? 'LIVE' : 'MOCK DATA'}
            </span>

            {lastUpdated && (
                <span className="status-bar__time">
                    Updated {fmt(lastUpdated)}
                </span>
            )}

            <button
                className={`status-bar__refresh${isLoading ? ' status-bar__refresh--spinning' : ''}`}
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Refresh data"
                title="Refresh"
            >
                ↻
            </button>
        </div>
    )
}
