import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Predictions from '../Predictions'
import React from 'react'

// Mock the hook so we don't really do API calls
vi.mock('../../../hooks/useDashboardData', () => ({
    useDashboardData: vi.fn(() => ({
        data: {
            kpis: { kpis: [], generatedAt: new Date().toISOString() },
            historicalCosts: {
                daily: [{ date: '2026-01-01', value: 100 }],
                total: 100,
                periodStart: '2026-01-01',
                periodEnd: '2026-01-01',
                currency: 'USD',
            },
            predictedCosts: {
                forecast: [{ date: '2026-01-02', predictedValue: 150, lowerBound: 120, upperBound: 180 }],
                modelVersion: 'mock-v1',
                confidenceLevel: 0.95,
                generatedAt: new Date().toISOString(),
            },
            serviceBreakdown: { services: [], total: 0, period: 'Last 30 days' },
            mlMetrics: {
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
                        lastTrainedAt: new Date().toISOString(),
                        dataPointsUsed: 2847,
                    }
                ],
                activeModelId: 'shadowstack-lstm-v1'
            },
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

describe('Predictions Page', () => {
    it('renders the core widgets and ensures D3 components do not crash', () => {
        render(
            <MemoryRouter>
                <Predictions />
            </MemoryRouter>
        )

        // Title should be present
        expect(screen.getByText(/Model Performance/i)).toBeInTheDocument()
        
        // Ensure the charts wrapper renders
        expect(screen.getByText(/Predicted vs. Actual Cost/i)).toBeInTheDocument()
        expect(screen.getByText(/Scoring Metrics/i)).toBeInTheDocument()
        // Check ML Metrics rendered a model
        expect(screen.getByText(/LSTM/i)).toBeInTheDocument()
    })
})
