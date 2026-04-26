import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CostAnalysis from '../CostAnalysis'
import React from 'react'

vi.mock('../../../hooks/useDashboardData', () => {
    const hookData = {
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
    }
    const mockHook = vi.fn(() => hookData)
    return {
        useDashboardData: mockHook,
        default: mockHook
    }
})

describe('CostAnalysis Page', () => {
    it('renders the core widgets and ensures D3 components do not crash', () => {
        render(
            <MemoryRouter>
                <CostAnalysis />
            </MemoryRouter>
        )

        // Title should be present
        expect(screen.getByText(/Cost Analysis/i)).toBeInTheDocument()
        
        // Ensure the charts wrapper renders
        expect(screen.getByText(/Total This Month/i)).toBeInTheDocument()
        expect(screen.getByText(/Cost Over Time/i)).toBeInTheDocument()
    })
})
