import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
import GlobalFilters from '../GlobalFilters'
import React from 'react'

// Helper component to read current search params for our assertions
const SearchParamsWatcher = ({ onChange }) => {
    const [searchParams] = useSearchParams()
    React.useEffect(() => {
        onChange(searchParams.get('range'), searchParams.get('service'))
    }, [searchParams, onChange])
    return null
}

describe('GlobalFilters', () => {
    it('updates the URL search parameters when a time range is clicked', () => {
        let currentRange = ''
        const handleChange = vi.fn((range) => {
            currentRange = range
        })

        render(
            <MemoryRouter initialEntries={['/']}>
                <GlobalFilters />
                <SearchParamsWatcher onChange={handleChange} />
            </MemoryRouter>
        )

        // Find the 30 Days button
        const thirtyDaysBtn = screen.getByRole('button', { name: /30 Days/i })
        expect(thirtyDaysBtn).toBeInTheDocument()

        // Click it
        fireEvent.click(thirtyDaysBtn)

        // React Router search params should now have range=30D
        expect(currentRange).toBe('30D')
    })
    
    it('allows changing the cloud service via dropdown', () => {
        let currentService = ''
        const handleChange = vi.fn((_, service) => {
            currentService = service
        })

        render(
            <MemoryRouter initialEntries={['/']}>
                <GlobalFilters />
                <SearchParamsWatcher onChange={handleChange} />
            </MemoryRouter>
        )

        // Find the select dropdown
        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()

        // Change it to EC2 Compute
        fireEvent.change(select, { target: { value: 'EC2 Compute' } })

        // React Router search params should now have service=EC2 Compute
        expect(currentService).toBe('EC2 Compute')
    })
})
