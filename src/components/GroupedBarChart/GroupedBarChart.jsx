import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import './GroupedBarChart.css'

/**
 * GroupedBarChart – D3.js paired bar chart for Predicted vs Actuals.
 *
 * Props:
 *  - data       : Array<{ label: string, actual: number, predicted: number }>
 *  - colors     : { actual: string, predicted: string }
 */
export default function GroupedBarChart({
    data = [],
    colors = { actual: '#63b3ed', predicted: '#9f7aea' },
}) {
    const containerRef = useRef(null)
    const svgRef = useRef(null)
    const tooltipRef = useRef(null)
    const [dims, setDims] = useState({ width: 0, height: 0 })

    const margin = { top: 20, right: 20, bottom: 40, left: 50 }

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

        const innerW = width - margin.left - margin.right
        const innerH = height - margin.top - margin.bottom

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove()

        const g = svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)

        // Subgroups for actual vs predicted
        const subgroups = ['actual', 'predicted']
        const groups = data.map(d => d.label)

        const maxVal = d3.max(data, d => Math.max(d.actual, d.predicted)) || 100

        // Scales
        const x0 = d3.scaleBand()
            .domain(groups)
            .range([0, innerW])
            .padding(0.2)

        const x1 = d3.scaleBand()
            .domain(subgroups)
            .range([0, x0.bandwidth()])
            .padding(0.05)

        const y = d3.scaleLinear()
            .domain([0, maxVal * 1.1]) // 10% headroom
            .range([innerH, 0])
            .nice()

        // Colors
        const colorScale = d3.scaleOrdinal()
            .domain(subgroups)
            .range([colors.actual, colors.predicted])

        // Grid
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''))

        // X Axis
        g.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(0,${innerH})`)
            .call(d3.axisBottom(x0).tickSizeOuter(0))
            .selectAll('text')
            .attr('transform', 'translate(-10,0)rotate(-45)')
            .style('text-anchor', 'end')

        // Y Axis
        g.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d3.format('.2s')(d)}`))

        // Tooltip setup
        const tooltipEl = tooltipRef.current

        // Draw Bars
        const barGroups = g.selectAll('.bar-group')
            .data(data)
            .join('g')
            .attr('class', 'bar-group')
            .attr('transform', d => `translate(${x0(d.label)},0)`)

        barGroups.selectAll('rect')
            .data(d => subgroups.map(key => ({ key, value: d[key], data: d })))
            .join('rect')
            .attr('x', d => x1(d.key))
            .attr('width', x1.bandwidth())
            .attr('y', d => y(d.value))
            .attr('height', d => Math.max(0, innerH - y(d.value)))
            .attr('fill', d => colorScale(d.key))
            .attr('rx', 3)
            .on('mousemove', (event, d) => {
                const variance = ((d.data.actual - d.data.predicted) / d.data.predicted * 100).toFixed(1)
                const isOver = d.data.actual > d.data.predicted
                const sign = isOver ? '+' : ''

                d3.select(event.currentTarget).attr('fill', d3.color(colorScale(d.key)).brighter(0.5))

                tooltipEl.classList.remove('hidden')
                tooltipEl.innerHTML = `
                    <div class="grouped-tooltip__label">${d.data.label}</div>
                    <div class="grouped-tooltip__row">
                        <span class="grouped-tooltip__dot" style="background:${colors.actual}"></span>
                        Actual: <strong>$${d.data.actual.toLocaleString()}</strong>
                    </div>
                    <div class="grouped-tooltip__row">
                        <span class="grouped-tooltip__dot" style="background:${colors.predicted}"></span>
                        Predicted: <strong>$${d.data.predicted.toLocaleString()}</strong>
                    </div>
                    <div class="grouped-tooltip__variance ${isOver ? 'over' : 'under'}">
                        Variance: ${sign}${variance}%
                    </div>
                `
                // Position tooltip
                const [mx, my] = d3.pointer(event, svgRef.current)
                tooltipEl.style.left = `${mx + 15}px`
                tooltipEl.style.top = `${my - 20}px`
            })
            .on('mouseleave', (event, d) => {
                d3.select(event.currentTarget).attr('fill', colorScale(d.key))
                tooltipEl.classList.add('hidden')
            })

    }, [data, dims, colors])

    return (
        <div className="grouped-chart-wrapper">
            <div className="grouped-chart-container" ref={containerRef}>
                <svg ref={svgRef} aria-label="Predicted vs Actual Bar Chart" role="img" />
                <div
                    ref={tooltipRef}
                    className="grouped-tooltip hidden"
                    aria-hidden="true"
                />
            </div>
            {/* Base Legend */}
            <div className="grouped-chart__legend">
                <div className="grouped-chart__legend-item">
                    <div className="grouped-chart__legend-swatch" style={{ background: colors.actual }} />
                    <span>Actual Cost</span>
                </div>
                <div className="grouped-chart__legend-item">
                    <div className="grouped-chart__legend-swatch" style={{ background: colors.predicted }} />
                    <span>Predicted Limit</span>
                </div>
            </div>
        </div>
    )
}
