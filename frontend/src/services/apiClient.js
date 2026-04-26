/**
 * apiClient.js ΓÇô Centralized Axios service layer for ShadowStack.
 *
 * ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
 * Γöé  PBI-033: API Integration Layer                         Γöé
 * Γöé  ΓÇó Single Axios instance with env-based configuration   Γöé
 * Γöé  ΓÇó Request/response interceptors for auth & error flow  Γöé
 * Γöé  ΓÇó Automatic retry on network failures                  Γöé
 * ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
 */

import axios from 'axios'

// ΓöÇΓöÇ Configuration ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1_000

// ΓöÇΓöÇ Custom error class ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export class ApiError extends Error {
  constructor(message, status, code, endpoint) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.endpoint = endpoint
    this.timestamp = new Date().toISOString()
  }

  /** User-friendly message by HTTP status */
  get userMessage() {
    const messages = {
      400: 'Invalid request ΓÇö please check your input.',
      401: 'Session expired ΓÇö please log in again.',
      403: "You don't have permission to access this resource.",
      404: 'The requested data was not found.',
      408: 'Request timed out ΓÇö please try again.',
      429: 'Too many requests ΓÇö please slow down.',
      500: 'Server error ΓÇö our team has been notified.',
      502: 'Bad gateway ΓÇö the server is temporarily unreachable.',
      503: 'Service temporarily unavailable ΓÇö please try again shortly.',
    }
    return messages[this.status] || `Unexpected error (${this.status}).`
  }
}

// ΓöÇΓöÇ Utility ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ΓöÇΓöÇ Create the Axios instance ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function createApiClient() {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  // ΓöÇΓöÇ Request interceptor ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  client.interceptors.request.use(
    (config) => {
      // Inject auth token if present
      const token = localStorage.getItem('shadowstack_token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Add request ID for tracing
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        config.headers['X-Request-ID'] = crypto.randomUUID()
      }

      if (import.meta.env.DEV) {
        console.debug(
          `%c[API] ΓåÆ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
          'color: #63b3ed; font-weight: bold',
        )
      }

      return config
    },
    (error) => Promise.reject(error),
  )

  // ΓöÇΓöÇ Response interceptor ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  client.interceptors.response.use(
    (response) => {
      if (import.meta.env.DEV) {
        console.debug(
          `%c[API] ΓåÉ ${response.status} ${response.config.url}`,
          'color: #48bb78; font-weight: bold',
        )
      }
      return response
    },
    async (error) => {
      const config = error.config
      const status = error.response?.status || 0

      // ΓöÇΓöÇ Retry logic for 5xx and network errors ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

      // ΓöÇΓöÇ Handle specific status codes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
      const endpoint = config?.url || 'unknown'

      if (status === 401) {
        localStorage.removeItem('shadowstack_token')
        console.error('[API] Authentication expired ΓÇö cleared token.')
      }

      if (status === 429) {
        console.warn('[API] Rate limited ΓÇö backing off.')
      }

      // ΓöÇΓöÇ Build structured error ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
      const serverMessage =
        error.response?.data?.message ||
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

// ΓöÇΓöÇ Singleton instance ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const apiClient = createApiClient()

export default apiClient
