
const MINUS = '−'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3))

export const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })

// Whole pesos: "₱18,420", "−₱1,240", "+₱42,000" with { sign: true }
export const fmtPeso = (n, { sign = false } = {}) => {
  const rounded = Math.round(Number(n)) || 0
  const body = `₱${Math.abs(rounded).toLocaleString('en-PH')}`
  if (rounded < 0) return `${MINUS}${body}`
  if (rounded > 0 && sign) return `+${body}`
  return body
}

// Two decimals with sign: "₱1,240.50", "−₱1,240.00", "+₱42,000.00" with { sign: true }
export const fmtMoney = (n, { sign = false } = {}) => {
  const cents = Math.round(Number(n) * 100) || 0
  const body = `₱${(Math.abs(cents) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (cents < 0) return `${MINUS}${body}`
  if (cents > 0 && sign) return `+${body}`
  return body
}

export const fmtShort = (n) => {
  const num = Number(n)
  const abs = Math.abs(num)
  let body
  if (abs >= 1_000_000) body = `₱${(abs / 1_000_000).toFixed(1)}M`
  else if (abs >= 1_000) body = `₱${(abs / 1_000).toFixed(1)}K`
  else body = `₱${abs.toFixed(0)}`
  return num < 0 && body !== '₱0' ? `${MINUS}${body}` : body
}

// Change in percent against |previous|; null when there is nothing to compare with
export const pctChange = (current, previous, decimals = 0) => {
  const prev = Number(previous)
  if (!prev) return null
  const f = 10 ** decimals
  return Math.round(((Number(current) - prev) / Math.abs(prev)) * 100 * f) / f
}

// Colour by meaning: good news green, bad news red, no change grey
export const deltaTone = (pct, goodWhen) => {
  if (pct === null || pct === undefined) return null
  if (pct === 0) return 'neutral'
  const up = pct > 0
  return (goodWhen === 'up') === up ? 'good' : 'bad'
}

export const localDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const monthKey = (d) => localDateStr(d).slice(0, 7)

const parseKey = (key) => key.split('-').map(Number)

export const shiftMonth = (key, delta) => {
  const [y, m] = parseKey(key)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

export const daysInMonth = (key) => {
  const [y, m] = parseKey(key)
  return new Date(y, m, 0).getDate()
}

export const monthName = (key) => MONTHS[parseKey(key)[1] - 1]
export const monthShort = (key) => MONTHS_SHORT[parseKey(key)[1] - 1]
export const monthLabel = (key) => `${monthName(key)} ${parseKey(key)[0]}`

export const fmtDayMonth = (dateStr) => {
  const [, m, d] = parseKey(dateStr)
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

export const lastMonthEnd = (now) => localDateStr(new Date(now.getFullYear(), now.getMonth(), 0))

// Months to offer in the switcher: data months up to now plus the current month, newest first
export const monthOptions = (dataKeys, now) => {
  const current = monthKey(now)
  const keys = new Set(dataKeys.filter(k => k && k <= current))
  keys.add(current)
  return [...keys].sort().reverse()
}

export const today = () => localDateStr(new Date())

export function isDue(item, now = new Date()) {
  const todayDate = localDateStr(now)
  const last = item.last_logged || ''

  if (item.frequency === 'monthly') {
    // Clamp so day 31 still lands on the last day of shorter months
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dueDay = Math.min(item.day_of_month, lastDay)
    // Stays due until logged in the current month
    return now.getDate() >= dueDay && last.slice(0, 7) !== todayDate.slice(0, 7)
  }
  if (item.frequency === 'weekly') {
    // Most recent occurrence of the weekday (today included)
    const daysSince = (now.getDay() - item.day_of_week + 7) % 7
    const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSince)
    // Stays due until logged on or after that occurrence
    return last < localDateStr(dueDate)
  }
  return false
}

export function getLast12Months() {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return {
      key: monthKey(d),
      label: d.toLocaleString('en-PH', { month: 'short', year: '2-digit' })
    }
  })
}

export function getCurrentYear() {
  return new Date().getFullYear()
}

export function getMonthsOfYear(year) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1)
    return {
      key: monthKey(d),
      label: d.toLocaleString('en-PH', { month: 'short' })
    }
  })
}

export function ordinal(n) {
  const teen = n % 100 >= 11 && n % 100 <= 13
  const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th')
  return `${n}${suffix}`
}
