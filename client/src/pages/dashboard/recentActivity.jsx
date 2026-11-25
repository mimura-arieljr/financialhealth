import { useState } from 'react'
import { buildActivity } from '../../lib/activity'
import { categoryColorMap, categoryColor } from '../../lib/palette'
import { fmtDayMonth, fmtMoney } from '../../lib/utils'
import { Card } from '../../components/ui/card'
import { FilterPill } from '../../components/ui/filterPill'
import { CategoryAvatar } from '../../components/ui/avatar'
import { EmptyState } from '../../components/ui/emptyState'
import { BanknotesIcon, TransferIcon } from '../../components/ui/icons'
import { SearchField } from '../../components/ui/searchField'

const TYPES = [
  { value: 'expense', label: 'Expenses' },
  { value: 'revenue', label: 'Revenues' },
  { value: 'transfer', label: 'Transfers' },
]

function RowIcon({ row, colors }) {
  if (row.type === 'revenue') return <span className="w-7 h-7 rounded-[9px] bg-good-bg text-good grid place-items-center shrink-0"><BanknotesIcon className="w-3.5 h-3.5" /></span>
  if (row.type === 'transfer') return <span className="w-7 h-7 rounded-[9px] bg-sub text-cyan-ink grid place-items-center shrink-0"><TransferIcon className="w-3.5 h-3.5" /></span>
  return <CategoryAvatar name={row.category} color={categoryColor(colors, row.categoryId)} size="sm" />
}

function Amount({ row }) {
  if (row.type === 'expense') return <span className="tnum">{fmtMoney(-row.amount)}</span>
  if (row.type === 'revenue') return <span className="tnum text-good">{fmtMoney(row.amount, { sign: true })}</span>
  return <span className="tnum text-muted">{fmtMoney(row.amount)}</span>
}

export function RecentActivity({ data }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const colors = categoryColorMap(data.categories)
  const q = search.trim().toLowerCase()
  const rows = buildActivity(data)
    .filter(r => !type || r.type === type)
    .filter(r => !q || [r.description, r.note, r.account].some(v => v?.toLowerCase().includes(q)))
    .slice(0, 5)

  const controls = (
    <div className="flex items-center gap-2">
      <SearchField value={search} onChange={setSearch} placeholder="Search" label="Search activity" className="max-sm:hidden w-44" />
      <FilterPill label="All types" value={type} options={TYPES} onChange={setType} />
    </div>
  )

  return (
    <Card title="Recent activity" action={controls}>
      {rows.length === 0 ? (
        <EmptyState title={q || type ? 'No matching activity' : 'No activity yet'}
          body={q || type ? undefined : 'Add an expense or revenue to see it here.'} className="py-8" />
      ) : (
        <>
          <table className="hidden md:table table-fixed w-full text-xs border-separate border-spacing-0">
            <colgroup>
              <col />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
              <col className="w-16" />
              <col className="w-32" />
            </colgroup>
            <thead>
              <tr className="text-muted text-left">
                <th className="font-medium bg-sub py-2 px-3 rounded-l-[10px]">Description</th>
                <th className="font-medium bg-sub py-2 px-3">Category</th>
                <th className="font-medium bg-sub py-2 px-3">Account</th>
                <th className="font-medium bg-sub py-2 px-3">Date</th>
                <th className="font-medium bg-sub py-2 px-3 rounded-r-[10px] text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key}>
                  <td className="py-2 px-3 border-b border-line">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RowIcon row={r} colors={colors} />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{r.description}</p>
                        {r.note && <p className="text-faint truncate">{r.note}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 border-b border-line text-[#374151] truncate">{r.category}</td>
                  <td className="py-2 px-3 border-b border-line text-[#374151] truncate">{r.account}</td>
                  <td className="py-2 px-3 border-b border-line text-muted whitespace-nowrap">{fmtDayMonth(r.date)}</td>
                  <td className="py-2 px-3 border-b border-line text-right font-bold whitespace-nowrap"><Amount row={r} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="md:hidden divide-y divide-line">
            {rows.map(r => (
              <li key={r.key} className="flex items-center gap-3 py-2">
                <RowIcon row={r} colors={colors} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{r.description}</p>
                  <p className="text-xs text-muted truncate">{r.type === 'transfer' ? (r.note || 'Transfer') : r.category} · {fmtDayMonth(r.date)}</p>
                </div>
                <span className="text-sm font-bold whitespace-nowrap"><Amount row={r} /></span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
