import { it, expect } from 'vitest'
import { groupByDay } from './grouping'

it('groups by day with totals and labels', () => {
  const rows = [
    { id: 1, amount: 100, date: '2026-11-21' },
    { id: 2, amount: '50.5', date: '2026-11-21' },
    { id: 3, amount: 20, date: '2026-11-20' },
    { id: 4, amount: 5, date: '2026-11-15' },
  ]
  const g = groupByDay(rows, new Date(2026, 10, 21))
  expect(g.map(d => [d.date, d.label, d.total, d.rows.map(r => r.id)])).toEqual([
    ['2026-11-21', 'Today', 150.5, [1, 2]],
    ['2026-11-20', 'Yesterday', 20, [3]],
    ['2026-11-15', 'Sun 15 Nov', 5, [4]],
  ])
})
