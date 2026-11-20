import { useState } from 'react'
import { sumInMonth } from '../../lib/finance'
import { fmtPeso, monthKey, monthName } from '../../lib/utils'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/pill'
import { MonthArrows } from '../../components/ui/monthArrows'

export function MarkedCard({ expenses, now }) {
  const [month, setMonth] = useState(monthKey(now))
  const total = sumInMonth(expenses, month)
  const marked = sumInMonth(expenses.filter(e => e.is_marked), month)
  const pct = total ? Math.round((marked / total) * 100) : 0

  return (
    <Card title="Marked expenses" action={<MonthArrows value={month} onChange={setMonth} />}>
      <div className="flex items-baseline justify-between gap-2">
        <p><span className="text-2xl font-bold tracking-tight tnum">{fmtPeso(marked)}</span> <span className="text-sm text-muted">marked</span></p>
        <Badge tone="mark">{pct}%</Badge>
      </div>
      <div className="hatch h-3 rounded-full overflow-hidden my-3" role="img" aria-label={`${pct}% of spending marked`}>
        <div className="h-full bg-ink rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted">of {fmtPeso(total)} spent in {monthName(month)}</p>
    </Card>
  )
}
