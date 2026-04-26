import './Predictions.css'

/**
 * Predictions – ML-powered PR cost prediction page.
 */

import useDashboardData from '../../hooks/useDashboardData'

const riskClass = { high: 'badge--red', medium: 'badge--amber', low: 'badge--green' }

function getRiskLevel(complexityScore) {
  if (complexityScore == null) return 'low'
  if (complexityScore >= 7) return 'high'
  if (complexityScore >= 4) return 'medium'
  return 'low'
}

function formatPredicted(cost) {
  if (cost == null) return '$0/mo'
  return `$${cost.toLocaleString()}/mo`
}

export default function Predictions() {
  const { data, isLoading } = useDashboardData()
  const prs = data?.predictions || []

  if (isLoading && !data) {
    return (
      <section className="predictions-loading" aria-live="polite">
        <div className="spinner-large" aria-label="Loading predictions data..." />
      </section>
    )
  }

  return (
    <section aria-labelledby="predict-title">
      <header className="page-header">
        <p className="page-header__eyebrow">Intelligence</p>
        <h1 className="page-header__title" id="predict-title">PR Predictions</h1>
        <p className="page-header__subtitle">
          ML-powered cost impact analysis for open pull requests.
        </p>
      </header>

      <div className="widget">
        <div className="widget__header">
          <div className="widget__title-group">
            <p className="widget__label">Recent Predictions</p>
            <h2 className="widget__title">Predicted Cost Impact</h2>
          </div>
        </div>

        <div className="predictions__table-wrap">
          <table className="predictions__table">
            <thead>
              <tr>
                <th>PR #</th>
                <th>Service</th>
                <th>Resource</th>
                <th>Complexity</th>
                <th>Predicted Cost</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {prs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: 'var(--space-6)' }}>
                    No predictions available. Connect a repository and run a prediction to get started.
                  </td>
                </tr>
              ) : (
                prs.map((pr) => {
                  const complexity = pr.complexity_score || 0
                  const risk = getRiskLevel(complexity)
                  return (
                    <tr key={pr.id}>
                      <td className="predictions__pr-id">#{pr.pr_number || pr.id}</td>
                      <td>{pr.service_name || 'N/A'}</td>
                      <td className="predictions__author">{pr.resource_type || 'N/A'}</td>
                      <td>{complexity.toFixed(1)}/10</td>
                      <td className="predictions__impact predictions__impact--increase">
                        {formatPredicted(pr.predicted_cost_usd)}
                      </td>
                      <td>
                        <span className={`badge ${riskClass[risk]}`}>{risk}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="widget" style={{ marginTop: 'var(--space-6)' }}>
        <div className="widget__header">
          <div className="widget__title-group">
            <p className="widget__label">Forecast</p>
            <h2 className="widget__title">30-Day Spend Projection</h2>
          </div>
        </div>
        <div className="widget__chart-area">
          <div className="placeholder-shimmer" data-label="🔮  ML forecast chart — connect a repo to generate predictions" />
        </div>
      </div>
    </section>
  )
}
