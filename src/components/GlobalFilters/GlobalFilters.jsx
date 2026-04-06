import { useSearchParams } from 'react-router-dom'
import './GlobalFilters.css'

/**
 * GlobalFilters – Time-range and Service filters.
 *
 * Automatically reads and writes to URL search parameters.
 * Provides a clean UI for data filtering.
 */
export default function GlobalFilters() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Default to 30D and 'All Services' if not present in URL
    const activeRange = searchParams.get('range') || '30D'
    const activeService = searchParams.get('service') || 'all'

    const handleRangeChange = (range) => {
        const params = new URLSearchParams(searchParams)
        params.set('range', range)
        setSearchParams(params)
    }

    const handleServiceChange = (e) => {
        const service = e.target.value
        const params = new URLSearchParams(searchParams)
        if (service === 'all') {
            params.delete('service')
        } else {
            params.set('service', service)
        }
        setSearchParams(params)
    }

    const ranges = [
        { label: '7 Days', value: '7D' },
        { label: '30 Days', value: '30D' },
        { label: '90 Days', value: '90D' },
    ]

    // Service options (in a real app, this would be fetched from API)
    const services = [
        { label: 'EC2 Compute', value: 'EC2 Compute' },
        { label: 'RDS Database', value: 'RDS Database' },
        { label: 'S3 Storage', value: 'S3 Storage' },
        { label: 'CloudFront CDN', value: 'CloudFront CDN' },
        { label: 'Lambda', value: 'Lambda' },
    ]

    return (
        <div className="global-filters" role="search" aria-label="Data filters">
            {/* Time Range Filter */}
            <div className="global-filters__group">
                <span className="global-filters__label">Time Range</span>
                <div className="global-filters__pills" role="group" aria-label="Select time range">
                    {ranges.map((r) => (
                        <button
                            key={r.value}
                            className={`global-filters__pill ${activeRange === r.value ? 'active' : ''}`}
                            onClick={() => handleRangeChange(r.value)}
                            aria-pressed={activeRange === r.value}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="global-filters__divider" role="separator" />

            {/* Service Filter */}
            <div className="global-filters__group">
                <label className="global-filters__label" htmlFor="service-filter">
                    Cloud Service
                </label>
                <div className="global-filters__select-wrapper">
                    <select
                        id="service-filter"
                        className="global-filters__select"
                        value={activeService}
                        onChange={handleServiceChange}
                    >
                        <option value="all">All Services</option>
                        {services.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="global-filters__select-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}
