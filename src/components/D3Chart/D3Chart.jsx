import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import './D3Chart.css'

/**
 * D3Chart – a safe, reusable D3.js wrapper for React.
 *
 * React owns the DOM node lifecycle; D3 only operates INSIDE the svg ref,
 * preventing VirtualDOM conflicts.
 *
 * Props:
 *  - data        : Array<{ date: Date, value: number }>
 *  - color       : string  (stroke/fill color, defaults to CSS primary)
 *  - label       : string  (y-axis unit label)
 *  - formatValue : (val: number) => string  (tooltip formatter)
 *  - margin      : { top, right, bottom, left }
 */
export default function D3Chart({
    data = [],
    color = '#63b3ed',
    label = 'Value',
    formatValue = (v) => `$${v.toLocaleString()}`,
    margin = { top: 16, right: 16, bottom: 36, left: 52 },
}) {
    const containerRef = useRef(null)
    const svgRef = useRef(null)
    const tooltipRef = useRef(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    // ── Observe container size ──────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            setDimensions({ width, height })
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    // ── D3 render – runs whenever data or dimensions change ─────────────────
    useEffect(() => {
        const { width, height } = dimensions
        // Guard: nothing to render
        if (!svgRef.current || width === 0 || height === 0 || data.length < 2) return

        const innerW = width - margin.left - margin.right
        const innerH = height - margin.top - margin.bottom

        // Select & clear previous render
        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove()

        // Root group
        const g = svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)

        // ── Scales ────────────────────────────────────────────────────────────
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, innerW])

        const yExtent = d3.extent(data, d => d.value)
        const yPad = (yExtent[1] - yExtent[0]) * 0.15 || 10
        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPad, yExtent[1] + yPad])
            .range([innerH, 0])
            .nice()

        // ── Grid ──────────────────────────────────────────────────────────────
        g.append('g')
            .attr('class', 'grid')
            .call(
                d3.axisLeft(yScale)
                    .ticks(5)
                    .tickSize(-innerW)
                    .tickFormat('')
            )

        // ── Axes ──────────────────────────────────────────────────────────────
        g.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(0,${innerH})`)
            .call(
                d3.axisBottom(xScale)
                    .ticks(6)
                    .tickFormat(d3.timeFormat('%b %d'))
            )

        g.append('g')
            .attr('class', 'axis axis--y')
            .call(
                d3.axisLeft(yScale)
                    .ticks(5)
                    .tickFormat(d => `$${d3.format('.2s')(d)}`)
            )

        // Y-axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 12)
            .attr('x', -innerH / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--clr-text-muted)')
            .attr('font-size', '10px')
            .text(label)

        // ── Gradient definition ───────────────────────────────────────────────
        const gradId = `area-grad-${color.replace('#', '')}`
        const defs = svg.append('defs')
        const grad = defs.append('linearGradient')
            .attr('id', gradId)
            .attr('x1', '0').attr('y1', '0')
            .attr('x2', '0').attr('y2', '1')

        grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.35)
        grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.02)

        // ── Area path ─────────────────────────────────────────────────────────
        const areaGen = d3.area()
            .x(d => xScale(d.date))
            .y0(innerH)
            .y1(d => yScale(d.value))
            .curve(d3.curveCatmullRom.alpha(0.5))

        g.append('path')
            .datum(data)
            .attr('class', 'd3chart-area')
            .attr('fill', `url(#${gradId})`)
            .attr('d', areaGen)

        // ── Line path ─────────────────────────────────────────────────────────
        const lineGen = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.value))
            .curve(d3.curveCatmullRom.alpha(0.5))

        g.append('path')
            .datum(data)
            .attr('class', 'd3chart-line')
            .attr('stroke', color)
            .attr('d', lineGen)

        // ── Tooltip + bisector ────────────────────────────────────────────────
        const bisect = d3.bisector(d => d.date).center
        const focusDot = g.append('circle')
            .attr('r', 5)
            .attr('fill', color)
            .attr('stroke', 'var(--clr-bg-surface)')
            .attr('stroke-width', 2)
            .style('opacity', 0)

        const tooltipEl = tooltipRef.current
        if (!tooltipEl) return

        // Invisible overlay for mouse events
        g.append('rect')
            .attr('width', innerW)
            .attr('height', innerH)
            .attr('fill', 'transparent')
            .on('mousemove', (event) => {
                const [mx] = d3.pointer(event)
                const x0 = xScale.invert(mx)
                const i = bisect(data, x0)
                if (i < 0 || i >= data.length) return
                const d = data[i]
                const px = xScale(d.date) + margin.left
                const py = yScale(d.value) + margin.top

                focusDot
                    .attr('cx', xScale(d.date))
                    .attr('cy', yScale(d.value))
                    .style('opacity', 1)

                tooltipEl.classList.remove('d3chart-tooltip--hidden')
                tooltipEl.innerHTML = `
          <div class="d3chart-tooltip__label">${d3.timeFormat('%b %d, %Y')(d.date)}</div>
          <div class="d3chart-tooltip__value">${formatValue(d.value)}</div>
        `
                // Position tooltip (keep in bounds)
                const tw = tooltipEl.offsetWidth
                const left = px + tw + 12 > width ? px - tw - 12 : px + 12
                tooltipEl.style.left = `${left}px`
                tooltipEl.style.top = `${py - 20}px`
            })
            .on('mouseleave', () => {
                focusDot.style('opacity', 0)
                tooltipEl.classList.add('d3chart-tooltip--hidden')
            })

    }, [data, dimensions, color, label, formatValue, margin])

    return (
        <div className="d3chart-wrapper" ref={containerRef}>
            <svg ref={svgRef} aria-label="Cost trend chart" role="img" />
            <div
                ref={tooltipRef}
                className="d3chart-tooltip d3chart-tooltip--hidden"
                aria-hidden="true"
            />
        </div>
    )
}
