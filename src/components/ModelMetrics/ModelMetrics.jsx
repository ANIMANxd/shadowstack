import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import './ModelMetrics.css'

/**
 * ModelMetrics – ML model performance visualization.
 *
 * Displays key metrics (accuracy, MAE, RMSE, MAPE, R²) as animated
 * horizontal gauge bars with a header showing the active model.
 *
 * Props:
 *  - models        : Array<ModelMetrics>
 *  - activeModelId : string
 */
export default function ModelMetrics({ models = [], activeModelId }) {
    const activeModel = models.find(m => m.modelId === activeModelId) || models[0]

    if (!activeModel) {
        return (
            <div className="model-metrics model-metrics--empty">
                <p>No model data available</p>
            </div>
        )
    }

    const metrics = [
        {
            label: 'Accuracy',
            value: activeModel.accuracy,
            display: `${(activeModel.accuracy * 100).toFixed(1)}%`,
            max: 1,
            color: '#48bb78',
        },
        {
            label: 'R² Score',
            value: activeModel.r2Score,
            display: activeModel.r2Score.toFixed(3),
            max: 1,
            color: '#63b3ed',
        },
        {
            label: 'MAPE',
            value: Math.min(activeModel.mape / 20, 1),    // normalize to 0-1 (20% = full bar)
            display: `${activeModel.mape.toFixed(1)}%`,
            max: 1,
            color: '#ecc94b',
            inverted: true,   // lower is better
        },
        {
            label: 'MAE',
            value: Math.min(activeModel.mae / 500, 1),
            display: `$${activeModel.mae.toFixed(0)}`,
            max: 1,
            color: '#fc8181',
            inverted: true,
        },
        {
            label: 'RMSE',
            value: Math.min(activeModel.rmse / 500, 1),
            display: `$${activeModel.rmse.toFixed(0)}`,
            max: 1,
            color: '#9f7aea',
            inverted: true,
        },
    ]

    return (
        <div className="model-metrics">
            {/* Model header */}
            <div className="model-metrics__header">
                <div className="model-metrics__model-badge">
                    <span className="model-metrics__active-dot" />
                    <span className="model-metrics__model-name">{activeModel.modelName}</span>
                </div>
                <span className="model-metrics__version">v{activeModel.version}</span>
            </div>

            {/* Training info */}
            <div className="model-metrics__info-row">
                <span>Last trained: {formatRelativeTime(activeModel.lastTrainedAt)}</span>
                <span>{activeModel.dataPointsUsed.toLocaleString()} data points</span>
            </div>

            {/* Metric bars */}
            <div className="model-metrics__bars">
                {metrics.map(m => (
                    <MetricBar key={m.label} {...m} />
                ))}
            </div>

            {/* Model selector (if multiple) */}
            {models.length > 1 && (
                <div className="model-metrics__selector">
                    {models.map(m => (
                        <span
                            key={m.modelId}
                            className={`model-metrics__model-pill${m.modelId === activeModelId ? ' active' : ''}`}
                            title={m.modelName}
                        >
                            {m.modelId === activeModelId ? '●' : '○'} {m.modelName.split(' ').pop()}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Sub-component: animated bar ──────────────────────────────────────────────
function MetricBar({ label, value, display, color, inverted }) {
    const barRef = useRef(null)
    const [animated, setAnimated] = useState(false)

    useEffect(() => {
        // Trigger animation after mount
        const timer = setTimeout(() => setAnimated(true), 100)
        return () => clearTimeout(timer)
    }, [value])

    return (
        <div className="metric-bar">
            <div className="metric-bar__header">
                <span className="metric-bar__label">{label}</span>
                <span className="metric-bar__value" style={{ color }}>
                    {display}
                    {inverted && <span className="metric-bar__tag">↓ lower is better</span>}
                </span>
            </div>
            <div className="metric-bar__track">
                <div
                    ref={barRef}
                    className="metric-bar__fill"
                    style={{
                        width: animated ? `${Math.round(value * 100)}%` : '0%',
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                    }}
                />
            </div>
        </div>
    )
}

// ── Helper ───────────────────────────────────────────────────────────────────
function formatRelativeTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}
