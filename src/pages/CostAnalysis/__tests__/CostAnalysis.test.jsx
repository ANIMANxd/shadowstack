import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CostAnalysis from '../CostAnalysis'
import React from 'react'

// Mock the hook so we don't really do API calls, we just provide deterministic data for the render test
vi.mock('../../../hooks/useDashboardData', () => ({
    useDashboardData: vi.fn(() => ({
        data: {
            kpis: {
                kpis: [],
                generatedAt: new Date().toISOString(),
            },
            historicalCosts: { daily: [], total: 0, periodStart: '', periodEnd: '', currency: 'USD' },
            predictedCosts: { forecast: [], modelVersion: 'mock-v1', confidenceLevel: 0.95, generatedAt: new Date().toISOString() },
            serviceBreakdown: {
                services: [
                    { name: 'EC2 Compute', cost: 5000, percentage: 32, color: '#63b3ed', trend: 'up', trendValue: '5%' }
                ],
                total: 5000,
                period: 'Last 30 days',
            },
            mlMetrics: { models: [], activeModelId: '' },
            alerts: { alerts: [], activeCount: 0 },
            topResources: { resources: [], period: 'Last 30 days' },
        },
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdated: new Date().toISOString(),
        isPolling: true,
        errorCount: 0,
        refresh: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        clearError: vi.fn()
    }))
}))

describe('CostAnalysis Page', () => {
    it('renders the core widgets and ensures D3 components do not crash', () => {
        render(
            <MemoryRouter>
                <CostAnalysis />
            </MemoryRouter>
        )

        // Title should be present (actual h1 text is "Trend Insights")
        expect(screen.getByText(/Trend Insights/i)).toBeInTheDocument()
        
        // Ensure the charts wrapper renders (verifying no D3 crash during mount)
        // Since we mocked ResizeObserver in setupTests, D3 won't blow up.
        expect(screen.getByText(/Actual vs Predicted Series/i)).toBeInTheDocument()
        expect(screen.getByText(/Service Cost Distribution/i)).toBeInTheDocument()
    })
})
