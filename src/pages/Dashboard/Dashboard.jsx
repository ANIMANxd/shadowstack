import { useState } from 'react'
import { useDashboardData } from '../../hooks/useDashboardData'
import D3Chart from '../../components/D3Chart/D3Chart'
import ForecastChart from '../../components/ForecastChart/ForecastChart'
import DonutChart from '../../components/DonutChart/DonutChart'
import ModelMetrics from '../../components/ModelMetrics/ModelMetrics'
import StatusBar from '../../components/StatusBar/StatusBar'
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner'
import { DashboardSkeleton } from '../../components/Skeleton/Skeleton'
import './Dashboard.css'

// ── KPI Icons ─────────────────────────────────────────────────────────────────
const icons = {
    'total-spend': '💸',
    'predicted-30d': '🔮',
    'savings': '✅',
    'efficiency-score': '⚡',
}

const ArrowUp = () => <span aria-hidden="true">▲</span>
const ArrowDown = () => <span aria-hidden="true">▼</span>

// Severity → badge class
const severityClass = { high: 'badge--red', medium: 'badge--amber', low: 'badge--blue' }

// ── Sub-components ─────────────────────────────────────────────────────────────
function KpiCard({ id, label, value, delta, direction, period, iconBg, iconColor }) {
    return (
        <article className="kpi-card" aria-label={label}>
            <div className="kpi-card__top">
                <span className="kpi-card__label">{label}</span>
                <span className="kpi-card__icon" style={{ background: iconBg, color: iconColor }} aria-hidden="true">
                    {icons[id]}
                </span>
            </div>
            <div className="kpi-card__value">{value}</div>
            <div className={`kpi-card__delta kpi-card__delta--${direction === 'up' ? 'up' : 'down'}`}>
                {direction === 'up' ? <ArrowUp /> : <ArrowDown />}
                <span>{delta}</span>
                <span style={{ fontWeight: 400, color: 'var(--clr-text-muted)' }}>{period}</span>
            </div>
        </article>
    )
}

function AlertItem({ severity, message, time }) {
    return (
        <li style={{
            display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
            padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
            background: 'var(--clr-bg-elevated)', marginBottom: 'var(--space-2)',
        }}>
            <span className={`badge ${severityClass[severity]}`} style={{ flexShrink: 0, marginTop: 1 }}>
                {severity}
            </span>
            <span style={{ flex: 1, fontSize: 'var(--fs-sm)', color: 'var(--clr-text-primary)' }}>
                {message}
            </span>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', flexShrink: 0 }}>
                {time}
            </span>
        </li>
    )
}

// ── Main Dashboard Page ────────────────────────────────────────────────────────
export default function Dashboard() {
    const [activeRange, setActiveRange] = useState('30D')
    const ranges = ['7D', '30D', '90D']

    // ── Real-time data from useDashboardData hook ─────────────────────────────
    const {
        data,
        isLoading,
        isRefreshing,
        error,
        lastUpdated,
        isPolling,
        errorCount,
        refresh,
        pause,
        resume,
        clearError,
    } = useDashboardData({ pollingInterval: 30000 })

    // ── Loading state ─────────────────────────────────────────────────────────
    if (isLoading && !data) {
        return (
            <section aria-labelledby="dashboard-title">
                <DashboardSkeleton />
            </section>
        )
    }

    // Destructure the live data (with safe fallbacks)
    const kpis = data?.kpis?.kpis || []
    const historicalCosts = data?.historicalCosts?.daily || []
    const predictedCosts = data?.predictedCosts || { forecast: [], confidenceLevel: 0.95 }
    const mlMetrics = data?.mlMetrics || { models: [], activeModelId: '' }
    const services = data?.serviceBreakdown?.services || []
    const serviceTotal = data?.serviceBreakdown?.total || 0
    const alerts = data?.alerts?.alerts || []
    const alertCount = data?.alerts?.activeCount || 0
    const topResources = data?.topResources?.resources || []

    // Convert historical cost data for D3Chart (needs Date objects)
    const costTrendData = historicalCosts.map(d => ({
        date: new Date(d.date),
        value: d.value,
    }))

    // Filter trend data by active range
    const rangeMap = { '7D': 7, '30D': 30, '90D': 90 }
    const visibleData = costTrendData.slice(-rangeMap[activeRange])

    // Convert service data for DonutChart
    const donutData = services.map(s => ({
        name: s.name,
        cost: s.cost,
        percentage: s.percentage,
        color: s.color,
    }))

    return (
        <section aria-labelledby="dashboard-title">
            {/* Status bar with polling controls */}
            <StatusBar
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                isPolling={isPolling}
                lastUpdated={lastUpdated}
                errorCount={errorCount}
                error={error}
                onRefresh={refresh}
                onPause={pause}
                onResume={resume}
            />

            {/* Error banner (if any) */}
            <ErrorBanner
                error={error}
                onDismiss={clearError}
                onRetry={refresh}
            />

            {/* Page header */}
            <header className="page-header">
                <p className="page-header__eyebrow">Overview</p>
                <h1 className="page-header__title" id="dashboard-title">Cost Intelligence</h1>
                <p className="page-header__subtitle">
                    Real-time cloud spend analytics and predictive forecasting
                    {lastUpdated && (
                        <span className="page-header__timestamp">
                            &nbsp;&mdash;&nbsp;{new Date(lastUpdated).toLocaleDateString('en-US', {
                                month: 'short', year: 'numeric',
                            })}
                        </span>
                    )}
                </p>
            </header>

            {/* ── KPI Strip ── */}
            <div className="dashboard__kpi-grid" role="list" aria-label="Key performance indicators">
                {kpis.map(kpi => (
                    <KpiCard key={kpi.id} {...kpi} />
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div className="dashboard__charts-row">

                {/* Main spend trend chart */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Spend Trend</p>
                            <h2 className="widget__title">Daily Cloud Expenditure</h2>
                            <p className="widget__subtitle">Live D3.js area chart with gradient fill</p>
                        </div>
                        <div className="widget__actions" role="group" aria-label="Date range">
                            {ranges.map(r => (
                                <button
                                    key={r}
                                    className={`widget__pill-btn${activeRange === r ? ' active' : ''}`}
                                    onClick={() => setActiveRange(r)}
                                    aria-pressed={activeRange === r}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="widget__chart-area">
                        <D3Chart
                            data={visibleData}
                            color="var(--clr-primary)"
                            label="USD / day"
                            formatValue={v => `$${v.toLocaleString()}`}
                        />
                    </div>
                </div>

                {/* Service breakdown – Donut chart + legend */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Breakdown</p>
                            <h2 className="widget__title">By Service</h2>
                        </div>
                    </div>
                    <DonutChart
                        data={donutData}
                        total={serviceTotal}
                        label="Total Spend"
                    />
                    {/* Legend below donut */}
                    <div className="donut-legend" role="list">
                        {services.map(s => (
                            <div key={s.name} className="donut-legend__item" role="listitem">
                                <span className="donut-legend__dot" style={{ background: s.color }} />
                                <span className="donut-legend__name">{s.name}</span>
                                <span className="donut-legend__value">${s.cost.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── Middle Row: Forecast + ML Metrics ── */}
            <div className="dashboard__mid-row">

                {/* ML forecast chart */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">ML Forecast</p>
                            <h2 className="widget__title">30-Day Prediction</h2>
                            <p className="widget__subtitle">
                                {predictedCosts.forecast.length > 0
                                    ? `Model: ${data?.predictedCosts?.modelVersion || 'Unknown'}`
                                    : 'Awaiting model data'}
                            </p>
                        </div>
                    </div>
                    <div className="widget__chart-area">
                        {predictedCosts.forecast.length > 0 ? (
                            <ForecastChart
                                data={predictedCosts.forecast}
                                historical={historicalCosts}
                                color="#9f7aea"
                                confidence={predictedCosts.confidenceLevel}
                            />
                        ) : (
                            <div className="placeholder-shimmer" data-label="📈  Waiting for forecast data" />
                        )}
                    </div>
                </div>

                {/* ML Model Metrics */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Model Performance</p>
                            <h2 className="widget__title">ML Metrics</h2>
                        </div>
                    </div>
                    <ModelMetrics
                        models={mlMetrics.models}
                        activeModelId={mlMetrics.activeModelId}
                    />
                </div>

            </div>

            {/* ── Bottom Row ── */}
            <div className="dashboard__bottom-row">

                {/* Alerts */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Anomaly Detection</p>
                            <h2 className="widget__title">Recent Alerts</h2>
                        </div>
                        <span className="badge badge--red" aria-label={`${alertCount} active alerts`}>
                            {alertCount}
                        </span>
                    </div>
                    <ul aria-label="Alert list">
                        {alerts.map(a => <AlertItem key={a.id} {...a} />)}
                    </ul>
                </div>

                {/* Top resources */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Resources</p>
                            <h2 className="widget__title">Top Cost Drivers</h2>
                        </div>
                    </div>
                    <div className="resource-list" role="list">
                        {topResources.map(r => (
                            <div key={r.id} className="resource-list__item" role="listitem">
                                <span className="resource-list__dot" style={{ background: r.color }} aria-hidden="true" />
                                <span className="resource-list__name">
                                    <span style={{ display: 'block', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{r.type}</span>
                                    {r.name}
                                </span>
                                <div className="resource-list__bar-wrap" aria-hidden="true">
                                    <div className="resource-list__bar" style={{ width: `${r.percentage}%`, background: r.color }} />
                                </div>
                                <span className="resource-list__cost">{r.cost}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    )
}
