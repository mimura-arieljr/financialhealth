import { localDateStr, fmtDayMonth } from './utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayLabel(dateStr, now) {
  const todayStr = localDateStr(now)
  const yesterday = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]} ${fmtDayMonth(dateStr)}`
}

// Groups rows by date, keeping input order, with a daily total
export function groupByDay(rows, now, amountOf = r => Number(r.amount)) {
  const groups = new Map()
  for (const row of rows) {
    if (!groups.has(row.date)) groups.set(row.date, { date: row.date, label: dayLabel(row.date, now), total: 0, rows: [] })
    const g = groups.get(row.date)
    g.total += amountOf(row)
    g.rows.push(row)
  }
  return [...groups.values()]
}
