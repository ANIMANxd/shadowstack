/**
 * mockData.ts – Sprint 1 mock data for all dashboard widgets.
 * Replace with real API calls in Sprint 2.
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export type Direction = 'up' | 'down'
export type Severity = 'high' | 'medium' | 'low'

export interface KpiItem {
    id: string
    label: string
    value: string
    delta: string
    direction: Direction
    period: string
    iconBg: string
    iconColor: string
}

export interface DataPoint {
    date: Date
    value: number
}

export interface ServiceSpendItem {
    name: string
    cost: number
    pct: number
    color: string
}

export interface AlertItem {
    id: number
    severity: Severity
    message: string
    time: string
}

export interface TopResource {
    id: string
    name: string
    type: string
    cost: string
    pct: number
    color: string
}

// ── KPI Cards ────────────────────────────────────────────────────────────────
export const KPI_DATA: KpiItem[] = [
    {
        id: 'total-spend',
        label: 'Total Spend',
        value: '$48,291',
        delta: '+12.4%',
        direction: 'up',
        period: 'vs. last month',
        iconBg: 'rgba(99,179,237,0.12)',
        iconColor: '#63b3ed',
    },
    {
        id: 'predicted-30d',
        label: '30-Day Forecast',
        value: '$52,810',
        delta: '+9.4%',
        direction: 'up',
        period: 'ML prediction',
        iconBg: 'rgba(159,122,234,0.12)',
        iconColor: '#9f7aea',
    },
    {
        id: 'savings',
        label: 'Savings Found',
        value: '$6,142',
        delta: '-18.2%',
        direction: 'down',
        period: 'vs. last month',
        iconBg: 'rgba(72,187,120,0.12)',
        iconColor: '#48bb78',
    },
    {
        id: 'efficiency-score',
        label: 'Efficiency Score',
        value: '74.3',
        delta: '+3.1',
        direction: 'down', // higher is good → green
        period: 'pts this month',
        iconBg: 'rgba(236,201,75,0.12)',
        iconColor: '#ecc94b',
    },
]

// ── Cost Trend (30 days) ──────────────────────────────────────────────────────
function generateDailySpend(days = 30, baseValue = 1400, variance = 300): DataPoint[] {
    const data: DataPoint[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const noise = (Math.random() - 0.45) * variance
        const value = Math.max(0, baseValue + noise + i * 8)
        data.push({ date, value: Math.round(value) })
    }
    return data
}

export const COST_TREND_DATA: DataPoint[] = generateDailySpend(30, 1420, 320)

// Predicted overlay (days 25–45)
export const COST_FORECAST_DATA: DataPoint[] = (() => {
    const lastReal = COST_TREND_DATA[COST_TREND_DATA.length - 1]
    const forecast: DataPoint[] = []
    for (let i = 1; i <= 15; i++) {
        const date = new Date(lastReal.date)
        date.setDate(date.getDate() + i)
        const value = lastReal.value + i * 60 + (Math.random() - 0.3) * 200
        forecast.push({ date, value: Math.round(value) })
    }
    return forecast
})()

// ── Service Breakdown ─────────────────────────────────────────────────────────
export const SERVICE_SPEND: ServiceSpendItem[] = [
    { name: 'EC2 Compute', cost: 18420, pct: 38, color: '#63b3ed' },
    { name: 'RDS Database', cost: 9810, pct: 20, color: '#9f7aea' },
    { name: 'S3 Storage', cost: 5780, pct: 12, color: '#48bb78' },
    { name: 'CloudFront CDN', cost: 4620, pct: 10, color: '#ecc94b' },
    { name: 'Lambda', cost: 3250, pct: 7, color: '#fc8181' },
    { name: 'Other', cost: 6411, pct: 13, color: '#4a5568' },
]

// ── Anomaly Alerts ────────────────────────────────────────────────────────────
export const RECENT_ALERTS: AlertItem[] = [
    { id: 1, severity: 'high', message: 'EC2 spend 34% above 7-day avg', time: '2m ago' },
    { id: 2, severity: 'medium', message: 'Untagged resources: 17 detected', time: '18m ago' },
    { id: 3, severity: 'low', message: 'S3 storage growth +8% this week', time: '1h ago' },
]

// ── Top Resources by Cost ─────────────────────────────────────────────────────
export const TOP_RESOURCES: TopResource[] = [
    { id: 'r1', name: 'prod-api-cluster', type: 'EKS', cost: '$8,240', pct: 85, color: '#63b3ed' },
    { id: 'r2', name: 'analytics-db-master', type: 'RDS', cost: '$5,120', pct: 53, color: '#9f7aea' },
    { id: 'r3', name: 'ml-training-gpu-fleet', type: 'EC2', cost: '$4,870', pct: 50, color: '#fc8181' },
    { id: 'r4', name: 'cdn-assets-bucket', type: 'CF', cost: '$3,410', pct: 35, color: '#48bb78' },
    { id: 'r5', name: 'worker-queue-lambda', type: 'λ', cost: '$1,890', pct: 19, color: '#ecc94b' },
]
