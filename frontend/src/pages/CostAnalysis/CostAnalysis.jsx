import { useState } from 'react'
import useDashboardData from '../../hooks/useDashboardData'
import D3Chart from '../../components/D3Chart/D3Chart'
import './CostAnalysis.css'

/**
 * CostAnalysis – PR-driven cost analysis page.
 *
 * Displays historical cost data broken down by service,
 * with drill-down by repository and time range.
 */
export default function CostAnalysis() {
  const { data, isLoading, error } = useDashboardData()
  const [activeRange, setActiveRange] = useState('30D')
  const ranges = ['7D', '30D', '90D']

  if (isLoading && !data) {
    return (
      <section className="cost-analysis-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }} aria-live="polite">
        <div className="spinner-large" aria-label="Loading cost data..." />
      </section>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error loading cost data</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  // Compute real summary metrics from predictions data
  const predictions = data?.predictions || []
  const totalPredicted = predictions.reduce((sum, p) => sum + (p.predicted_cost_usd || 0), 0)
  const totalBaseline = predictions.reduce((sum, p) => sum + (p.baseline_cost_usd || 0), 0)
  const totalDelta = predictions.reduce((sum, p) => sum + (p.delta_usd || 0), 0)
  const avgPerPR = predictions.length > 0 ? totalPredicted / predictions.length : 0

  // Find top service by predicted cost
  const serviceMap = {}
  predictions.forEach(p => {
    const svc = p.service_name || 'Other'
    serviceMap[svc] = (serviceMap[svc] || 0) + (p.predicted_cost_usd || 0)
  })
  const topServiceEntry = Object.entries(serviceMap).sort((a, b) => b[1] - a[1])[0]
  const topServiceName = topServiceEntry ? topServiceEntry[0] : 'N/A'
  const topServiceCost = topServiceEntry ? topServiceEntry[1] : 0

  // Filter trend data by active range safely
  const rangeMap = { '7D': 7, '30D': 30, '90D': 30 }
  const visibleData = data?.historicalCosts ? data.historicalCosts.slice(-rangeMap[activeRange]) : []

  return (
    <section aria-labelledby="costs-title">
      <header className="page-header">
        <p className="page-header__eyebrow">Analytics</p>
        <h1 className="page-header__title" id="costs-title">Cost Analysis</h1>
        <p className="page-header__subtitle">
          Historical cost breakdown by service, repository, and time range.
        </p>
      </header>

      <div className="cost-analysis__grid">
        {/* Summary cards — now using REAL data */}
        <div className="cost-analysis__card">
          <div className="cost-analysis__card-header">
            <span className="cost-analysis__card-label">Total Predicted</span>
            <span className="cost-analysis__card-icon" aria-hidden="true">💰</span>
          </div>
          <div className="cost-analysis__card-value">${totalPredicted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className={`cost-analysis__card-delta ${totalDelta >= 0 ? 'cost-analysis__card-delta--up' : 'cost-analysis__card-delta--down'}`}>
            {totalDelta >= 0 ? '▲' : '▼'} {Math.abs(totalDelta).toLocaleString(undefined, { maximumFractionDigits: 0 })} vs baseline
          </div>
        </div>

        <div className="cost-analysis__card">
          <div className="cost-analysis__card-header">
            <span className="cost-analysis__card-label">Avg per PR</span>
            <span className="cost-analysis__card-icon" aria-hidden="true">📊</span>
          </div>
          <div className="cost-analysis__card-value">${avgPerPR.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div className="cost-analysis__card-delta">
            Across {predictions.length} prediction{predictions.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="cost-analysis__card">
          <div className="cost-analysis__card-header">
            <span className="cost-analysis__card-label">Top Service</span>
            <span className="cost-analysis__card-icon" aria-hidden="true">☁️</span>
          </div>
          <div className="cost-analysis__card-value" style={{ textTransform: 'capitalize' }}>{topServiceName}</div>
          <div className="cost-analysis__card-delta">${topServiceCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} predicted</div>
        </div>
      </div>

      {/* Real cost trend chart */}
      <div className="widget">
        <div className="widget__header">
          <div className="widget__title-group">
            <p className="widget__label">Trend</p>
            <h2 className="widget__title">Cost Over Time</h2>
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
          {visibleData.length > 1 ? (
            <D3Chart
              data={visibleData}
              color="var(--clr-primary)"
              label="USD / day"
              formatValue={v => `$${v.toLocaleString()}`}
            />
          ) : (
            <div className="placeholder-shimmer" data-label="📈  Interactive cost chart — connect a repo to populate" />
          )}
        </div>
      </div>
    </section>
  )
}
