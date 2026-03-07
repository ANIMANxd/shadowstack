/**
 * ConfidenceWidget – displays ML model prediction confidence
 * as an animated SVG arc ring + key stats row.
 */
import { useEffect, useRef } from 'react'
import type { PredictionData } from '../../hooks/useApi'
import './ConfidenceWidget.css'

interface ConfidenceWidgetProps {
    prediction: PredictionData
    isLoading?: boolean
}

// ── Animated arc ring ─────────────────────────────────────────────────────────
function ConfidenceRing({ value }: { value: number }): JSX.Element {
    const circleRef = useRef<SVGCircleElement>(null)
    const R = 52
    const C = 2 * Math.PI * R
    const pct = Math.min(100, Math.max(0, value)) / 100

    // Color stops: <60 = amber, 60-80 = blue, ≥80 = green
    const color =
        value >= 80 ? 'var(--clr-accent-green)'
            : value >= 60 ? 'var(--clr-primary)'
                : 'var(--clr-accent-amber)'

    useEffect(() => {
        const el = circleRef.current
        if (!el) return
        // Start from 0 then animate to target
        el.style.strokeDashoffset = String(C)
        const target = C * (1 - pct)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)'
                el.style.strokeDashoffset = String(target)
            })
        })
    }, [value, C, pct])

    return (
        <svg className="conf-ring" viewBox="0 0 128 128" aria-hidden="true">
            {/* Track */}
            <circle
                cx="64" cy="64" r={R}
                fill="none"
                stroke="var(--clr-bg-elevated)"
                strokeWidth="10"
            />
            {/* Progress arc */}
            <circle
                ref={circleRef}
                cx="64" cy="64" r={R}
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C}
                transform="rotate(-90 64 64)"
                style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
            />
            {/* Centre label */}
            <text
                x="64" y="60"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize="22"
                fontWeight="700"
                fontFamily="var(--font-display)"
            >
                {Math.round(value)}%
            </text>
            <text
                x="64" y="80"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--clr-text-muted)"
                fontSize="9"
                fontWeight="500"
                letterSpacing="0.08em"
            >
                CONFIDENCE
            </text>
        </svg>
    )
}

function fmt$(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return `$${Math.round(n)}`
}

const trendLabel: Record<PredictionData['trend_direction'], string> = {
    up: '▲ Upward',
    down: '▼ Downward',
    stable: '→ Stable',
}
const trendColor: Record<PredictionData['trend_direction'], string> = {
    up: 'var(--clr-accent-red)',
    down: 'var(--clr-accent-green)',
    stable: 'var(--clr-primary)',
}

export default function ConfidenceWidget({ prediction, isLoading }: ConfidenceWidgetProps): JSX.Element {
    if (isLoading) {
        return (
            <div className="conf-widget">
                <div className="conf-ring skeleton" style={{ width: 128, height: 128, borderRadius: '50%' }} />
                <div className="conf-stats">
                    {[1, 2, 3].map(i => <div key={i} className="conf-stat skeleton" style={{ height: 40, borderRadius: 8 }} />)}
                </div>
            </div>
        )
    }

    return (
        <div className="conf-widget">
            <ConfidenceRing value={prediction.confidence} />
            <div className="conf-stats">
                <div className="conf-stat">
                    <span className="conf-stat__label">Predicted Total (30d)</span>
                    <span className="conf-stat__value">{fmt$(prediction.predicted_total)}</span>
                </div>
                <div className="conf-stat">
                    <span className="conf-stat__label">Trend Direction</span>
                    <span
                        className="conf-stat__value"
                        style={{ color: trendColor[prediction.trend_direction] }}
                    >
                        {trendLabel[prediction.trend_direction]}
                    </span>
                </div>
                <div className="conf-stat">
                    <span className="conf-stat__label">Model</span>
                    <span className="conf-stat__value conf-stat__value--sm">{prediction.model_name}</span>
                </div>
            </div>
        </div>
    )
}
