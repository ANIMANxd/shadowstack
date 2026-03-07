import { useState } from 'react'
import D3Chart from '../../components/D3Chart/D3Chart'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import PredictionChart from '../../components/PredictionChart/PredictionChart'
import ConfidenceWidget from '../../components/ConfidenceWidget/ConfidenceWidget'
import { useDashboardData } from '../../hooks/useApi'
import type { KpiItem, AlertItem as AlertItemType, Severity } from '../../data/mockData'
import './Dashboard.css'

// ── KPI Icons ─────────────────────────────────────────────────────────────────
const icons: Record<string, string> = {
    'total-spend': '💸',
    'predicted-30d': '🔮',
    'savings': '✅',
    'efficiency-score': '⚡',
}

const ArrowUp = (): JSX.Element => <span aria-hidden="true">▲</span>
const ArrowDown = (): JSX.Element => <span aria-hidden="true">▼</span>

const severityClass: Record<Severity, string> = {
    high: 'badge--red',
    medium: 'badge--amber',
    low: 'badge--blue',
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ h, r }: { h: number | string; r?: number }): JSX.Element {
    return (
        <div
            className="skeleton"
            style={{ height: h, borderRadius: r ?? 10 }}
            aria-hidden="true"
        />
    )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ id, label, value, delta, direction, period, iconBg, iconColor }: KpiItem): JSX.Element {
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

function KpiCardSkeleton(): JSX.Element {
    return (
        <article className="kpi-card" aria-hidden="true">
            <Skeleton h={14} r={6} />
            <Skeleton h={32} r={8} />
            <Skeleton h={12} r={6} />
        </article>
    )
}

// ── Alert Item ────────────────────────────────────────────────────────────────
function AlertItem({ severity, message, time }: AlertItemType): JSX.Element {
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

// ── Range types ───────────────────────────────────────────────────────────────
type Range = '7D' | '30D' | '90D'
const rangeMap: Record<Range, number> = { '7D': 7, '30D': 30, '90D': 30 }

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function Dashboard(): JSX.Element {
    const [activeRange, setActiveRange] = useState<Range>('30D')
    const ranges: Range[] = ['7D', '30D', '90D']

    const { data, isLoading, isLive, lastUpdated, refresh } = useDashboardData()

    const visibleCostTrend = data?.costTrend.slice(-rangeMap[activeRange]) ?? []

    return (
        <section aria-labelledby="dashboard-title">
            {/* ── Page header ── */}
            <header className="page-header">
                <p className="page-header__eyebrow">Overview</p>
                <h1 className="page-header__title" id="dashboard-title">Cost Intelligence</h1>
                <p className="page-header__subtitle">
                    Real-time cloud spend analytics and predictive forecasting &mdash; Mar 2026
                </p>
                <StatusBadge
                    isLive={isLive}
                    lastUpdated={lastUpdated}
                    onRefresh={refresh}
                    isLoading={isLoading}
                />
            </header>

            {/* ── KPI Strip ── */}
            <div className="dashboard__kpi-grid" role="list" aria-label="Key performance indicators">
                {isLoading
                    ? [1, 2, 3, 4].map(i => <KpiCardSkeleton key={i} />)
                    : data?.kpis.map(kpi => <KpiCard key={kpi.id} {...kpi} />)
                }
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
                        {isLoading
                            ? <Skeleton h="100%" />
                            : <D3Chart
                                data={visibleCostTrend}
                                color="var(--clr-primary)"
                                label="USD / day"
                                formatValue={v => `$${v.toLocaleString()}`}
                            />
                        }
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
                        {isLoading
                            ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={36} />)
                            : data?.serviceSpend.map(s => (
                                <div key={s.name} className="resource-list__item" role="listitem">
                                    <span className="resource-list__dot" style={{ background: s.color }} aria-hidden="true" />
                                    <span className="resource-list__name">{s.name}</span>
                                    <div className="resource-list__bar-wrap" aria-hidden="true">
                                        <div className="resource-list__bar" style={{ width: `${s.pct}%`, background: s.color }} />
                                    </div>
                                    <span className="resource-list__cost">${s.cost.toLocaleString()}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>

            </div>

            {/* ── Bottom Row ── */}
            <div className="dashboard__bottom-row">

                {/* ML Forecast – PredictionChart replaces Sprint 1 shimmer */}
                <div className="widget widget--forecast">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">ML Forecast</p>
                            <h2 className="widget__title">30-Day Prediction</h2>
                            <p className="widget__subtitle">
                                {data?.prediction.model_name ?? 'Loading model…'}
                            </p>
                        </div>
                    </div>

                    {/* Confidence ring + stats */}
                    <ConfidenceWidget
                        prediction={data?.prediction ?? {
                            forecast: [], ci_upper: [], ci_lower: [],
                            confidence: 0, trend_direction: 'stable',
                            predicted_total: 0, model_name: '', generated_at: new Date()
                        }}
                        isLoading={isLoading}
                    />

                    {/* D3 Prediction chart */}
                    <div className="widget__chart-area">
                        {isLoading || !data
                            ? <Skeleton h="100%" />
                            : <PredictionChart
                                historicalData={data.costTrend}
                                prediction={data.prediction}
                            />
                        }
                    </div>
                </div>

                {/* Alerts */}
                <div className="widget">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Anomaly Detection</p>
                            <h2 className="widget__title">Recent Alerts</h2>
                        </div>
                        <span
                            className="badge badge--red"
                            aria-label={`${data?.alerts.length ?? 0} active alerts`}
                        >
                            {isLoading ? '…' : data?.alerts.length}
                        </span>
                    </div>
                    <ul aria-label="Alert list">
                        {isLoading
                            ? [1, 2, 3].map(i => <li key={i} style={{ marginBottom: 'var(--space-2)' }}><Skeleton h={52} /></li>)
                            : data?.alerts.map(a => <AlertItem key={a.id} {...a} />)
                        }
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
                        {isLoading
                            ? [1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={36} />)
                            : data?.topResources.map(r => (
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
                            ))
                        }
                    </div>
                </div>

            </div>
        </section>
    )
}
