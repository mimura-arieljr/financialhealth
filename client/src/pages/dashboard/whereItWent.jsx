import { useState } from 'react'
import { categoryTotals } from '../../lib/finance'
import { categoryColorMap, categoryColor } from '../../lib/palette'
import { UNCATEGORISED_COLOR } from '../../lib/consts'
import { fmtPeso, monthKey, monthName } from '../../lib/utils'
import { Card } from '../../components/ui/card'
import { MonthArrows } from '../../components/ui/monthArrows'
import { EmptyState } from '../../components/ui/emptyState'
import { Donut } from '../../components/charts/donut'

const MAX_SLICES = 6

export function WhereItWent({ expenses, categories, now }) {
  const [month, setMonth] = useState(monthKey(now))
  const colors = categoryColorMap(categories)
  const all = categoryTotals(expenses, categories, month).map(c => ({ ...c, color: categoryColor(colors, c.id) }))
  // More than six slices fold into "Other" so the donut stays readable
  const rows = all.length > MAX_SLICES + 1
    ? [...all.slice(0, MAX_SLICES), { id: 'other', name: 'Other', value: all.slice(MAX_SLICES).reduce((s, c) => s + c.value, 0), color: UNCATEGORISED_COLOR }]
    : all
  const total = rows.reduce((s, c) => s + c.value, 0)

  return (
    <Card title="Where it went" action={<MonthArrows value={month} onChange={setMonth} />}>
      {total === 0 ? (
        <EmptyState title={`Nothing spent in ${monthName(month)}`} className="py-8" />
      ) : (
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-5">
          <Donut data={rows} centerTop="Spent" centerBottom={fmtPeso(total)} size={164} />
          <ul className="w-full min-w-0 space-y-2">
            {rows.map(c => (
              <li key={c.id ?? 'none'} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: c.color }} />
                <span className="truncate text-[#374151]">{c.name}</span>
                <span className="ml-auto font-semibold tnum">{fmtPeso(c.value)}</span>
                <span className="w-9 text-right text-muted tnum">{Math.round((c.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
