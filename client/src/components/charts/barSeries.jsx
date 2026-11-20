import { useId } from 'react'
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { fmtShort } from '../../lib/utils'
import { ChartTooltip } from './chartTooltip'
import { AXIS_TICK, GRID_STROKE, svgId } from './axes'

// colorFor(datum, key) returns a colour, or 'hatch' for the light cyan projected pattern
export function BarSeries({ data, xKey, bars, colorFor, average, averageLabel, height = 220, yFormat = fmtShort, stacked = false }) {
  const id = svgId(useId())
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 0 }} barCategoryGap="26%">
        <defs>
          <pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#E6FDFF" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#67E8F9" strokeWidth="2" />
          </pattern>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={AXIS_TICK} dy={6} interval="preserveStartEnd" minTickGap={4} />
        <YAxis tickFormatter={yFormat} tickLine={false} axisLine={false} tick={AXIS_TICK} width={56} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F4F6F8' }} />
        {average !== undefined && average !== null && (
          <ReferenceLine y={average} stroke="#0E7490" strokeDasharray="4 4" strokeWidth={1.5}
            label={{ value: averageLabel, position: 'insideTopRight', fill: '#0E7490', fontSize: 11, fontWeight: 600 }} />
        )}
        {bars.map(b => (
          <Bar key={b.key} dataKey={b.key} name={b.name} radius={[4, 4, 0, 0]} maxBarSize={30}
            stackId={stacked ? 'stack' : undefined} isAnimationActive={false}>
            {data.map((d, i) => {
              const c = colorFor(d, b.key)
              return <Cell key={i} fill={c === 'hatch' ? `url(#${id}-hatch)` : c} />
            })}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
