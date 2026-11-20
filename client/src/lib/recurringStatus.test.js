import { describe, it, expect } from 'vitest'
import { isDue } from './utils'
import { recurringStatus, daysUntil, monthlyEquivalent, sortByAttention, dueSoon, weekdayCountInMonth } from './recurringStatus'

const NOW = new Date(2026, 10, 21) // Saturday
const m = (id, day, last) => ({ id, description: id, frequency: 'monthly', day_of_month: day, last_logged: last, amount: '100.00' })
const w = (id, dow, last) => ({ id, description: id, frequency: 'weekly', day_of_week: dow, last_logged: last, amount: 350 })
const A = m('A', 18, '2026-10-18')
const B = m('B', 21, '2026-10-21')
const C = m('C', 25, '2026-10-25')
const D = m('D', 5, '2026-11-05')
const G = w('G', 1, '2026-11-16')

describe('recurringStatus', () => {
  it('monthly states', () => {
    expect(recurringStatus(A, NOW)).toEqual({ state: 'overdue', dueDate: '2026-11-18', nextDue: '2026-11-18' })
    expect(recurringStatus(B, NOW)).toEqual({ state: 'due-today', dueDate: '2026-11-21', nextDue: '2026-11-21' })
    expect(recurringStatus(C, NOW)).toEqual({ state: 'upcoming', dueDate: '2026-11-25', nextDue: '2026-11-25' })
    expect(recurringStatus(D, NOW)).toEqual({ state: 'logged', dueDate: '2026-11-05', nextDue: '2026-12-05' })
  })
  it('E: day 31 in February is due on the 28th', () => {
    expect(recurringStatus(m('E', 31, null), new Date(2026, 1, 28)).state).toBe('due-today')
  })
  it('F: next due after 31 January clamps to 28 February', () => {
    expect(recurringStatus(m('F', 31, '2026-01-31'), new Date(2026, 0, 31))).toEqual({ state: 'logged', dueDate: '2026-01-31', nextDue: '2026-02-28' })
  })
  it('weekly states', () => {
    expect(recurringStatus(G, NOW)).toEqual({ state: 'logged', dueDate: '2026-11-16', nextDue: '2026-11-23' })
    expect(recurringStatus(w('H', 1, '2026-11-09'), NOW).state).toBe('overdue')
    expect(recurringStatus(w('I', 6, '2026-11-14'), NOW).state).toBe('due-today')
    expect(recurringStatus(w('J', 1, null), NOW).state).toBe('overdue')
  })
  it('agrees with isDue for 60 days', () => {
    const items = [m('a', 1, '2026-10-01'), m('b', 31, '2026-11-30'), w('c', 0, '2026-11-01'), w('d', 3, null)]
    for (let i = 0; i < 60; i++) {
      const day = new Date(2026, 10, 1 + i)
      for (const it of items) {
        const due = ['overdue', 'due-today'].includes(recurringStatus(it, day).state)
        expect(due).toBe(isDue(it, day))
      }
    }
  })
})

describe('recurring helpers', () => {
  it('daysUntil', () => expect(daysUntil('2026-11-25', NOW)).toBe(4))
  it('monthlyEquivalent', () => {
    expect(monthlyEquivalent(w('x', 1, null))).toBeCloseTo(1516.67, 2)
    expect(monthlyEquivalent({ frequency: 'monthly', amount: '549' })).toBe(549)
  })
  it('sortByAttention', () => expect(sortByAttention([C, D, A, B], NOW).map(i => i.id)).toEqual(['A', 'B', 'C', 'D']))
  it('dueSoon', () => expect(dueSoon([A, B, C, D, G], NOW).map(i => i.id)).toEqual(['A', 'B', 'G']))
  it('weekdayCountInMonth', () => {
    expect(weekdayCountInMonth(1, '2026-11')).toBe(5)
    expect(weekdayCountInMonth(0, '2026-02')).toBe(4)
  })
})
