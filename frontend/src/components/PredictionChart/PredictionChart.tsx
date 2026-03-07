/**
 * PredictionChart – D3 area/line chart extended with:
 *  - Historical spend (solid line + gradient fill)
 *  - ML forecast (dashed line)
 *  - Confidence band (semi-transparent shaded area between ci_upper / ci_lower)
 *  - Vertical "TODAY" divider
 *  - Tooltip distinguishing historical vs. forecast data
 */
import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import type { PredictionData } from '../../hooks/useApi'
import type { DataPoint } from '../../data/mockData'
import './PredictionChart.css'

interface Margin { top: number; right: number; bottom: number; left: number }

interface PredictionChartProps {
    historicalData: DataPoint[]
    prediction: PredictionData
    margin?: Margin
}

export default function PredictionChart({
    historicalData,
    prediction,
    margin = { top: 20, right: 24, bottom: 38, left: 56 },
}: PredictionChartProps): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const [dims, setDims] = useState({ width: 0, height: 0 })

    // ── Observe container ───────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return
        const ro = new ResizeObserver(([e]) => {
            const { width, height } = e.contentRect
            setDims({ width, height })
        })
        ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [])

    // ── D3 render ───────────────────────────────────────────────────────────
    useEffect(() => {
        const { width, height } = dims
        if (!svgRef.current || width === 0 || height === 0 || historicalData.length < 2) return

        const W = width - margin.left - margin.right
        const H = height - margin.top - margin.bottom

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove()

        // ── Combined domain ─────────────────────────────────────────────────
        const allPoints = [
            ...historicalData,
            ...prediction.forecast,
            ...prediction.ci_upper,
            ...prediction.ci_lower,
        ]

        const xScale = d3.scaleTime()
            .domain(d3.extent(allPoints, d => d.date) as [Date, Date])
            .range([0, W])

        const yExtent = d3.extent(allPoints, d => d.value) as [number, number]
        const yPad = (yExtent[1] - yExtent[0]) * 0.15 || 50
        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPad, yExtent[1] + yPad])
            .range([H, 0])
            .nice()

        // ── Defs (gradients) ────────────────────────────────────────────────
        const defs = svg.append('defs')

        // Historical gradient
        const histGrad = defs.append('linearGradient')
            .attr('id', 'hist-grad').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
        histGrad.append('stop').attr('offset', '0%').attr('stop-color', 'var(--clr-primary)').attr('stop-opacity', 0.3)
        histGrad.append('stop').attr('offset', '100%').attr('stop-color', 'var(--clr-primary)').attr('stop-opacity', 0.02)

        // Forecast gradient
        const foreGrad = defs.append('linearGradient')
            .attr('id', 'fore-grad').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
        foreGrad.append('stop').attr('offset', '0%').attr('stop-color', 'var(--clr-secondary)').attr('stop-opacity', 0.25)
        foreGrad.append('stop').attr('offset', '100%').attr('stop-color', 'var(--clr-secondary)').attr('stop-opacity', 0.02)

        const root = svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)

        // ── Grid ────────────────────────────────────────────────────────────
        root.append('g').attr('class', 'grid')
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-W).tickFormat(() => ''))

        // ── X axis ──────────────────────────────────────────────────────────
        root.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(0,${H})`)
            .call(d3.axisBottom<Date>(xScale as d3.ScaleTime<number, number>)
                .ticks(7)
                .tickFormat(d3.timeFormat('%b %d')))

        // ── Y axis ──────────────────────────────────────────────────────────
        root.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(yScale).ticks(5)
                .tickFormat(d => `$${d3.format('.2s')(d as number)}`))

        // Y-axis label
        root.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 14).attr('x', -H / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--clr-text-muted)')
            .attr('font-size', '10px')
            .text('USD / day')

        // ── TODAY divider ────────────────────────────────────────────────────
        const lastHistDate = historicalData[historicalData.length - 1].date
        const todayX = xScale(lastHistDate)

        root.append('line')
            .attr('class', 'pred-today-line')
            .attr('x1', todayX).attr('x2', todayX)
            .attr('y1', 0).attr('y2', H)

        root.append('text')
            .attr('class', 'pred-today-label')
            .attr('x', todayX + 5).attr('y', 12)
            .text('TODAY')

        // ── Confidence band ─────────────────────────────────────────────────
        const bandGen = d3.area<{ upper: DataPoint; lower: DataPoint }>()
            .x(d => xScale(d.upper.date))
            .y0(d => yScale(d.lower.value))
            .y1(d => yScale(d.upper.value))
            .curve(d3.curveCatmullRom.alpha(0.5))

        const bandData = prediction.ci_upper.map((u, i) => ({
            upper: u,
            lower: prediction.ci_lower[i] ?? u,
        }))

        root.append('path')
            .datum(bandData)
            .attr('class', 'pred-ci-band')
            .attr('d', bandGen)

        // ── Historical area ─────────────────────────────────────────────────
        const histArea = d3.area<DataPoint>()
            .x(d => xScale(d.date)).y0(H).y1(d => yScale(d.value))
            .curve(d3.curveCatmullRom.alpha(0.5))

        root.append('path')
            .datum(historicalData)
            .attr('class', 'pred-hist-area')
            .attr('fill', 'url(#hist-grad)')
            .attr('d', histArea)

        // ── Historical line ─────────────────────────────────────────────────
        const histLine = d3.line<DataPoint>()
            .x(d => xScale(d.date)).y(d => yScale(d.value))
            .curve(d3.curveCatmullRom.alpha(0.5))

        root.append('path')
            .datum(historicalData)
            .attr('class', 'pred-hist-line')
            .attr('d', histLine)

        // ── Forecast area ───────────────────────────────────────────────────
        // Bridge the gap: prepend last historical point so lines connect
        const foreData: DataPoint[] = [historicalData[historicalData.length - 1], ...prediction.forecast]

        const foreArea = d3.area<DataPoint>()
            .x(d => xScale(d.date)).y0(H).y1(d => yScale(d.value))
            .curve(d3.curveCatmullRom.alpha(0.5))

        root.append('path')
            .datum(foreData)
            .attr('class', 'pred-fore-area')
            .attr('fill', 'url(#fore-grad)')
            .attr('d', foreArea)

        // ── Forecast line (dashed) ──────────────────────────────────────────
        const foreLine = d3.line<DataPoint>()
            .x(d => xScale(d.date)).y(d => yScale(d.value))
            .curve(d3.curveCatmullRom.alpha(0.5))

        root.append('path')
            .datum(foreData)
            .attr('class', 'pred-fore-line')
            .attr('d', foreLine)

        // ── Legend ──────────────────────────────────────────────────────────
        const legend = root.append('g').attr('transform', `translate(${W - 190}, 4)`)

        // Historical swatch
        legend.append('line').attr('x1', 0).attr('x2', 18).attr('y1', 6).attr('y2', 6).attr('class', 'pred-hist-line')
        legend.append('text').attr('x', 24).attr('y', 10).attr('class', 'pred-legend-text').text('Historical')

        // Forecast swatch
        legend.append('line').attr('x1', 95).attr('x2', 113).attr('y1', 6).attr('y2', 6).attr('class', 'pred-fore-line')
        legend.append('text').attr('x', 119).attr('y', 10).attr('class', 'pred-legend-text').text('Forecast')

        // ── Tooltip ─────────────────────────────────────────────────────────
        const allInterp = [...historicalData, ...prediction.forecast]
        const bisect = d3.bisector<DataPoint, Date>(d => d.date).center
        const focusDot = root.append('circle')
            .attr('r', 5).attr('fill', 'var(--clr-primary)')
            .attr('stroke', 'var(--clr-bg-surface)').attr('stroke-width', 2)
            .style('opacity', 0)

        const tooltipEl = tooltipRef.current
        if (!tooltipEl) return

        root.append('rect')
            .attr('width', W).attr('height', H).attr('fill', 'transparent')
            .on('mousemove', (event: MouseEvent) => {
                const [mx] = d3.pointer(event)
                const x0 = xScale.invert(mx)
                const i = bisect(allInterp, x0)
                if (i < 0 || i >= allInterp.length) return
                const d = allInterp[i]
                const isForecast = i >= historicalData.length
                const dotColor = isForecast ? 'var(--clr-secondary)' : 'var(--clr-primary)'
                const px = xScale(d.date) + margin.left
                const py = yScale(d.value) + margin.top

                focusDot.attr('cx', xScale(d.date)).attr('cy', yScale(d.value))
                    .attr('fill', dotColor).style('opacity', 1)

                tooltipEl.classList.remove('pred-tooltip--hidden')
                tooltipEl.innerHTML = `
                    <div class="pred-tooltip__tag ${isForecast ? 'pred-tooltip__tag--fore' : ''}">${isForecast ? '🔮 Forecast' : '📊 Historical'}</div>
                    <div class="pred-tooltip__date">${d3.timeFormat('%b %d, %Y')(d.date)}</div>
                    <div class="pred-tooltip__value">$${d.value.toLocaleString()}</div>
                `
                const tw = tooltipEl.offsetWidth
                const left = px + tw + 12 > width ? px - tw - 12 : px + 12
                tooltipEl.style.left = `${left}px`
                tooltipEl.style.top = `${py - 20}px`
            })
            .on('mouseleave', () => {
                focusDot.style('opacity', 0)
                tooltipEl.classList.add('pred-tooltip--hidden')
            })

    }, [dims, historicalData, prediction, margin])

    return (
        <div className="pred-chart-wrapper" ref={containerRef}>
            <svg ref={svgRef} aria-label="30-day cost prediction chart" role="img" />
            <div ref={tooltipRef} className="pred-tooltip pred-tooltip--hidden" aria-hidden="true" />
        </div>
    )
}
