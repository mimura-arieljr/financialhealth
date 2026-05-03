import { QueryParams } from "../types/queryParams.ts"

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
]

const CATEGORY_TRIGGERS = [
  /(?:spend|spent|spending)\s+on\s+([a-z0-9 ]+?)(?:\s+(last|this|in|for|during)\b|$)/i,
  /(?:paid|pay|paying)\s+for\s+([a-z0-9 ]+?)(?:\s+(last|this|in|for|during)\b|$)/i,
  /(?:cost of|costs for)\s+([a-z0-9 ]+?)(?:\s+(last|this|in|for|during)\b|$)/i,
  /(?:expenses?)\s+(?:for|on)\s+([a-z0-9 ]+?)(?:\s+(last|this|in|for|during)\b|$)/i,
  /(?:bought|purchase[ds]?)\s+([a-z0-9 ]+?)(?:\s+(last|this|in|for|during)\b|$)/i,
  /(?:^|\s)([a-z0-9 ]+)\s+(?:expenses|spending)\b/i,
]

function toLocalISODate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfMonth(year: number, month: number): string {
  return toLocalISODate(new Date(year, month, 1))
}

function endOfMonth(year: number, month: number): string {
  return toLocalISODate(new Date(year, month + 1, 0))
}

function defaultRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 3)
  return { from: toLocalISODate(from), to: toLocalISODate(to) }
}

function extractDateRange(q: string): { from: string; to: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  if (/last\s+week/i.test(q)) {
    const from = new Date()
    from.setDate(from.getDate() - 7)
    return { from: toLocalISODate(from), to: toLocalISODate(now) }
  }

  if (/last\s+30\s+days/i.test(q)) {
    const from = new Date()
    from.setDate(from.getDate() - 30)
    return { from: toLocalISODate(from), to: toLocalISODate(now) }
  }

  if (/today/i.test(q)) {
    return { from: toLocalISODate(now), to: toLocalISODate(now) }
  }

  if (/yesterday/i.test(q)) {
    const y = new Date()
    y.setDate(y.getDate() - 1)
    return { from: toLocalISODate(y), to: toLocalISODate(y) }
  }

  if (/this\s+month/i.test(q)) {
    return { from: startOfMonth(year, month), to: toLocalISODate(now) }
  }

  if (/last\s+month/i.test(q)) {
    const lastMonth = month === 0 ? 11 : month - 1
    const lastMonthYear = month === 0 ? year - 1 : year
    return { from: startOfMonth(lastMonthYear, lastMonth), to: endOfMonth(lastMonthYear, lastMonth) }
  }

  if (/last\s+3\s+months/i.test(q)) {
    return defaultRange()
  }

  if (/this\s+year/i.test(q)) {
    return { from: `${year}-01-01`, to: toLocalISODate(now) }
  }

  if (/last\s+year/i.test(q)) {
    return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` }
  }

  // Named month: "in January", "for March", "during October"
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const pattern = new RegExp(`(?:in|for|during|of)\\s+${MONTH_NAMES[i]}`, "i")
    if (pattern.test(q)) {
      const targetYear = i > month ? year - 1 : year
      return { from: startOfMonth(targetYear, i), to: endOfMonth(targetYear, i) }
    }
  }

  return defaultRange()
}

function stripDatePhrases(q: string): string {
  return q
    .replace(/last\s+week/gi, "")
    .replace(/this\s+month/gi, "")
    .replace(/last\s+month/gi, "")
    .replace(/last\s+3\s+months/gi, "")
    .replace(/this\s+year/gi, "")
    .replace(/last\s+year/gi, "")
    .replace(/in\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi, "")
}

function normalizeCategory(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

function extractCategoryHint(q: string): string | undefined {
  const cleaned = stripDatePhrases(q)
  for (const pattern of CATEGORY_TRIGGERS) {
    const match = cleaned.match(pattern)
    if (match?.[1]) {
      return normalizeCategory(match[1])
    }
  }
  return undefined
}

export function extractQueryParams(question: string): QueryParams {
  return {
    dateRange: extractDateRange(question),
    categoryHint: extractCategoryHint(question),
  }
}
