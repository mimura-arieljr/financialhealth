import { useId } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { fmtShort } from '../../lib/utils'
import { ChartTooltip } from './chartTooltip'
import { AXIS_TICK, GRID_STROKE, svgId } from './axes'

export function AreaTrend({ data, xKey, series, height = 220, yFormat = fmtShort, endDots = true, endLabel = false }) {
  const id = svgId(useId())
  const last = data.length - 1

  const endDot = (stroke) => (props) => props.index === last
    ? <circle key={props.index} cx={props.cx} cy={props.cy} r={4.5} fill={stroke} stroke="#fff" strokeWidth={2} />
    : <g key={props.index} />

  const lastLabel = (props) => props.index === last
    ? (
      <g key={props.index}>
        <rect x={props.x - 34} y={props.y - 30} width={68} height={20} rx={10} fill="#0E1116" />
        <text x={props.x} y={props.y - 16} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>{yFormat(props.value)}</text>
      </g>
    )
    : <g key={props.index} />

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: endLabel ? 34 : 10, right: 14, left: 0, bottom: 0 }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.fill} stopOpacity={0.32} />
              <stop offset="100%" stopColor={s.fill} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={AXIS_TICK} dy={6} />
        <YAxis tickFormatter={yFormat} tickLine={false} axisLine={false} tick={AXIS_TICK} width={56} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#9CA3AF', strokeDasharray: '3 3' }} />
        {series.map(s => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
            stroke={s.stroke} strokeWidth={2} fill={`url(#${id}-${s.key})`}
            dot={endDots ? endDot(s.stroke) : false}
            activeDot={{ r: 4.5, stroke: '#fff', strokeWidth: 2, fill: s.stroke }}
            label={endLabel ? lastLabel : false}
            isAnimationActive={false} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
