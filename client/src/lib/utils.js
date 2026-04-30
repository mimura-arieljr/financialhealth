
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

export function isDueToday(item) {
  const now = new Date()
  const todayDate = localDateStr(now)

  // Already logged today
  if (item.last_logged === todayDate) return false

  if (item.frequency === 'monthly') {
    return now.getDate() === item.day_of_month
  }
  if (item.frequency === 'weekly') {
    return now.getDay() === item.day_of_week
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