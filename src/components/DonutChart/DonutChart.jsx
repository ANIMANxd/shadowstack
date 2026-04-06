import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import './DonutChart.css'

/**
 * DonutChart – animated D3.js donut/ring chart.
 *
 * Props:
 *  - data      : Array<{ name: string, cost: number, percentage: number, color: string }>
 *  - total     : number  (center label value)
 *  - label     : string  (center label text)
 *  - thickness : number  (arc thickness, default 28)
 */
export default function DonutChart({
    data = [],
    total = 0,
    label = 'Total',
    thickness = 28,
}) {
    const containerRef = useRef(null)
    const svgRef = useRef(null)
    const [dims, setDims] = useState({ width: 0, height: 0 })
    const [activeSlice, setActiveSlice] = useState(null)

    // ── Resize observer ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            setDims({ width, height })
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    // ── D3 render ────────────────────────────────────────────────────────────
    useEffect(() => {
        const { width, height } = dims
        if (!svgRef.current || width === 0 || height === 0 || data.length === 0) return

        const size = Math.min(width, height)
        const radius = size / 2
        const innerRadius = radius - thickness
        const outerRadius = radius - 4

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove()

        svg.attr('viewBox', `0 0 ${size} ${size}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')

        const g = svg.append('g')
            .attr('transform', `translate(${size / 2},${size / 2})`)

        // Pie generator
        const pie = d3.pie()
            .value(d => d.cost)
            .sort(null)
            .padAngle(0.02)

        // Arc generators
        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
            .cornerRadius(4)

        const arcHover = d3.arc()
            .innerRadius(innerRadius - 2)
            .outerRadius(outerRadius + 4)
            .cornerRadius(4)

        // Draw slices
        const slices = g.selectAll('.donut-slice')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('class', 'donut-slice')
            .attr('fill', d => d.data.color)
            .attr('d', arc)
            .attr('stroke', 'var(--clr-bg-surface)')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .style('transition', 'opacity 200ms ease')

        // Interaction
        slices.on('mouseenter', function (event, d) {
            d3.select(this)
                .transition().duration(200)
                .attr('d', arcHover)
                .attr('filter', 'drop-shadow(0 0 8px rgba(0,0,0,0.4))')

            setActiveSlice(d.data)
        })
        .on('mouseleave', function () {
            d3.select(this)
                .transition().duration(200)
                .attr('d', arc)
                .attr('filter', null)

            setActiveSlice(null)
        })

        // Entrance animation
        slices.transition()
            .duration(800)
            .attrTween('d', function (d) {
                const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
                return t => arc(interpolate(t))
            })

    }, [data, dims, thickness])

    const displayValue = activeSlice
        ? `$${activeSlice.cost.toLocaleString()}`
        : `$${total.toLocaleString()}`

    const displayLabel = activeSlice
        ? activeSlice.name
        : label

    const displayPct = activeSlice
        ? `${activeSlice.percentage}%`
        : ''

    return (
        <div className="donut-chart-wrapper" ref={containerRef}>
            <svg ref={svgRef} aria-label="Service cost breakdown donut chart" role="img" />
            <div className="donut-chart__center">
                <span className="donut-chart__center-value">{displayValue}</span>
                <span className="donut-chart__center-label">{displayLabel}</span>
                {displayPct && (
                    <span className="donut-chart__center-pct">{displayPct}</span>
                )}
            </div>
        </div>
    )
}
