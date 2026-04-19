import './CostAnalysis.css'

/**
 * CostAnalysis – PR-driven cost analysis page.
 *
 * Displays historical cost data broken down by service,
 * with drill-down by repository and time range.
 */
export default function CostAnalysis() {
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
        {/* Summary cards */}
        <div className="cost-analysis__card">
          <div className="cost-analysis__card-header">
            <span className="cost-analysis__card-label">Total This Month</span>
            <span className="cost-analysis__card-icon" aria-hidden="true">💰</span>
          </div>
          <div className="cost-analysis__card-value">$4,280</div>
          <div className="cost-analysis__card-delta cost-analysis__card-delta--down">
            ▼ 12% vs last month
          </div>
        </div>

        <div className="cost-analysis__card">
          <div className="cost-analysis__card-header">
            <span className="cost-analysis__card-label">Avg per PR</span>
            <span className="cost-analysis__card-icon" aria-hidden="true">📊</span>
          </div>
          <div className="cost-analysis__card-value">$18.40</div>
          <div className="cost-analysis__card-delta cost-analysis__card-delta--up">
            ▲ 3% vs last month
          </div>
        </div>

        <div className="cost-analysis__card">
          <div className="cost-analysis__card-header">
            <span className="cost-analysis__card-label">Top Service</span>
            <span className="cost-analysis__card-icon" aria-hidden="true">☁️</span>
          </div>
          <div className="cost-analysis__card-value">Lambda</div>
          <div className="cost-analysis__card-delta">$1,420 this period</div>
        </div>
      </div>

      {/* Chart placeholder */}
      <div className="widget">
        <div className="widget__header">
          <div className="widget__title-group">
            <p className="widget__label">Trend</p>
            <h2 className="widget__title">Cost Over Time</h2>
          </div>
        </div>
        <div className="widget__chart-area">
          <div className="placeholder-shimmer" data-label="📈  Interactive cost chart — connect a repo to populate" />
        </div>
      </div>
    </section>
  )
}
