import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChartTooltip } from './chartTooltip'

export function Donut({ data, centerTop, centerBottom, size = 180 }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={size * 0.35} outerRadius={size / 2 - 2}
          paddingAngle={data.length > 1 ? 2 : 0} cornerRadius={4} stroke="none" isAnimationActive={false}>
          {data.map(d => <Cell key={d.name} fill={d.color} />)}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
      <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">
        <div>
          {centerTop && <p className="text-[11px] text-muted">{centerTop}</p>}
          {centerBottom && <p className="text-base font-bold tnum">{centerBottom}</p>}
        </div>
      </div>
    </div>
  )
}
