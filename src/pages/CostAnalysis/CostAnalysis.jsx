import React from 'react'
import { useDashboardData } from '../../hooks/useDashboardData'
import GlobalFilters from '../../components/GlobalFilters/GlobalFilters'
import ForecastChart from '../../components/ForecastChart/ForecastChart'
import DonutChart from '../../components/DonutChart/DonutChart'
import StatusBar from '../../components/StatusBar/StatusBar'
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner'
import { DashboardSkeleton } from '../../components/Skeleton/Skeleton'
import './CostAnalysis.css'

export default function CostAnalysis() {
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
    } = useDashboardData()

    if (isLoading && !data) {
        return (
            <section aria-labelledby="cost-analysis-title">
                <DashboardSkeleton />
            </section>
        )
    }

    const historicalCosts = data?.historicalCosts?.daily || []
    const predictedCosts = data?.predictedCosts || { forecast: [], confidenceLevel: 0.95 }
    const services = data?.serviceBreakdown?.services || []
    const serviceTotal = data?.serviceBreakdown?.total || 0

    // Prepare data
    const donutData = services.map(s => ({
        name: s.name,
        cost: s.cost,
        percentage: s.percentage,
        color: s.color,
    }))

    return (
        <section aria-labelledby="cost-analysis-title" className="cost-analysis-page">
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

            <ErrorBanner
                error={error}
                onDismiss={clearError}
                onRetry={refresh}
            />

            <header className="page-header">
                <p className="page-header__eyebrow">Cost Analysis</p>
                <h1 className="page-header__title" id="cost-analysis-title">Trend Insights</h1>
                <p className="page-header__subtitle">
                    Drill into per-service spend breakdowns and historical vs predicted trajectories.
                    {lastUpdated && (
                        <span className="page-header__timestamp">
                            &nbsp;&mdash;&nbsp;{new Date(lastUpdated).toLocaleDateString('en-US', {
                                month: 'short', year: 'numeric',
                            })}
                        </span>
                    )}
                </p>
            </header>

            {/* Global Filters */}
            <GlobalFilters />

            <div className="cost-analysis__grid">
                {/* Cost Trend Line Chart */}
                <div className="widget cost-analysis__main-chart">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Spend Trend</p>
                            <h2 className="widget__title">Actual vs Predicted Series</h2>
                            <p className="widget__subtitle">Historical actuals merged with ML bounds</p>
                        </div>
                    </div>
                    <div className="widget__chart-area" style={{ minHeight: '340px' }}>
                        {historicalCosts.length > 0 || predictedCosts.forecast.length > 0 ? (
                            <ForecastChart
                                data={predictedCosts.forecast}
                                historical={historicalCosts}
                                color="#63b3ed"
                                confidence={predictedCosts.confidenceLevel}
                            />
                        ) : (
                            <div className="placeholder-shimmer" data-label="📈 No data available" />
                        )}
                    </div>
                </div>

                {/* Service Breakdown Donut */}
                <div className="widget cost-analysis__side-chart">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Breakdown</p>
                            <h2 className="widget__title">Service Cost Distribution</h2>
                        </div>
                    </div>
                    <DonutChart
                        data={donutData}
                        total={serviceTotal}
                        label="Total Spend"
                        thickness={32}
                    />
                    <div className="donut-legend list-scroll">
                        {services.map(s => (
                            <div key={s.name} className="donut-legend__item" role="listitem">
                                <span className="donut-legend__dot" style={{ background: s.color }} />
                                <span className="donut-legend__name">{s.name}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                                    <span className="donut-legend__value">${s.cost.toLocaleString()}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--clr-text-muted)'}}>{s.percentage}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
