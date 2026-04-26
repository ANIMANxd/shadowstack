import './Predictions.css'

/**
 * Predictions – ML-powered PR cost prediction page.
 */

import { useState } from 'react'
import useDashboardData from '../../hooks/useDashboardData'
import D3Chart from '../../components/D3Chart/D3Chart'

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

function formatDelta(delta) {
  if (delta == null) return '$0'
  const sign = delta >= 0 ? '+' : ''
  return `${sign}$${delta.toLocaleString()}`
}

export default function Predictions() {
  const { data, isLoading } = useDashboardData()
  const prs = data?.predictions || []
  const [selectedPR, setSelectedPR] = useState(null)

  // Build forecast chart data
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

  if (isLoading && !data) {
    return (
      <section className="predictions-loading" aria-live="polite">
        <div className="spinner-large" aria-label="Loading predictions data..." />
      </section>
    )
  }

  const activePR = selectedPR != null ? prs[selectedPR] : null

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
                <th>Baseline</th>
                <th>Predicted</th>
                <th>Delta</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {prs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: 'var(--space-6)' }}>
                    No predictions available. Connect a repository and run a prediction to get started.
                  </td>
                </tr>
              ) : (
                prs.map((pr, idx) => {
                  const complexity = pr.complexity_score || 0
                  const risk = getRiskLevel(complexity)
                  return (
                    <tr
                      key={pr.id}
                      onClick={() => setSelectedPR(idx)}
                      style={{ cursor: 'pointer', background: selectedPR === idx ? 'var(--clr-bg-elevated)' : undefined }}
                    >
                      <td className="predictions__pr-id">#{pr.pr_number || pr.id}</td>
                      <td>{pr.service_name || 'N/A'}</td>
                      <td className="predictions__author">{pr.resource_type || 'N/A'}</td>
                      <td>{complexity.toFixed(1)}/10</td>
                      <td>{formatPredicted(pr.baseline_cost_usd)}</td>
                      <td className="predictions__impact predictions__impact--increase">
                        {formatPredicted(pr.predicted_cost_usd)}
                      </td>
                      <td style={{ color: (pr.delta_usd || 0) > 0 ? '#fc8181' : '#48bb78', fontWeight: 600 }}>
                        {formatDelta(pr.delta_usd)}
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

      {/* Selected PR Recommendation Panel */}
      {activePR && activePR.recommendation && (
        <div className="widget" style={{ marginTop: 'var(--space-6)' }}>
          <div className="widget__header">
            <div className="widget__title-group">
              <p className="widget__label">Recommendation</p>
              <h2 className="widget__title">PR #{activePR.pr_number} Analysis</h2>
            </div>
          </div>
          <div style={{ padding: 'var(--space-4)', whiteSpace: 'pre-wrap', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
            {activePR.recommendation}
          </div>
        </div>
      )}

      {/* 30-Day Forecast Chart */}
      <div className="widget" style={{ marginTop: 'var(--space-6)' }}>
        <div className="widget__header">
          <div className="widget__title-group">
            <p className="widget__label">Forecast</p>
            <h2 className="widget__title">30-Day Spend Projection</h2>
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
            <div className="placeholder-shimmer" data-label="🔮  ML forecast chart — connect a repo and run predictions to generate LSTM forecast" />
          )}
        </div>
      </div>
    </section>
  )
}
