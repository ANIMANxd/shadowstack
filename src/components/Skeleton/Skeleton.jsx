import './Skeleton.css'

/**
 * Skeleton – loading placeholder components.
 * Renders shimmer-animated blocks that match the dashboard layout.
 */

export function SkeletonKpiStrip() {
    return (
        <div className="skeleton-kpi-grid" aria-label="Loading KPI data">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-line skeleton-line--sm" style={{ width: '60%' }} />
                    <div className="skeleton-line skeleton-line--lg" style={{ width: '45%' }} />
                    <div className="skeleton-line skeleton-line--xs" style={{ width: '70%' }} />
                </div>
            ))}
        </div>
    )
}

export function SkeletonChart() {
    return (
        <div className="skeleton-chart" aria-label="Loading chart">
            <div className="skeleton-line skeleton-line--sm" style={{ width: '30%' }} />
            <div className="skeleton-line skeleton-line--xs" style={{ width: '50%' }} />
            <div className="skeleton-chart__area" />
        </div>
    )
}

export function SkeletonList({ rows = 4 }) {
    return (
        <div className="skeleton-list" aria-label="Loading data">
            <div className="skeleton-line skeleton-line--sm" style={{ width: '25%' }} />
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="skeleton-list__row">
                    <div className="skeleton-dot" />
                    <div className="skeleton-line skeleton-line--sm" style={{ flex: 1 }} />
                    <div className="skeleton-line skeleton-line--sm" style={{ width: '50px' }} />
                </div>
            ))}
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="dashboard-skeleton" role="alert" aria-busy="true" aria-label="Loading dashboard">
            <div className="skeleton-line skeleton-line--xs" style={{ width: '60px', marginBottom: '4px' }} />
            <div className="skeleton-line skeleton-line--xl" style={{ width: '220px', marginBottom: '4px' }} />
            <div className="skeleton-line skeleton-line--xs" style={{ width: '300px', marginBottom: '24px' }} />

            <SkeletonKpiStrip />

            <div className="skeleton-charts-row">
                <SkeletonChart />
                <SkeletonList rows={5} />
            </div>

            <div className="skeleton-bottom-row">
                <SkeletonChart />
                <SkeletonList rows={3} />
                <SkeletonList rows={4} />
            </div>
        </div>
    )
}
