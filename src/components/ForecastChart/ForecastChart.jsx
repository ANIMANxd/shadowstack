import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import './ForecastChart.css'

/**
 * ForecastChart – D3.js area chart with confidence interval bands.
 *
 * Renders ML-predicted cost data with upper/lower confidence bounds
 * as a shaded ribbon, plus the mean prediction line on top.
 *
 * Props:
 *  - data       : Array<{ date: string, predictedValue: number, lowerBound: number, upperBound: number }>
 *  - historical : Array<{ date: string, value: number }>  (optional trailing actuals for visual continuity)
 *  - color      : string (line color)
 *  - confidence : number (e.g. 0.95 for 95% CI)
 */
export default function ForecastChart({
    data = [],
    historical = [],
    color = '#9f7aea',
    confidence = 0.95,
}) {
    const containerRef = useRef(null)
    const svgRef = useRef(null)
    const tooltipRef = useRef(null)
    const [dims, setDims] = useState({ width: 0, height: 0 })

    const margin = { top: 20, right: 20, bottom: 36, left: 52 }

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
        if (!svgRef.current || width === 0 || height === 0 || data.length < 2) return

        const innerW = width - margin.left - margin.right
        const innerH = height - margin.top - margin.bottom

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove()

        const g = svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)

        // Parse dates
        const forecastParsed = data.map(d => ({
            ...d,
            dateObj: new Date(d.date),
        }))

        const historicalParsed = historical.slice(-5).map(d => ({
            ...d,
            dateObj: new Date(d.date),
        }))

        // Combined date domain
        const allDates = [
            ...historicalParsed.map(d => d.dateObj),
            ...forecastParsed.map(d => d.dateObj),
        ]
        const allValues = [
            ...historicalParsed.map(d => d.value),
            ...forecastParsed.flatMap(d => [d.lowerBound, d.upperBound]),
        ]

        const xScale = d3.scaleTime()
            .domain(d3.extent(allDates))
            .range([0, innerW])

        const yPad = (d3.max(allValues) - d3.min(allValues)) * 0.15 || 100
        const yScale = d3.scaleLinear()
            .domain([d3.min(allValues) - yPad, d3.max(allValues) + yPad])
            .range([innerH, 0])
            .nice()

        // ── Grid ──────────────────────────────────────────────────────────────
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(''))

        // ── Axes ──────────────────────────────────────────────────────────────
        g.append('g').attr('class', 'axis axis--x')
            .attr('transform', `translate(0,${innerH})`)
            .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%b %d')))

        g.append('g').attr('class', 'axis axis--y')
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `$${d3.format('.2s')(d)}`))

        // ── Defs & Gradients ──────────────────────────────────────────────────
        const defs = svg.append('defs')
        const ciGradId = 'ci-band-grad'
        const ciGrad = defs.append('linearGradient')
            .attr('id', ciGradId)
            .attr('x1', '0').attr('y1', '0')
            .attr('x2', '0').attr('y2', '1')
        ciGrad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.25)
        ciGrad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.03)

        // ── Vertical divider line (today) ─────────────────────────────────────
        if (historicalParsed.length > 0 && forecastParsed.length > 0) {
            const dividerX = xScale(forecastParsed[0].dateObj)
            g.append('line')
                .attr('x1', dividerX).attr('x2', dividerX)
                .attr('y1', 0).attr('y2', innerH)
                .attr('stroke', 'var(--clr-text-muted)')
                .attr('stroke-dasharray', '6 4')
                .attr('stroke-width', 1)
                .attr('opacity', 0.6)

            g.append('text')
                .attr('x', dividerX + 6).attr('y', 12)
                .attr('fill', 'var(--clr-text-muted)')
                .attr('font-size', '10px')
                .text('Forecast →')
        }

        // ── Confidence interval band ──────────────────────────────────────────
        const ciArea = d3.area()
            .x(d => xScale(d.dateObj))
            .y0(d => yScale(d.lowerBound))
            .y1(d => yScale(d.upperBound))
            .curve(d3.curveCatmullRom.alpha(0.5))

        g.append('path')
            .datum(forecastParsed)
            .attr('class', 'forecast-ci-band')
            .attr('fill', `url(#${ciGradId})`)
            .attr('d', ciArea)

        // ── CI bound lines (dashed) ───────────────────────────────────────────
        const upperLine = d3.line()
            .x(d => xScale(d.dateObj))
            .y(d => yScale(d.upperBound))
            .curve(d3.curveCatmullRom.alpha(0.5))

        const lowerLine = d3.line()
            .x(d => xScale(d.dateObj))
            .y(d => yScale(d.lowerBound))
            .curve(d3.curveCatmullRom.alpha(0.5))

        g.append('path').datum(forecastParsed)
            .attr('fill', 'none')
            .attr('stroke', color).attr('stroke-opacity', 0.3)
            .attr('stroke-width', 1).attr('stroke-dasharray', '4 4')
            .attr('d', upperLine)

        g.append('path').datum(forecastParsed)
            .attr('fill', 'none')
            .attr('stroke', color).attr('stroke-opacity', 0.3)
            .attr('stroke-width', 1).attr('stroke-dasharray', '4 4')
            .attr('d', lowerLine)

        // ── Historical line (solid but faded) ─────────────────────────────────
        if (historicalParsed.length >= 2) {
            const histLine = d3.line()
                .x(d => xScale(d.dateObj))
                .y(d => yScale(d.value))
                .curve(d3.curveCatmullRom.alpha(0.5))

            g.append('path').datum(historicalParsed)
                .attr('fill', 'none')
                .attr('stroke', '#63b3ed')
                .attr('stroke-width', 2)
                .attr('stroke-opacity', 0.6)
                .attr('d', histLine)
        }

        // ── Prediction line (bold) ────────────────────────────────────────────
        const predLine = d3.line()
            .x(d => xScale(d.dateObj))
            .y(d => yScale(d.predictedValue))
            .curve(d3.curveCatmullRom.alpha(0.5))

        g.append('path').datum(forecastParsed)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2.5)
            .attr('stroke-linecap', 'round')
            .attr('d', predLine)

        // ── Tooltip & interaction ─────────────────────────────────────────────
        const bisect = d3.bisector(d => d.dateObj).center
        const focusDot = g.append('circle')
            .attr('r', 5).attr('fill', color)
            .attr('stroke', 'var(--clr-bg-surface)').attr('stroke-width', 2)
            .style('opacity', 0)

        const tooltipEl = tooltipRef.current
        if (!tooltipEl) return

        g.append('rect')
            .attr('width', innerW).attr('height', innerH)
            .attr('fill', 'transparent')
            .on('mousemove', (event) => {
                const [mx] = d3.pointer(event)
                const x0 = xScale.invert(mx)
                const i = bisect(forecastParsed, x0)
                if (i < 0 || i >= forecastParsed.length) return
                const d = forecastParsed[i]
                const px = xScale(d.dateObj) + margin.left
                const py = yScale(d.predictedValue) + margin.top

                focusDot
                    .attr('cx', xScale(d.dateObj))
                    .attr('cy', yScale(d.predictedValue))
                    .style('opacity', 1)

                tooltipEl.classList.remove('forecast-tooltip--hidden')
                tooltipEl.innerHTML = `
                    <div class="forecast-tooltip__label">${d3.timeFormat('%b %d, %Y')(d.dateObj)}</div>
                    <div class="forecast-tooltip__value">$${d.predictedValue.toLocaleString()}</div>
                    <div class="forecast-tooltip__ci">
                        CI: $${d.lowerBound.toLocaleString()} – $${d.upperBound.toLocaleString()}
                    </div>
                `
                const tw = tooltipEl.offsetWidth
                const left = px + tw + 12 > width ? px - tw - 12 : px + 12
                tooltipEl.style.left = `${left}px`
                tooltipEl.style.top = `${py - 20}px`
            })
            .on('mouseleave', () => {
                focusDot.style('opacity', 0)
                tooltipEl.classList.add('forecast-tooltip--hidden')
            })

    }, [data, historical, dims, color, confidence, margin])

    // ── Confidence label ─────────────────────────────────────────────────────
    const ciLabel = `${Math.round(confidence * 100)}% CI`

    return (
        <div className="forecast-chart-wrapper" ref={containerRef}>
            <svg ref={svgRef} aria-label="ML cost forecast chart" role="img" />
            <div
                ref={tooltipRef}
                className="forecast-tooltip forecast-tooltip--hidden"
                aria-hidden="true"
            />
            <div className="forecast-chart__ci-label">
                <span className="forecast-chart__ci-dot" style={{ background: color }} />
                {ciLabel}
            </div>
        </div>
    )
}
