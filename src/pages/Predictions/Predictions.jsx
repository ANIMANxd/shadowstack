import React, { useMemo } from 'react'
import { useDashboardData } from '../../hooks/useDashboardData'
import GlobalFilters from '../../components/GlobalFilters/GlobalFilters'
import GroupedBarChart from '../../components/GroupedBarChart/GroupedBarChart'
import ModelMetrics from '../../components/ModelMetrics/ModelMetrics'
import StatusBar from '../../components/StatusBar/StatusBar'
import ErrorBanner from '../../components/ErrorBanner/ErrorBanner'
import { DashboardSkeleton } from '../../components/Skeleton/Skeleton'
import './Predictions.css'

export default function Predictions() {
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

    // ── Generate Variance Data ────────────────────────────────────────────────
    // We combine recent historical data and predicted data.
    // For a real app, this would come from a dedicated `/variance` endpoint.
    const varianceData = useMemo(() => {
        if (!data?.historicalCosts?.daily || !data?.predictedCosts?.forecast) return []
        
        const actuals = data.historicalCosts.daily
        const predictions = data.predictedCosts.forecast

        // Take the last 7 common days (faked via array matching for mockup)
        const count = Math.min(7, actuals.length)
        const combined = []
        
        for (let i = 0; i < count; i++) {
            const a = actuals[actuals.length - count + i]
            // We use standard prediction bounds or just simulate a previous prediction
            // since our mock prediction data is actually future data.
            const fakePreviousPrediction = a.value * (1 + (Math.random() * 0.2 - 0.1))

            combined.push({
                label: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                actual: a.value,
                predicted: Math.round(fakePreviousPrediction)
            })
        }
        return combined
    }, [data])

    if (isLoading && !data) {
        return (
            <section aria-labelledby="predictions-title">
                <DashboardSkeleton />
            </section>
        )
    }

    const mlMetrics = data?.mlMetrics || { models: [], activeModelId: '' }

    return (
        <section aria-labelledby="predictions-title" className="predictions-page">
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
                <p className="page-header__eyebrow">Predictions</p>
                <h1 className="page-header__title" id="predictions-title">Model Performance</h1>
                <p className="page-header__subtitle">
                    Evaluate ML forecasting accuracy against actual spend across your environments.
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

            <div className="predictions__grid">
                {/* Variance Chart */}
                <div className="widget predictions__main-chart">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Variance</p>
                            <h2 className="widget__title">Predicted vs. Actual Cost</h2>
                            <p className="widget__subtitle">Recent variance tracking</p>
                        </div>
                    </div>
                    <div className="widget__chart-area" style={{ minHeight: '340px' }}>
                        {varianceData.length > 0 ? (
                            <GroupedBarChart data={varianceData} />
                        ) : (
                            <div className="placeholder-shimmer" data-label="📈 No data available" />
                        )}
                    </div>
                </div>

                {/* ML Metrics Panel */}
                <div className="widget predictions__metrics-panel">
                    <div className="widget__header">
                        <div className="widget__title-group">
                            <p className="widget__label">Model Evaluation</p>
                            <h2 className="widget__title">Scoring Metrics</h2>
                        </div>
                    </div>
                    <ModelMetrics
                        models={mlMetrics.models}
                        activeModelId={mlMetrics.activeModelId}
                    />
                </div>
            </div>
        </section>
    )
}
