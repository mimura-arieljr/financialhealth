
export const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })

export const fmtShort = (n) => {
  const num = Number(n)
  if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `₱${(num / 1_000).toFixed(1)}K`
  return `₱${num.toFixed(0)}`
}

export const today = () => new Date().toISOString().split('T')[0]

export function isDueToday(item) {
  const now = new Date()
  const todayDate = now.toISOString().split('T')[0]

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
      key: d.toISOString().slice(0, 7),
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
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString('en-PH', { month: 'short' })
    }
  })
}