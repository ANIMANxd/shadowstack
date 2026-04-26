/**
 * useDashboardData.js – Custom React hook for real-time dashboard updates.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import apiClient, { ApiError } from '../services/apiClient'
import {
  KPI_DATA,
  COST_TREND_DATA,
  SERVICE_SPEND,
  RECENT_ALERTS,
  TOP_RESOURCES,
} from '../data/mockData'

const DEFAULT_POLLING_MS = Number(
  import.meta.env.VITE_POLLING_INTERVAL_MS || '30000',
)

function getMockDashboardData() {
  return {
    kpis: KPI_DATA,
    historicalCosts: COST_TREND_DATA,
    serviceBreakdown: SERVICE_SPEND,
    alerts: RECENT_ALERTS,
    topResources: TOP_RESOURCES,
    predictions: []
  }
}

export function useDashboardData(options = {}) {
  const {
    pollingInterval = DEFAULT_POLLING_MS,
    autoStart = true,
    maxConsecutiveErrors = 5,
  } = options

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isPolling, setIsPolling] = useState(autoStart)
  const [errorCount, setErrorCount] = useState(0)

  const intervalRef = useRef(null)
  const isMountedRef = useRef(true)
  const isFetchingRef = useRef(false)

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
        const repo = localStorage.getItem('connected_repo')
        
        // PBI-063: Query real backend data scoped to the connected repository
        const [predictionsRes, costsRes] = await Promise.all([
          apiClient.get('/api/predictions', { params: { repo: repo } }),
          apiClient.get('/api/costs/history', { params: { repo: repo } })
        ])

        const dashboardData = {
          ...costsRes.data,
          predictions: predictionsRes.data?.data || []
        }

        if (isMountedRef.current) {
          setData(dashboardData)
          setError(null)
          setErrorCount(0)
          setLastUpdated(new Date().toISOString())
        }
      } catch (err) {
        // Fallback to mock data strictly ONLY on 500 or Network Errors
        const isNetworkOrServerError =
          err?.status === 0 || 
          err?.status >= 500 || 
          err?.code === 'ERR_NETWORK' ||
          err instanceof ApiError && err.status >= 500

        if (import.meta.env.DEV && isNetworkOrServerError) {
          console.warn('[useDashboardData] Backend unreachable — falling back to mock data.')
          if (isMountedRef.current) {
            setData(getMockDashboardData())
            setError(null)
            setErrorCount(0)
            setLastUpdated(new Date().toISOString())
          }
        } else {
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

  useEffect(() => {
    isMountedRef.current = true
    fetchData(false)
    return () => {
      isMountedRef.current = false
    }
  }, [fetchData])

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
