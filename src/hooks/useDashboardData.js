/**
 * useDashboardData.js – Custom React hook for real-time dashboard updates.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  PBI-040: Real-Time Dashboard Updates                   │
 * │  • 30-second configurable polling interval              │
 * │  • Loading / error / stale state management             │
 * │  • Graceful fallback to mock data during development    │
 * │  • Manual refresh & pause/resume controls               │
 * │  • Automatic cleanup on unmount                         │
 * └─────────────────────────────────────────────────────────┘
 *
 * NOTE: This hook is ready for Sprint 5 API integration.
 * Currently returns mock data from src/data/mockData.js.
 * When the backend is live, swap the fetch call to use apiClient.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  KPI_DATA,
  COST_TREND_DATA,
  SERVICE_SPEND,
  RECENT_ALERTS,
  TOP_RESOURCES,
} from '../data/mockData'

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_POLLING_MS = Number(
  import.meta.env.VITE_POLLING_INTERVAL_MS || '30000',
)

/**
 * Build a mock dashboard payload from the local mock data.
 */
function getMockDashboardData() {
  return {
    kpis: KPI_DATA,
    historicalCosts: COST_TREND_DATA,
    serviceBreakdown: SERVICE_SPEND,
    alerts: RECENT_ALERTS,
    topResources: TOP_RESOURCES,
  }
}

// ── Hook implementation ───────────────────────────────────────────────────────

export function useDashboardData(options = {}) {
  const {
    pollingInterval = DEFAULT_POLLING_MS,
    autoStart = true,
    maxConsecutiveErrors = 5,
  } = options

  // ── State ─────────────────────────────────────────────────────────────────
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isPolling, setIsPolling] = useState(autoStart)
  const [errorCount, setErrorCount] = useState(0)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const intervalRef = useRef(null)
  const isMountedRef = useRef(true)
  const isFetchingRef = useRef(false)

  // ── Fetch function ────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (isBackground = false) => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      if (!isBackground) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        // Simulate network delay for realistic UX
        await new Promise((r) => setTimeout(r, 300))
        const dashboardData = getMockDashboardData()

        if (isMountedRef.current) {
          setData(dashboardData)
          setError(null)
          setErrorCount(0)
          setLastUpdated(new Date().toISOString())
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setErrorCount((prev) => {
            const next = prev + 1
            if (next >= maxConsecutiveErrors) {
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
    [maxConsecutiveErrors],
  )

  // ── Actions ───────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await fetchData(!!data)
  }, [fetchData, data])

  const pause = useCallback(() => setIsPolling(false), [])
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
  }, [fetchData])

  // ── Polling lifecycle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (isPolling && pollingInterval > 0) {
      intervalRef.current = setInterval(() => fetchData(true), pollingInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPolling, pollingInterval, fetchData])

  // ── Pause polling when tab is hidden ──────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (isPolling) {
        fetchData(true)
        intervalRef.current = setInterval(() => fetchData(true), pollingInterval)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isPolling, pollingInterval, fetchData])

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
