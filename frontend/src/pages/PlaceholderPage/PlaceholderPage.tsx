import './PlaceholderPage.css'

// ── Props ─────────────────────────────────────────────────────────────────────
interface PlaceholderPageProps {
    title: string
    icon?: string
    description?: string
}

/**
 * PlaceholderPage – fallback view for routes not yet implemented.
 */
export default function PlaceholderPage({ title, icon = '🚧', description }: PlaceholderPageProps): JSX.Element {
    return (
        <section className="placeholder-page" aria-labelledby="placeholder-title">
            <header className="page-header">
                <p className="page-header__eyebrow">Coming Soon</p>
                <h1 className="page-header__title" id="placeholder-title">{title}</h1>
                {description && (
                    <p className="page-header__subtitle">{description}</p>
                )}
            </header>

            <div className="placeholder-page__body">
                <span className="placeholder-page__icon" aria-hidden="true">{icon}</span>
                <p className="placeholder-page__label">
                    This module will be implemented in a future sprint.
                </p>
                <div className="placeholder-page__grid">
                    {[1, 2, 3, 4].map(n => (
                        <div key={n} className="placeholder-page__card placeholder-shimmer"
                            data-label={`Widget ${n}`} style={{ minHeight: 140 }}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
