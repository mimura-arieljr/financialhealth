import { isDue, localDateStr, daysInMonth, monthKey, shiftMonth } from './utils'

const pad = (n) => String(n).padStart(2, '0')
const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const clampedDue = (key, day) => `${key}-${pad(Math.min(day, daysInMonth(key)))}`

// This period's due date: monthly = this month's clamped day; weekly = latest weekday occurrence (today included)
function periodDueDate(item, now) {
  if (item.frequency === 'weekly') {
    const daysSince = (now.getDay() - item.day_of_week + 7) % 7
    return localDateStr(addDays(now, -daysSince))
  }
  return clampedDue(monthKey(now), item.day_of_month)
}

export function recurringStatus(item, now) {
  const dueDate = periodDueDate(item, now)
  const todayStr = localDateStr(now)
  // isDue stays the single source of truth for "needs paying"
  if (isDue(item, now)) {
    return { state: dueDate < todayStr ? 'overdue' : 'due-today', dueDate, nextDue: dueDate }
  }
  const last = item.last_logged || ''
  if (item.frequency === 'weekly') {
    // Not due means logged on or after this occurrence
    return { state: 'logged', dueDate, nextDue: localDateStr(addDays(parseDate(dueDate), 7)) }
  }
  if (last.slice(0, 7) === monthKey(now)) {
    return { state: 'logged', dueDate, nextDue: clampedDue(shiftMonth(monthKey(now), 1), item.day_of_month) }
  }
  return { state: 'upcoming', dueDate, nextDue: dueDate }
}

export function daysUntil(dateStr, now) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((parseDate(dateStr) - start) / 86_400_000)
}

export const monthlyEquivalent = (item) =>
  item.frequency === 'weekly' ? Number(item.amount) * 52 / 12 : Number(item.amount)

const RANK = { overdue: 0, 'due-today': 1, upcoming: 2, logged: 2 }

export function sortByAttention(items, now) {
  return items
    .map(item => ({ item, s: recurringStatus(item, now) }))
    .sort((a, b) =>
      RANK[a.s.state] - RANK[b.s.state]
      || a.s.nextDue.localeCompare(b.s.nextDue)
      || (a.item.description || '').localeCompare(b.item.description || ''))
    .map(x => x.item)
}

// Up to 3: due items first, then the soonest other item within 7 days if there is room
export function dueSoon(items, now) {
  const sorted = sortByAttention(items, now)
  const isDueNow = (i) => ['overdue', 'due-today'].includes(recurringStatus(i, now).state)
  const due = sorted.filter(isDueNow).slice(0, 3)
  if (due.length >= 3) return due
  const next = sorted
    .filter(i => !isDueNow(i))
    .map(i => ({ i, n: recurringStatus(i, now).nextDue }))
    .filter(x => daysUntil(x.n, now) <= 7)
    .sort((a, b) => a.n.localeCompare(b.n))[0]
  return next ? [...due, next.i] : due
}

export function weekdayCountInMonth(dayOfWeek, key) {
  const [y, m] = key.split('-').map(Number)
  let count = 0
  for (let d = 1; d <= daysInMonth(key); d++) {
    if (new Date(y, m - 1, d).getDay() === dayOfWeek) count++
  }
  return count
}
