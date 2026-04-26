import { useState } from 'react'
import D3Chart from '../../components/D3Chart/D3Chart'
import useDashboardData from '../../hooks/useDashboardData'
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

function MetricRow({ label, value }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: 'var(--space-2) 0',
            borderBottom: '1px solid var(--clr-border)',
            fontSize: 'var(--fs-sm)',
        }}>
            <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
            <span style={{ fontWeight: 600, color: 'var(--clr-text-primary)' }}>{value}</span>
        </div>
    )
}

// ── Main Dashboard Page ────────────────────────────────────────────────────────
export default function Dashboard() {
    const [activeRange, setActiveRange] = useState('30D')
    const ranges = ['7D', '30D', '90D']
    const { data, isLoading, error } = useDashboardData()

    if (isLoading && !data) {
        return (
            <section className="dashboard-loading" aria-live="polite">
                <div className="spinner-large" aria-label="Loading dashboard data..." />
            </section>
        )
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <h2>Error loading dashboard</h2>
                <p>{error.message}</p>
            </div>
        )
    }

    // Filter trend data by active range safely
    const rangeMap = { '7D': 7, '30D': 30, '90D': 30 }
    const visibleData = data?.historicalCosts ? data.historicalCosts.slice(-rangeMap[activeRange]) : []

    // Build forecast overlay data if available
    const forecastData = []
    if (data?.forecast?.length && data?.historicalCosts?.length) {
        const lastHist = data.historicalCosts[data.historicalCosts.length - 1]
        const lastDate = new Date(lastHist.date)
        data.forecast.forEach((day) => {
            const d = new Date(lastDate)
            d.setDate(d.getDate() + day.day)
            forecastData.push({ date: d, value: day.predicted_cost_usd })
        })
    }

    const kpiData = data?.kpis || []
    const serviceSpend = data?.serviceBreakdown || []
    const recentAlerts = data?.alerts || []
    const topResources = data?.topResources || []
    const modelMetrics = data?.modelMetrics

    return (
        <section aria-labelledby="dashboard-title">
            {/* Page header */}
            <header className="page-header">
                <p className="page-header__eyebrow">Overview</p>
                <h1 className="page-header__title" id="dashboard-title">Cost Intelligence</h1>
                <p className="page-header__subtitle">
                    Real-time cloud spend analytics and predictive forecasting &mdash; Feb 2026
                </p>
            </header>

            {/* ── KPI Strip ── */}
            <div className="dashboard__kpi-grid" role="list" aria-label="Key performance indicators">
                {kpiData.map(kpi => (
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

                {/* Service breakdown */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Breakdown</p>
                            <h2 className="widget__title">By Service</h2>
                        </div>
                    </div>
                    <div className="resource-list" role="list">
                        {serviceSpend.map(s => (
                            <div key={s.name} className="resource-list__item" role="listitem">
                                <span className="resource-list__dot" style={{ background: s.color }} aria-hidden="true" />
                                <span className="resource-list__name">{s.name}</span>
                                <div className="resource-list__bar-wrap" aria-hidden="true">
                                    <div className="resource-list__bar" style={{ width: `${s.pct}%`, background: s.color }} />
                                </div>
                                <span className="resource-list__cost">${s.cost.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── Bottom Row ── */}
            <div className="dashboard__bottom-row">

                {/* 30-Day Forecast chart */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">ML Forecast</p>
                            <h2 className="widget__title">30-Day Prediction</h2>
                            <p className="widget__subtitle">LSTM-powered cost projection</p>
                        </div>
                    </div>
                    <div className="widget__chart-area">
                        {forecastData.length > 0 ? (
                            <D3Chart
                                data={forecastData}
                                color="#9f7aea"
                                label="Forecast USD"
                                formatValue={v => `$${v.toLocaleString()}`}
                            />
                        ) : (
                            <div className="placeholder-shimmer" data-label="📈  Run a prediction to generate 30-day LSTM forecast" />
                        )}
                    </div>
                </div>

                {/* Model Performance Metrics */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">ML Performance</p>
                            <h2 className="widget__title">Model Metrics</h2>
                        </div>
                    </div>
                    <div style={{ padding: 'var(--space-4)' }}>
                        {modelMetrics ? (
                            <>
                                <MetricRow label="Model Version" value={modelMetrics.model_version} />
                                <MetricRow label="Model Type" value={modelMetrics.model_type} />
                                <MetricRow label="MAE" value={modelMetrics.mae != null ? `$${modelMetrics.mae.toFixed(2)}` : 'N/A'} />
                                <MetricRow label="RMSE" value={modelMetrics.rmse != null ? `$${modelMetrics.rmse.toFixed(2)}` : 'N/A'} />
                                <MetricRow label="R² Score" value={modelMetrics.r2 != null ? modelMetrics.r2.toFixed(3) : 'N/A'} />
                                <MetricRow label="Dataset Size" value={modelMetrics.dataset_size != null ? `${modelMetrics.dataset_size.toLocaleString()} rows` : 'N/A'} />
                            </>
                        ) : (
                            <p style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-sm)' }}>
                                No model metrics available. Train a model to populate this panel.
                            </p>
                        )}
                    </div>
                </div>

                {/* Alerts */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Anomaly Detection</p>
                            <h2 className="widget__title">Recent Alerts</h2>
                        </div>
                        <span className="badge badge--red" aria-label={`${recentAlerts.length} active alerts`}>{recentAlerts.length}</span>
                    </div>
                    <ul aria-label="Alert list">
                        {recentAlerts.map(a => <AlertItem key={a.id} {...a} />)}
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
                                    <div className="resource-list__bar" style={{ width: `${r.pct}%`, background: r.color }} />
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
