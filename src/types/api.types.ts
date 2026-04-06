/**
 * api.types.ts – Typed response models for the ShadowStack API.
 *
 * These interfaces define the shape of all data flowing between
 * the FastAPI backend and the React frontend. They are the single
 * source of truth for API contracts.
 */

// ── Generic API envelope ──────────────────────────────────────────────────────

/** Standard wrapper returned by every API endpoint */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

/** Paginated list wrapper */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ── KPI / Summary ─────────────────────────────────────────────────────────────

export type DeltaDirection = 'up' | 'down'

export interface Kpi {
  id: string
  label: string
  value: string
  delta: string
  direction: DeltaDirection
  period: string
  iconBg: string
  iconColor: string
}

export interface KpiSummaryResponse {
  kpis: Kpi[]
  generatedAt: string
}

// ── Historical Cost Data ──────────────────────────────────────────────────────

export interface CostDataPoint {
  date: string                // ISO 8601 date string
  value: number               // USD amount
  service?: string            // optional service breakdown
}

export interface HistoricalCostResponse {
  daily: CostDataPoint[]
  total: number
  periodStart: string
  periodEnd: string
  currency: string
}

// ── Predicted / Forecasted Costs ──────────────────────────────────────────────

export interface ForecastDataPoint {
  date: string
  predictedValue: number
  lowerBound: number          // confidence interval low
  upperBound: number          // confidence interval high
}

export interface PredictedCostResponse {
  forecast: ForecastDataPoint[]
  modelVersion: string
  confidenceLevel: number     // e.g. 0.95 for 95% CI
  generatedAt: string
}

// ── ML Model Metrics ──────────────────────────────────────────────────────────

export interface ModelMetrics {
  modelId: string
  modelName: string
  version: string
  accuracy: number            // 0–1
  mae: number                 // Mean Absolute Error
  rmse: number                // Root Mean Square Error
  mape: number                // Mean Absolute Percentage Error
  r2Score: number             // R² coefficient
  lastTrainedAt: string
  dataPointsUsed: number
}

export interface MlMetricsResponse {
  models: ModelMetrics[]
  activeModelId: string
}

// ── Service Breakdown ─────────────────────────────────────────────────────────

export interface ServiceSpend {
  name: string
  cost: number
  percentage: number
  color: string
  trend: DeltaDirection
  trendValue: string
}

export interface ServiceBreakdownResponse {
  services: ServiceSpend[]
  total: number
  period: string
}

// ── Anomaly / Alerts ──────────────────────────────────────────────────────────

export type AlertSeverity = 'high' | 'medium' | 'low'

export interface Alert {
  id: number
  severity: AlertSeverity
  message: string
  time: string
  resource?: string
  acknowledged: boolean
}

export interface AlertsResponse {
  alerts: Alert[]
  activeCount: number
}

// ── Top Resources ─────────────────────────────────────────────────────────────

export interface ResourceCost {
  id: string
  name: string
  type: string
  cost: string
  percentage: number
  color: string
  region?: string
}

export interface TopResourcesResponse {
  resources: ResourceCost[]
  period: string
}

// ── Aggregate Dashboard Payload ───────────────────────────────────────────────

/**
 * Combined payload used by useDashboardData hook.
 * This represents the full state needed to render the dashboard.
 */
export interface DashboardData {
  kpis: KpiSummaryResponse
  historicalCosts: HistoricalCostResponse
  predictedCosts: PredictedCostResponse
  mlMetrics: MlMetricsResponse
  serviceBreakdown: ServiceBreakdownResponse
  alerts: AlertsResponse
  topResources: TopResourcesResponse
}
