/**
 * api.ts – Sprint 2 Axios integration layer.
 *
 * Tries the FastAPI backend first.  On any network/connection error
 * it rejects with an AxiosError so the calling hook can silently fall
 * back to mockData.ts values and flip the `isLive` flag to false.
 *
 * Base URL is read from the Vite env variable VITE_API_BASE_URL.
 * Default: http://localhost:8000
 */

import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'

// ── API response shape types ────────────────────────────────────────────────

export interface ApiDataPoint {
    date: string   // ISO-8601 string from backend
    value: number
}

export interface ApiKpiItem {
    id: string
    label: string
    value: string
    delta: string
    direction: 'up' | 'down'
    period: string
    iconBg: string
    iconColor: string
}

export interface ApiServiceSpendItem {
    name: string
    cost: number
    pct: number
    color: string
}

export interface ApiAlertItem {
    id: number
    severity: 'high' | 'medium' | 'low'
    message: string
    time: string
}

export interface ApiTopResource {
    id: string
    name: string
    type: string
    cost: string
    pct: number
    color: string
}

export interface PredictionResponse {
    forecast: ApiDataPoint[]
    ci_upper: ApiDataPoint[]
    ci_lower: ApiDataPoint[]
    confidence: number        // 0–100
    trend_direction: 'up' | 'down' | 'stable'
    predicted_total: number
    model_name: string
    generated_at: string      // ISO-8601
}

// ── Client factory ────────────────────────────────────────────────────────── 

const BASE_URL: string =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

const client: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' },
})

// Dev logging interceptor
if (import.meta.env.DEV) {
    client.interceptors.request.use((config) => {
        console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`)
        return config
    })
    client.interceptors.response.use(
        (res) => {
            console.debug(`[API] ✓ ${res.config.url} – ${res.status}`)
            return res
        },
        (err: AxiosError) => {
            console.warn(`[API] ✗ ${err.config?.url} – ${err.message}`)
            return Promise.reject(err)
        }
    )
}

// ── Typed endpoint functions ──────────────────────────────────────────────── 

export async function getKpis(): Promise<ApiKpiItem[]> {
    const { data } = await client.get<ApiKpiItem[]>('/api/v1/kpis')
    return data
}

export async function getCostTrend(days = 30): Promise<ApiDataPoint[]> {
    const { data } = await client.get<ApiDataPoint[]>('/api/v1/cost-trend', {
        params: { days },
    })
    return data
}

export async function getPrediction(): Promise<PredictionResponse> {
    const { data } = await client.get<PredictionResponse>('/api/v1/predict')
    return data
}

export async function getAlerts(): Promise<ApiAlertItem[]> {
    const { data } = await client.get<ApiAlertItem[]>('/api/v1/alerts')
    return data
}

export async function getTopResources(): Promise<ApiTopResource[]> {
    const { data } = await client.get<ApiTopResource[]>('/api/v1/resources/top')
    return data
}

export async function getServiceSpend(): Promise<ApiServiceSpendItem[]> {
    const { data } = await client.get<ApiServiceSpendItem[]>('/api/v1/service-spend')
    return data
}

export default client
