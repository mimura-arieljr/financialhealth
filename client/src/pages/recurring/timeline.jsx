import { DAYS_OF_WEEK } from '../../lib/consts'
import { daysInMonth, monthKey, monthName } from '../../lib/utils'
import { recurringStatus, weekdayCountInMonth } from '../../lib/recurringStatus'
import { Card } from '../../components/ui/card'

const RANK = { overdue: 0, 'due-today': 0, upcoming: 1, logged: 2 }
const DOT = {
  due: 'bg-alert',
  upcoming: 'bg-card border-2 border-cyan-ink',
  logged: 'bg-ink',
}
const TICKS = [1, 5, 10, 15, 20, 25]

function Legend() {
  const item = (cls, label) => (
    <span className="inline-flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${cls}`} />{label}</span>
  )
  return (
    <div className="hidden xl:flex gap-3 text-xs text-muted">
      {item(DOT.logged, 'Logged')}{item(DOT.due, 'Due now')}{item(DOT.upcoming, 'Coming up')}
    </div>
  )
}

// The current month as a bar, monthly items as dots on their due day (desktop only)
export function Timeline({ items, now }) {
  const key = monthKey(now)
  const days = daysInMonth(key)
  const today = now.getDate()
  const pos = (d) => `${((d - 1) / (days - 1)) * 100}%`

  // Group monthly items by their clamped due day
  const groups = new Map()
  for (const item of items.filter(i => i.frequency === 'monthly')) {
    const s = recurringStatus(item, now)
    const day = Number(s.dueDate.slice(8, 10))
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day).push({ item, state: s.state })
  }
  // Neighbouring days alternate label height so names do not collide
  const placed = [...groups.entries()].sort((a, b) => a[0] - b[0]).reduce((acc, [day, list]) => {
    const prev = acc[acc.length - 1]
    const level = prev && day - prev.day < 4 ? (prev.level + 1) % 2 : 0
    const worst = list.reduce((w, x) => (RANK[x.state] < RANK[w] ? x.state : w), 'logged')
    const tone = RANK[worst] === 0 ? 'due' : worst
    return [...acc, { day, list, level, tone }]
  }, [])
  const weekly = items.filter(i => i.frequency === 'weekly')

  return (
    <Card title={`${monthName(key)} at a glance`} subtitle="Monthly items on their due day; weekly items as a count" action={<Legend />}
      className="hidden lg:block">
      <div className="relative h-40 mx-4 mt-2">
        {placed.map(p => (
          <div key={p.day} className="absolute top-0 h-[84px] -translate-x-1/2 flex flex-col items-center justify-end" style={{ left: pos(p.day), paddingBottom: p.level * 18 }}>
            {p.list.map(x => (
              <span key={x.item.id} className="text-[11px] font-semibold leading-4 max-w-24 truncate">{x.item.description}</span>
            ))}
          </div>
        ))}
        <div className="absolute inset-x-0 top-[92px] h-2 rounded-full bg-sub">
          <div className="h-full rounded-full bg-cyan-chart/50" style={{ width: pos(today) }} />
        </div>
        {placed.map(p => (
          <span key={p.day} className={`absolute top-[88px] w-4 h-4 -translate-x-1/2 rounded-full ring-2 ring-card ${DOT[p.tone]}`} style={{ left: pos(p.day) }} />
        ))}
        <div className="absolute top-[110px] -translate-x-1/2 flex flex-col items-center" style={{ left: pos(today) }}>
          <span className="w-0 h-0 border-x-4 border-x-transparent border-b-[6px] border-b-ink" />
          <span className="text-[10px] font-bold">Today</span>
        </div>
        {[...TICKS, days].filter(d => Math.abs(d - today) > 2).map(d => (
          <span key={d} className="absolute top-[118px] -translate-x-1/2 text-[10px] text-faint tnum" style={{ left: pos(d) }}>{d}</span>
        ))}
      </div>
      {weekly.length > 0 && (
        <ul className="mt-1 space-y-1 text-xs text-muted">
          {weekly.map(w => (
            <li key={w.id}>+ {w.description} every {DAYS_OF_WEEK[w.day_of_week]} ({weekdayCountInMonth(w.day_of_week, key)} this month)</li>
          ))}
        </ul>
      )}
    </Card>
  )
}
