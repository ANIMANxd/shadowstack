/**
 * useApi.ts – React hooks for the ShadowStack API.
 *
 * Strategy:
 *  1. Attempt real API calls via api.ts (FastAPI backend).
 *  2. On network / connection error → silently fall back to mockData.ts.
 *  3. Expose `isLive: boolean` so the UI can show LIVE vs MOCK badge.
 *  4. Auto-refresh every 60 seconds.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    getKpis,
    getCostTrend,
    getPrediction,
    getAlerts,
    getTopResources,
    getServiceSpend,
    type PredictionResponse,
} from '../services/api'
import {
    KPI_DATA,
    COST_TREND_DATA,
    COST_FORECAST_DATA,
    SERVICE_SPEND,
    RECENT_ALERTS,
    TOP_RESOURCES,
    type KpiItem,
    type DataPoint,
    type ServiceSpendItem,
    type AlertItem,
    type TopResource,
} from '../data/mockData'

// ── Delay helper (makes mock feel realistic) ────────────────────────────────
const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))
const randDelay = () => delay(400 + Math.random() * 400)

// ── ISO string → Date converter ──────────────────────────────────────────────
function parseDate(s: string): Date {
    return new Date(s)
}

// ── PredictionData (front-end shape) ────────────────────────────────────────
export interface PredictionData {
    forecast: DataPoint[]
    ci_upper: DataPoint[]
    ci_lower: DataPoint[]
    confidence: number
    trend_direction: 'up' | 'down' | 'stable'
    predicted_total: number
    model_name: string
    generated_at: Date
}

// ── Full dashboard data bundle ───────────────────────────────────────────────
export interface DashboardData {
    kpis: KpiItem[]
    costTrend: DataPoint[]
    prediction: PredictionData
    alerts: AlertItem[]
    topResources: TopResource[]
    serviceSpend: ServiceSpendItem[]
}

// ── Mock prediction data (generated to mirror real shape) ────────────────────
function buildMockPrediction(): PredictionData {
    const last = COST_TREND_DATA[COST_TREND_DATA.length - 1]
    return {
        forecast: COST_FORECAST_DATA,
        ci_upper: COST_FORECAST_DATA.map((d, i) => ({ date: d.date, value: d.value + 200 + i * 15 })),
        ci_lower: COST_FORECAST_DATA.map((d, i) => ({ date: d.date, value: Math.max(0, d.value - 200 - i * 10) })),
        confidence: 82,
        trend_direction: 'up',
        predicted_total: last.value * 30 * 1.09,
        model_name: 'XGBoost v2 (mock)',
        generated_at: new Date(),
    }
}

// ── useDashboardData ──────────────────────────────────────────────────────────
export function useDashboardData() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLive, setIsLive] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [error, setError] = useState<string | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const fetchAll = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            // Try real API (all calls fire together for speed)
            const [apiKpis, apiTrend, apiPrediction, apiAlerts, apiResources, apiSpend] =
                await Promise.all([
                    getKpis(),
                    getCostTrend(30),
                    getPrediction(),
                    getAlerts(),
                    getTopResources(),
                    getServiceSpend(),
                ])

            setData({
                kpis: apiKpis,
                costTrend: apiTrend.map((d) => ({ date: parseDate(d.date), value: d.value })),
                prediction: {
                    forecast: apiPrediction.forecast.map((d) => ({ date: parseDate(d.date), value: d.value })),
                    ci_upper: apiPrediction.ci_upper.map((d) => ({ date: parseDate(d.date), value: d.value })),
                    ci_lower: apiPrediction.ci_lower.map((d) => ({ date: parseDate(d.date), value: d.value })),
                    confidence: apiPrediction.confidence,
                    trend_direction: apiPrediction.trend_direction,
                    predicted_total: apiPrediction.predicted_total,
                    model_name: apiPrediction.model_name,
                    generated_at: parseDate(apiPrediction.generated_at),
                },
                alerts: apiAlerts,
                topResources: apiResources,
                serviceSpend: apiSpend,
            })
            setIsLive(true)
        } catch {
            // Backend unreachable – fall back to mock data
            await randDelay()
            setData({
                kpis: KPI_DATA,
                costTrend: COST_TREND_DATA,
                prediction: buildMockPrediction(),
                alerts: RECENT_ALERTS,
                topResources: TOP_RESOURCES,
                serviceSpend: SERVICE_SPEND,
            })
            setIsLive(false)
        }

        setLastUpdated(new Date())
        setIsLoading(false)
    }, [])

    // Initial fetch
    useEffect(() => {
        void fetchAll()
    }, [fetchAll])

    // Auto-refresh every 60 s
    useEffect(() => {
        timerRef.current = setInterval(() => { void fetchAll() }, 60_000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [fetchAll])

    return { data, isLoading, isLive, lastUpdated, error, refresh: fetchAll }
}
