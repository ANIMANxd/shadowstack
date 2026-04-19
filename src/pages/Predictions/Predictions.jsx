import './Predictions.css'

/**
 * Predictions – ML-powered PR cost prediction page.
 *
 * Shows upcoming and recent pull requests with predicted
 * infrastructure cost impact before merge.
 */

import useDashboardData from '../../hooks/useDashboardData'

const riskClass = { high: 'badge--red', medium: 'badge--amber', low: 'badge--green' }

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

      {/* PR predictions table */}
      <div className="widget">
        <div className="widget__header">
          <div className="widget__title-group">
            <p className="widget__label">Open PRs</p>
            <h2 className="widget__title">Predicted Cost Impact</h2>
          </div>
        </div>

        <div className="predictions__table-wrap">
          <table className="predictions__table">
            <thead>
              <tr>
                <th>PR</th>
                <th>Title</th>
                <th>Author</th>
                <th>Predicted Impact</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {prs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: 'var(--space-6)' }}>
                    No predictions available.
                  </td>
                </tr>
              ) : (
                prs.map((pr) => (
                  <tr key={pr.id}>
                    <td className="predictions__pr-id">{pr.id}</td>
                    <td>{pr.title}</td>
                    <td className="predictions__author">{pr.author}</td>
                    <td className={`predictions__impact ${pr.predicted?.startsWith('+') ? 'predictions__impact--increase' : 'predictions__impact--decrease'}`}>
                      {pr.predicted}
                    </td>
                    <td>
                      <span className={`badge ${riskClass[pr.risk]}`}>{pr.risk}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast chart placeholder */}
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
