export type DateRange = {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}

export type QueryParams = {
  dateRange: DateRange
  categoryHint?: string // raw text hint, resolved to actual category in query builder
}
