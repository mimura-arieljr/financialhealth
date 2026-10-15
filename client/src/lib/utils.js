
export const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })

export const fmtShort = (n) => {
  const num = Number(n)
  if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `₱${(num / 1_000).toFixed(1)}K`
  return `₱${num.toFixed(0)}`
}

const localDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const localMonthStr = (d) => localDateStr(d).slice(0, 7)

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
      key: localMonthStr(d),
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
      key: localMonthStr(d),
      label: d.toLocaleString('en-PH', { month: 'short' })
    }
  })
}