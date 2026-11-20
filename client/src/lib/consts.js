
export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

// Old dark-theme palette; removed once the dashboard stops using it
export const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#a855f7', '#e11d48', '#0ea5e9'
]

// Category colours in fixed order
// - first four are the brand set from the spec (ink, cyan, cyan-ink, slate)
// - the rest passed the dataviz validator (band, chroma, CVD, normal-vision)
// - no amber (means unpaid) and no status red or green
export const CATEGORY_PALETTE = [
  '#0E1116', '#00DCEB', '#0E7490', '#94A3B8',
  '#7C3AED', '#DB2777', '#0284C7', '#C084FC', '#BE185D', '#60A5FA',
]

// Bank avatars carry white initials, so every colour is dark enough for white text
export const BANK_PALETTE = ['#0E1116', '#0E7490', '#7C3AED', '#BE185D', '#0369A1', '#4338CA', '#334155', '#9D174D']

export const UNCATEGORISED_COLOR = '#9CA3AF'
