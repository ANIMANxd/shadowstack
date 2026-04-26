import useDashboardData from '../../hooks/useDashboardData'
import './Reports.css'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString()
}

export default function Reports() {
  const { data, isLoading } = useDashboardData()
  const predictions = data?.predictions || []

  // Compute summary stats
  const totalPredicted = predictions.reduce((sum, p) => sum + (p.predicted_cost_usd || 0), 0)
  const totalBaseline = predictions.reduce((sum, p) => sum + (p.baseline_cost_usd || 0), 0)
  const totalDelta = predictions.reduce((sum, p) => sum + (p.delta_usd || 0), 0)
  const avgComplexity = predictions.length > 0
    ? (predictions.reduce((sum, p) => sum + (p.complexity_score || 0), 0) / predictions.length).toFixed(1)
    : '0.0'

  // Service breakdown
  const serviceMap = {}
  predictions.forEach(p => {
    const svc = p.service_name || 'Other'
    if (!serviceMap[svc]) serviceMap[svc] = { count: 0, cost: 0 }
    serviceMap[svc].count += 1
    serviceMap[svc].cost += (p.predicted_cost_usd || 0)
  })

  // Risk distribution
  const highRisk = predictions.filter(p => (p.complexity_score || 0) >= 7).length
  const mediumRisk = predictions.filter(p => {
    const c = p.complexity_score || 0
    return c >= 4 && c < 7
  }).length
  const lowRisk = predictions.filter(p => (p.complexity_score || 0) < 4).length

  if (isLoading && !data) {
    return (
      <section className="reports-loading" aria-live="polite">
        <div className="spinner-large" aria-label="Loading reports..." />
      </section>
    )
  }

  return (
    <section aria-labelledby="reports-title">
      <header className="page-header">
        <p className="page-header__eyebrow">Monitor</p>
        <h1 className="page-header__title" id="reports-title">Reports</h1>
        <p className="page-header__subtitle">
          Executive summary of all cost predictions, risk distribution, and service breakdown.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="reports__summary">
        <div className="reports__summary-card">
          <span className="reports__summary-label">Total Predicted Spend</span>
          <span className="reports__summary-value" style={{ color: '#63b3ed' }}>
            ${totalPredicted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="reports__summary-card">
          <span className="reports__summary-label">Total Baseline</span>
          <span className="reports__summary-value">
            ${totalBaseline.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="reports__summary-card">
          <span className="reports__summary-label">Net Delta</span>
          <span className="reports__summary-value" style={{ color: totalDelta > 0 ? '#fc8181' : '#48bb78' }}>
            {totalDelta >= 0 ? '+' : ''}${totalDelta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="reports__summary-card">
          <span className="reports__summary-label">Predictions</span>
          <span className="reports__summary-value">{predictions.length}</span>
        </div>
        <div className="reports__summary-card">
          <span className="reports__summary-label">Avg Complexity</span>
          <span className="reports__summary-value">{avgComplexity}/10</span>
        </div>
      </div>

      <div className="reports__grid">
        {/* Risk Distribution */}
        <div className="widget">
          <div className="widget__header">
            <div className="widget__title-group">
              <p className="widget__label">Risk</p>
              <h2 className="widget__title">Complexity Distribution</h2>
            </div>
          </div>
          <div style={{ padding: 'var(--space-4)' }}>
            {predictions.length === 0 ? (
              <p style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 'var(--space-6)' }}>
                No prediction data available.
              </p>
            ) : (
              <div className="reports__risk-bars">
                <div className="reports__risk-bar">
                  <span className="reports__risk-label">High (≥7)</span>
                  <div className="reports__risk-track">
                    <div className="reports__risk-fill reports__risk-fill--high" style={{ width: `${(highRisk / predictions.length) * 100}%` }} />
                  </div>
                  <span className="reports__risk-count">{highRisk}</span>
                </div>
                <div className="reports__risk-bar">
                  <span className="reports__risk-label">Medium (4–6.9)</span>
                  <div className="reports__risk-track">
                    <div className="reports__risk-fill reports__risk-fill--medium" style={{ width: `${(mediumRisk / predictions.length) * 100}%` }} />
                  </div>
                  <span className="reports__risk-count">{mediumRisk}</span>
                </div>
                <div className="reports__risk-bar">
                  <span className="reports__risk-label">Low (&lt;4)</span>
                  <div className="reports__risk-track">
                    <div className="reports__risk-fill reports__risk-fill--low" style={{ width: `${(lowRisk / predictions.length) * 100}%` }} />
                  </div>
                  <span className="reports__risk-count">{lowRisk}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Breakdown Table */}
        <div className="widget">
          <div className="widget__header">
            <div className="widget__title-group">
              <p className="widget__label">Breakdown</p>
              <h2 className="widget__title">By Service</h2>
            </div>
          </div>
          <div style={{ padding: 'var(--space-4)' }}>
            {Object.keys(serviceMap).length === 0 ? (
              <p style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 'var(--space-6)' }}>
                No service data available.
              </p>
            ) : (
              <table className="reports__table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Predictions</th>
                    <th>Total Cost</th>
                    <th>Avg Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(serviceMap)
                    .sort((a, b) => b[1].cost - a[1].cost)
                    .map(([svc, stats]) => (
                      <tr key={svc}>
                        <td style={{ textTransform: 'capitalize' }}>{svc}</td>
                        <td>{stats.count}</td>
                        <td>${stats.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td>${(stats.cost / stats.count).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Prediction History Table */}
      <div className="widget" style={{ marginTop: 'var(--space-6)' }}>
        <div className="widget__header">
          <div className="widget__title-group">
            <p className="widget__label">History</p>
            <h2 className="widget__title">All Predictions</h2>
          </div>
        </div>
        <div style={{ padding: 'var(--space-4)', overflowX: 'auto' }}>
          {predictions.length === 0 ? (
            <p style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 'var(--space-6)' }}>
              No predictions recorded yet.
            </p>
          ) : (
            <table className="reports__table reports__table--wide">
              <thead>
                <tr>
                  <th>PR #</th>
                  <th>Repo</th>
                  <th>Service</th>
                  <th>Resource</th>
                  <th>Complexity</th>
                  <th>Baseline</th>
                  <th>Predicted</th>
                  <th>Delta</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map(p => (
                  <tr key={p.id}>
                    <td>#{p.pr_number}</td>
                    <td>{p.repository_full_name || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.service_name}</td>
                    <td>{p.resource_type}</td>
                    <td>{p.complexity_score?.toFixed(1) || '—'}</td>
                    <td>${(p.baseline_cost_usd || 0).toLocaleString()}</td>
                    <td>${(p.predicted_cost_usd || 0).toLocaleString()}</td>
                    <td style={{ color: (p.delta_usd || 0) > 0 ? '#fc8181' : '#48bb78', fontWeight: 600 }}>
                      {(p.delta_usd || 0) >= 0 ? '+' : ''}${(p.delta_usd || 0).toLocaleString()}
                    </td>
                    <td>{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}
