import useDashboardData from '../../hooks/useDashboardData'
import './Alerts.css'

const severityClass = { high: 'badge--red', medium: 'badge--amber', low: 'badge--blue' }

function getAlertSeverity(pr) {
  if ((pr.complexity_score || 0) > 7 || (pr.delta_usd || 0) > 200) return 'high'
  if ((pr.complexity_score || 0) > 4 || (pr.delta_usd || 0) > 50) return 'medium'
  return 'low'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Alerts() {
  const { data, isLoading } = useDashboardData()
  const predictions = data?.predictions || []

  // Filter predictions that should trigger alerts
  const alerts = predictions.filter(p => {
    const complexity = p.complexity_score || 0
    const delta = p.delta_usd || 0
    return complexity > 4 || delta > 50 || p.nested_loop_count > 0
  }).map(p => ({
    ...p,
    severity: getAlertSeverity(p),
  }))

  if (isLoading && !data) {
    return (
      <section className="alerts-loading" aria-live="polite">
        <div className="spinner-large" aria-label="Loading alerts..." />
      </section>
    )
  }

  return (
    <section aria-labelledby="alerts-title">
      <header className="page-header">
        <p className="page-header__eyebrow">Monitor</p>
        <h1 className="page-header__title" id="alerts-title">Alerts</h1>
        <p className="page-header__subtitle">
          High-complexity and high-cost predictions that require attention.
        </p>
      </header>

      {/* Alert Stats */}
      <div className="alerts__stats">
        <div className="alerts__stat">
          <span className="alerts__stat-value" style={{ color: '#fc8181' }}>
            {alerts.filter(a => a.severity === 'high').length}
          </span>
          <span className="alerts__stat-label">High Severity</span>
        </div>
        <div className="alerts__stat">
          <span className="alerts__stat-value" style={{ color: '#ecc94b' }}>
            {alerts.filter(a => a.severity === 'medium').length}
          </span>
          <span className="alerts__stat-label">Medium Severity</span>
        </div>
        <div className="alerts__stat">
          <span className="alerts__stat-value" style={{ color: '#63b3ed' }}>
            {alerts.length}
          </span>
          <span className="alerts__stat-label">Total Alerts</span>
        </div>
      </div>

      {/* Alert List */}
      <div className="widget">
        <div className="widget__header">
          <div className="widget__title-group">
            <p className="widget__label">Active Alerts</p>
            <h2 className="widget__title">Prediction Anomalies</h2>
          </div>
        </div>
        <div className="alerts__list">
          {alerts.length === 0 ? (
            <div className="alerts__empty">
              <span aria-hidden="true" style={{ fontSize: '2rem' }}>✅</span>
              <p>No active alerts. All predictions are within normal parameters.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`alerts__item alerts__item--${alert.severity}`}>
                <div className="alerts__item-header">
                  <span className={`badge ${severityClass[alert.severity]}`}>
                    {alert.severity}
                  </span>
                  <span className="alerts__item-meta">
                    PR #{alert.pr_number} &middot; {alert.service_name} / {alert.resource_type} &middot; {formatDate(alert.created_at)}
                  </span>
                </div>
                <div className="alerts__item-body">
                  <div className="alerts__item-metrics">
                    <span>Complexity: <strong>{alert.complexity_score}/10</strong></span>
                    <span>Baseline: <strong>${(alert.baseline_cost_usd || 0).toLocaleString()}</strong></span>
                    <span>Predicted: <strong>${(alert.predicted_cost_usd || 0).toLocaleString()}</strong></span>
                    <span style={{ color: (alert.delta_usd || 0) > 0 ? '#fc8181' : '#48bb78' }}>
                      Delta: <strong>{(alert.delta_usd || 0) >= 0 ? '+' : ''}${(alert.delta_usd || 0).toLocaleString()}</strong>
                    </span>
                  </div>
                  {alert.recommendation && (
                    <div className="alerts__item-rec">
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
