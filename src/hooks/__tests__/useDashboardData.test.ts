import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useDashboardData } from '../useDashboardData'
import * as apiClient from '../../services/apiClient'
import React from 'react'

// Mock the API client
const mockApiError = new Error('Network error')

vi.mock('../../services/apiClient', () => ({
    dashboardApi: {
        getKpis: vi.fn().mockRejectedValue(new Error('Network error')),
        getHistoricalCosts: vi.fn().mockRejectedValue(new Error('Network error')),
        getPredictedCosts: vi.fn().mockRejectedValue(new Error('Network error')),
        getMlMetrics: vi.fn().mockRejectedValue(new Error('Network error')),
        getServiceCosts: vi.fn().mockRejectedValue(new Error('Network error')),
        getAlerts: vi.fn().mockRejectedValue(new Error('Network error')),
        getTopResources: vi.fn().mockRejectedValue(new Error('Network error'))
    },
    ApiError: class ApiError extends Error {
        status: number
        constructor(message: string, status: number = 500) {
            super(message)
            this.name = 'ApiError'
            this.status = status
        }
    }
}))

describe('useDashboardData', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    const wrapper = ({ children, initialEntries = ['/?range=7D&service=All Services'] }: { children: React.ReactNode, initialEntries?: string[] }) => (
        React.createElement(MemoryRouter, { initialEntries }, children)
    )

    it('falls back to mock data if API throws an error in dev environment', async () => {
        const { result } = renderHook(() => useDashboardData(), { wrapper })

        // Let the hook execute its initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // On fallback, it should have populated the data
        expect(result.current.data).not.toBeNull()
        expect(result.current.errorCount).toBe(0) 
        
        // Assert we got mock KPIs
        expect(result.current.data?.kpis).toBeDefined()
    })

    it('syncs correctly with URL parameters (7D filter)', async () => {
        const { result } = renderHook(() => useDashboardData(), { 
            wrapper: ({ children }) => wrapper({ children, initialEntries: ['/?range=7D'] }) 
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Since it's 7D, our mockAdapter limits historicalCosts to exactly 7 entries
        expect(result.current.data?.historicalCosts.daily.length).toBe(7)
    })
    
    it('syncs correctly with URL parameters (30D filter)', async () => {
        const { result } = renderHook(() => useDashboardData(), { 
            wrapper: ({ children }) => wrapper({ children, initialEntries: ['/?range=30D'] }) 
        })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Since it's 30D, our mockAdapter limits historicalCosts to exactly 30 entries
        expect(result.current.data?.historicalCosts.daily.length).toBe(30)
    })
})
