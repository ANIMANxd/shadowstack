/**
 * useDashboardData.ts – Custom React hook for real-time dashboard updates.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  PBI-040: Real-Time Dashboard Updates                   │
 * │  • 30-second configurable polling interval              │
 * │  • Loading / error / stale state management             │
 * │  • Graceful fallback to mock data during development    │
 * │  • Manual refresh & pause/resume controls               │
 * │  • Automatic cleanup on unmount                         │
 * └─────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { dashboardApi, ApiError } from '../services/apiClient'
import type { DashboardData } from '../types/api.types'
import { getMockDashboardData } from '../data/mockAdapter'

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_POLLING_MS = Number(
  import.meta.env.VITE_POLLING_INTERVAL_MS || '30000',
)

// ── Hook state type ───────────────────────────────────────────────────────────

export interface DashboardState {
  /** Full dashboard payload — null only before the first successful load */
  data: DashboardData | null

  /** True during the initial fetch (not during background refreshes) */
  isLoading: boolean

  /** True during any background refresh after the first load */
  isRefreshing: boolean

  /** Most recent error, or null if the last fetch succeeded */
  error: ApiError | Error | null

  /** ISO timestamp of the last successful data fetch */
  lastUpdated: string | null

  /** Whether polling is currently active */
  isPolling: boolean

  /** How many consecutive errors have occurred */
  errorCount: number
}

export interface DashboardActions {
  /** Trigger an immediate refresh */
  refresh: () => Promise<void>

  /** Pause automatic polling */
  pause: () => void

  /** Resume automatic polling */
  resume: () => void

  /** Clear the current error state */
  clearError: () => void
}

export type UseDashboardDataReturn = DashboardState & DashboardActions

// ── Configuration ─────────────────────────────────────────────────────────────

interface UseDashboardDataOptions {
  /** Polling interval in milliseconds (default: 30 000) */
  pollingInterval?: number

  /** Start polling immediately on mount (default: true) */
  autoStart?: boolean

  /** Use mock data instead of live API (default: false in prod, true when API is unreachable) */
  useMockData?: boolean

  /** Maximum consecutive errors before auto-pausing (default: 5) */
  maxConsecutiveErrors?: number
}

// ── Hook implementation ───────────────────────────────────────────────────────

export function useDashboardData(
  options: UseDashboardDataOptions = {},
): UseDashboardDataReturn {
  const {
    pollingInterval = DEFAULT_POLLING_MS,
    autoStart = true,
    useMockData = false,
    maxConsecutiveErrors = 5,
  } = options

  // ── State ─────────────────────────────────────────────────────────────────
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(autoStart)
  const [errorCount, setErrorCount] = useState(0)

  // ── Refs (stable across renders) ──────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)
  const isFetchingRef = useRef(false)

  // ── Fetch function ────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (isBackground = false) => {
      // Prevent overlapping requests
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      if (!isBackground) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        let dashboardData: DashboardData

        if (useMockData) {
          // Simulate network delay for realistic UX
          await new Promise(r => setTimeout(r, 400))
          dashboardData = getMockDashboardData()
        } else {
          try {
            dashboardData = await dashboardApi.getAllDashboardData()
          } catch (apiErr) {
            // If the API is unreachable in dev mode, fall back to mock data
            if (import.meta.env.DEV) {
              console.warn(
                '[useDashboardData] API unreachable — falling back to mock data.',
                apiErr,
              )
              dashboardData = getMockDashboardData()
            } else {
              throw apiErr
            }
          }
        }

        // Only update state if the component is still mounted
        if (isMountedRef.current) {
          setData(dashboardData)
          setError(null)
          setErrorCount(0)
          setLastUpdated(new Date().toISOString())
        }
      } catch (err) {
        if (isMountedRef.current) {
          const wrappedError =
            err instanceof ApiError || err instanceof Error
              ? err
              : new Error(String(err))

          setError(wrappedError)
          setErrorCount(prev => {
            const next = prev + 1
            // Auto-pause after too many consecutive failures
            if (next >= maxConsecutiveErrors) {
              console.error(
                `[useDashboardData] ${next} consecutive errors — auto-pausing polling.`,
              )
              setIsPolling(false)
            }
            return next
          })
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
        isFetchingRef.current = false
      }
    },
    [useMockData, maxConsecutiveErrors],
  )

  // ── Actions ───────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await fetchData(!!data)
  }, [fetchData, data])

  const pause = useCallback(() => {
    setIsPolling(false)
  }, [])

  const resume = useCallback(() => {
    setErrorCount(0)
    setIsPolling(true)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setErrorCount(0)
  }, [])

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true
    fetchData(false)

    return () => {
      isMountedRef.current = false
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Polling lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (isPolling && pollingInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(true)
      }, pollingInterval)

      if (import.meta.env.DEV) {
        console.debug(
          `[useDashboardData] Polling started — interval: ${pollingInterval / 1000}s`,
        )
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null

        if (import.meta.env.DEV) {
          console.debug('[useDashboardData] Polling stopped.')
        }
      }
    }
  }, [isPolling, pollingInterval, fetchData])

  // ── Pause polling when tab is hidden (save resources) ─────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (isPolling) {
        // Tab is visible again — do an immediate refresh then restart timer
        fetchData(true)
        intervalRef.current = setInterval(() => {
          fetchData(true)
        }, pollingInterval)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isPolling, pollingInterval, fetchData])

  // ── Return value ──────────────────────────────────────────────────────────
  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    isPolling,
    errorCount,
    refresh,
    pause,
    resume,
    clearError,
  }
}

export default useDashboardData
