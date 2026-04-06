/**
 * mockAdapter.ts – Adapts existing mock data to the typed API response models.
 *
 * This file bridges the gap between our static mockData.js and the typed
 * response interfaces. It allows useDashboardData to fall back to realistic
 * mock data when the backend API is unreachable during development.
 *
 * This file will be removed once the backend is fully operational.
 */

import type {
  DashboardData,
  KpiSummaryResponse,
  HistoricalCostResponse,
  PredictedCostResponse,
  MlMetricsResponse,
  ServiceBreakdownResponse,
  AlertsResponse,
  TopResourcesResponse,
} from '../types/api.types'

import {
  KPI_DATA,
  COST_TREND_DATA,
  COST_FORECAST_DATA,
  SERVICE_SPEND,
  RECENT_ALERTS,
  TOP_RESOURCES,
  // @ts-expect-error — mockData.js is untyped; will be migrated to TS later
} from './mockData'

// ── Adapters ──────────────────────────────────────────────────────────────────

function adaptKpis(): KpiSummaryResponse {
  return {
    kpis: KPI_DATA.map((k: Record<string, unknown>) => ({
      id: k.id as string,
      label: k.label as string,
      value: k.value as string,
      delta: k.delta as string,
      direction: k.direction as 'up' | 'down',
      period: k.period as string,
      iconBg: k.iconBg as string,
      iconColor: k.iconColor as string,
    })),
    generatedAt: new Date().toISOString(),
  }
}

function adaptHistoricalCosts(days?: number, service?: string): HistoricalCostResponse {
  // If a service is selected, simulate lower costs by slicing/multiplying
  const serviceMultiplier = service && service !== 'all' ? 0.3 : 1;
  const filterDays = days || 30;
  
  const daily = COST_TREND_DATA.slice(-filterDays).map((d: { date: Date; value: number }) => ({
    date: d.date.toISOString(),
    value: d.value * serviceMultiplier,
  }))

  return {
    daily,
    total: daily.reduce((sum: number, d: { value: number }) => sum + d.value, 0),
    periodStart: daily[0]?.date || new Date().toISOString(),
    periodEnd: daily[daily.length - 1]?.date || new Date().toISOString(),
    currency: 'USD',
  }
}

function adaptPredictedCosts(days?: number, service?: string): PredictedCostResponse {
  const serviceMultiplier = service && service !== 'all' ? 0.3 : 1;
  const filterDays = days || 30;

  return {
    forecast: COST_FORECAST_DATA.slice(0, filterDays).map((d: { date: Date; value: number }) => ({
      date: d.date.toISOString(),
      predictedValue: d.value * serviceMultiplier,
      lowerBound: Math.round(d.value * serviceMultiplier * 0.85),
      upperBound: Math.round(d.value * serviceMultiplier * 1.15),
    })),
    modelVersion: 'mock-v1.0',
    confidenceLevel: 0.95,
    generatedAt: new Date().toISOString(),
  }
}

function adaptMlMetrics(): MlMetricsResponse {
  return {
    models: [
      {
        modelId: 'shadowstack-lstm-v1',
        modelName: 'ShadowStack LSTM Cost Predictor',
        version: '1.0.0',
        accuracy: 0.924,
        mae: 142.5,
        rmse: 198.3,
        mape: 8.7,
        r2Score: 0.891,
        lastTrainedAt: new Date(Date.now() - 86400000).toISOString(),
        dataPointsUsed: 2847,
      },
      {
        modelId: 'shadowstack-prophet-v1',
        modelName: 'ShadowStack Prophet Forecaster',
        version: '1.2.0',
        accuracy: 0.897,
        mae: 167.2,
        rmse: 223.1,
        mape: 10.3,
        r2Score: 0.862,
        lastTrainedAt: new Date(Date.now() - 172800000).toISOString(),
        dataPointsUsed: 2847,
      },
    ],
    activeModelId: 'shadowstack-lstm-v1',
  }
}

function adaptServiceBreakdown(days?: number, service?: string): ServiceBreakdownResponse {
  // If filtering to a specific service, only return that service
  let services = SERVICE_SPEND;
  if (service && service !== 'all') {
      services = services.filter((s: { name: string }) => s.name === service);
  }

  return {
    services: services.map(
      (s: { name: string; cost: number; pct: number; color: string }) => ({
        name: s.name,
        cost: s.cost * (days === 7 ? 0.25 : days === 90 ? 3 : 1), // Fake scaling based on days
        percentage: s.pct,
        color: s.color,
        trend: s.cost > 5000 ? ('up' as const) : ('down' as const),
        trendValue: `${Math.round(Math.random() * 10 + 2)}%`,
      }),
    ),
    total: services.reduce(
      (sum: number, s: { cost: number }) => sum + s.cost * (days === 7 ? 0.25 : days === 90 ? 3 : 1),
      0,
    ),
    period: `Last ${days || 30} days`,
  }
}

function adaptAlerts(): AlertsResponse {
  return {
    alerts: RECENT_ALERTS.map(
      (a: {
        id: number
        severity: 'high' | 'medium' | 'low'
        message: string
        time: string
      }) => ({
        ...a,
        acknowledged: false,
      }),
    ),
    activeCount: RECENT_ALERTS.length,
  }
}

function adaptTopResources(): TopResourcesResponse {
  return {
    resources: TOP_RESOURCES.map(
      (r: {
        id: string
        name: string
        type: string
        cost: string
        pct: number
        color: string
      }) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        cost: r.cost,
        percentage: r.pct,
        color: r.color,
      }),
    ),
    period: 'Last 30 days',
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a complete DashboardData object constructed from mock data.
 * Mirrors the shape that dashboardApi.getAllDashboardData() would return.
 */
export function getMockDashboardData(days?: number, service?: string): DashboardData {
  return {
    kpis: adaptKpis(),
    historicalCosts: adaptHistoricalCosts(days, service),
    predictedCosts: adaptPredictedCosts(days, service),
    mlMetrics: adaptMlMetrics(),
    serviceBreakdown: adaptServiceBreakdown(days, service),
    alerts: adaptAlerts(),
    topResources: adaptTopResources(),
  }
}
