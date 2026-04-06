/**
 * apiClient.ts – Centralized Axios service layer for ShadowStack.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  PBI-033: API Integration Layer                         │
 * │  • Single Axios instance with env-based configuration   │
 * │  • Request/response interceptors for auth & error flow  │
 * │  • Typed endpoint methods for every API domain          │
 * │  • Automatic retry on network failures                  │
 * └─────────────────────────────────────────────────────────┘
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'

import type {
  ApiResponse,
  KpiSummaryResponse,
  HistoricalCostResponse,
  PredictedCostResponse,
  MlMetricsResponse,
  ServiceBreakdownResponse,
  AlertsResponse,
  TopResourcesResponse,
} from '../types/api.types'

// ── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1_000

// ── Custom error class ────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly endpoint: string
  public readonly timestamp: string

  constructor(
    message: string,
    status: number,
    code: string,
    endpoint: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.endpoint = endpoint
    this.timestamp = new Date().toISOString()
  }

  /** User-friendly message by HTTP status */
  get userMessage(): string {
    const messages: Record<number, string> = {
      400: 'Invalid request — please check your input.',
      401: 'Session expired — please log in again.',
      403: 'You don\'t have permission to access this resource.',
      404: 'The requested data was not found.',
      408: 'Request timed out — please try again.',
      429: 'Too many requests — please slow down.',
      500: 'Server error — our team has been notified.',
      502: 'Bad gateway — the server is temporarily unreachable.',
      503: 'Service temporarily unavailable — please try again shortly.',
    }
    return messages[this.status] || `Unexpected error (${this.status}).`
  }
}

// ── Create the Axios instance ─────────────────────────────────────────────────

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  // ── Request interceptor ───────────────────────────────────────────────────
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Inject auth token if present (future-proofed for Sprint 4 auth)
      const token = localStorage.getItem('shadowstack_token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Add request ID for tracing
      config.headers['X-Request-ID'] = crypto.randomUUID()

      if (import.meta.env.DEV) {
        console.debug(
          `%c[API] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
          'color: #63b3ed; font-weight: bold',
        )
      }

      return config
    },
    (error: AxiosError) => Promise.reject(error),
  )

  // ── Response interceptor ──────────────────────────────────────────────────
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      if (import.meta.env.DEV) {
        console.debug(
          `%c[API] ← ${response.status} ${response.config.url} (${response.headers['x-response-time'] || '?'}ms)`,
          'color: #48bb78; font-weight: bold',
        )
      }
      return response
    },
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number }
      const status = error.response?.status || 0

      // ── Retry logic for 5xx and network errors ──────────────────────────
      if (
        config &&
        (status >= 500 || !error.response) &&
        (config._retryCount || 0) < MAX_RETRIES
      ) {
        config._retryCount = (config._retryCount || 0) + 1

        if (import.meta.env.DEV) {
          console.warn(
            `[API] Retrying (${config._retryCount}/${MAX_RETRIES}): ${config.url}`,
          )
        }

        await sleep(RETRY_DELAY_MS * config._retryCount)
        return client(config)
      }

      // ── Handle specific status codes ────────────────────────────────────
      const endpoint = config?.url || 'unknown'

      if (status === 401) {
        // Clear stale token & redirect to login (future Sprint 4)
        localStorage.removeItem('shadowstack_token')
        console.error('[API] Authentication expired — cleared token.')
      }

      if (status === 429) {
        console.warn('[API] Rate limited — backing off.')
      }

      // ── Build structured error ──────────────────────────────────────────
      const serverMessage =
        (error.response?.data as Record<string, unknown>)?.message as string ||
        error.message ||
        'An unexpected error occurred'

      const apiError = new ApiError(
        serverMessage,
        status,
        error.code || 'UNKNOWN',
        endpoint,
      )

      if (import.meta.env.DEV) {
        console.error('[API] Error details:', {
          status: apiError.status,
          code: apiError.code,
          endpoint: apiError.endpoint,
          message: apiError.message,
        })
      }

      return Promise.reject(apiError)
    },
  )

  return client
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Singleton instance ────────────────────────────────────────────────────────

const apiClient = createApiClient()

// ── Typed endpoint methods ────────────────────────────────────────────────────

/**
 * Generic GET helper — unwraps the ApiResponse envelope and returns
 * only the `data` payload with proper typing.
 */
async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config)
  return response.data.data
}

// ── Dashboard endpoints ───────────────────────────────────────────────────────

export const dashboardApi = {
  /** Fetch KPI summary cards */
  getKpis: (): Promise<KpiSummaryResponse> =>
    get<KpiSummaryResponse>('/dashboard/kpis'),

  /** Fetch historical daily cost data */
  getHistoricalCosts: (days: number = 30, service?: string): Promise<HistoricalCostResponse> =>
    get<HistoricalCostResponse>('/costs/historical', {
      params: { days, service },
    }),

  /** Fetch ML-predicted future costs */
  getPredictedCosts: (days: number = 30, service?: string): Promise<PredictedCostResponse> =>
    get<PredictedCostResponse>('/costs/predicted', {
      params: { days, service },
    }),

  /** Fetch ML model performance metrics */
  getMlMetrics: (): Promise<MlMetricsResponse> =>
    get<MlMetricsResponse>('/ml/metrics'),

  /** Fetch cost breakdown by AWS service */
  getServiceBreakdown: (days?: number, service?: string): Promise<ServiceBreakdownResponse> =>
    get<ServiceBreakdownResponse>('/costs/services', { params: { days, service } }),

  /** Fetch anomaly detection alerts */
  getAlerts: (): Promise<AlertsResponse> =>
    get<AlertsResponse>('/alerts'),

  /** Fetch top cost-driving resources */
  getTopResources: (days?: number): Promise<TopResourcesResponse> =>
    get<TopResourcesResponse>('/resources/top', { params: { days } }),

  /** Fetch all dashboard data in parallel (composite call) */
  getAllDashboardData: async (days?: number, service?: string) => {
    const [
      kpis,
      historicalCosts,
      predictedCosts,
      mlMetrics,
      serviceBreakdown,
      alerts,
      topResources,
    ] = await Promise.all([
      dashboardApi.getKpis(),
      dashboardApi.getHistoricalCosts(days, service),
      dashboardApi.getPredictedCosts(days, service),
      dashboardApi.getMlMetrics(),
      dashboardApi.getServiceBreakdown(days, service),
      dashboardApi.getAlerts(),
      dashboardApi.getTopResources(days),
    ])

    return {
      kpis,
      historicalCosts,
      predictedCosts,
      mlMetrics,
      serviceBreakdown,
      alerts,
      topResources,
    }
  },
} as const

// ── Export raw instance for edge cases ─────────────────────────────────────────

export default apiClient
