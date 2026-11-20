import { sumInMonth } from '../../lib/finance'
import { monthKey, monthShort, shiftMonth } from '../../lib/utils'
import { Card } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/emptyState'
import { AreaTrend } from '../../components/charts/areaTrend'
import { ChartLegend } from '../../components/charts/chartTooltip'

const SERIES = [
  { key: 'Revenue', name: 'Revenue', stroke: '#06B6D4', fill: '#00E5F2' },
  { key: 'Expenses', name: 'Expenses', stroke: '#0E1116', fill: '#0E1116' },
]

export function MoneyTrend({ data, now }) {
  const current = monthKey(now)
  const rows = Array.from({ length: 6 }, (_, i) => {
    const k = shiftMonth(current, i - 5)
    return { label: monthShort(k), Revenue: sumInMonth(data.revenues, k), Expenses: sumInMonth(data.expenses, k) }
  })
  const empty = rows.every(r => !r.Revenue && !r.Expenses)

  return (
    <Card title="Money in vs out" subtitle="Last 6 months"
      action={!empty && <ChartLegend items={SERIES.map(s => ({ name: s.name, color: s.stroke }))} />}>
      {empty
        ? <EmptyState title="No money in or out yet" body="Your last six months appear here once you add expenses or revenue." />
        : <AreaTrend data={rows} xKey="label" series={SERIES} height={230} />}
    </Card>
  )
}
