import { useState } from 'react'
import D3Chart from '../../components/D3Chart/D3Chart'
import {
    KPI_DATA,
    COST_TREND_DATA,
    SERVICE_SPEND,
    RECENT_ALERTS,
    TOP_RESOURCES,
} from '../../data/mockData'
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

    // Filter trend data by active range
    const rangeMap = { '7D': 7, '30D': 30, '90D': 30 }
    const visibleData = COST_TREND_DATA.slice(-rangeMap[activeRange])

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
                {KPI_DATA.map(kpi => (
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
                        {SERVICE_SPEND.map(s => (
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

                {/* Forecast placeholder */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">ML Forecast</p>
                            <h2 className="widget__title">30-Day Prediction</h2>
                            <p className="widget__subtitle">Connects in Sprint 2</p>
                        </div>
                    </div>
                    <div className="widget__chart-area">
                        <div className="placeholder-shimmer" data-label="📈  Predictive chart coming in Sprint 2" />
                    </div>
                </div>

                {/* Alerts */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Anomaly Detection</p>
                            <h2 className="widget__title">Recent Alerts</h2>
                        </div>
                        <span className="badge badge--red" aria-label="3 active alerts">3</span>
                    </div>
                    <ul aria-label="Alert list">
                        {RECENT_ALERTS.map(a => <AlertItem key={a.id} {...a} />)}
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
                        {TOP_RESOURCES.map(r => (
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
