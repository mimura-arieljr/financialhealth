import { describe, it, expect } from 'vitest'
import {
  headlineText as t, dashboardHeadline, expensesHeadline, revenuesHeadline,
  transfersHeadline, recurringHeadline, analyticsHeadline,
} from './headlines'

describe('dashboard', () => {
  it('less', () => {
    const h = dashboardHeadline({ spent: 18420, comparison: { pct: -12, against: 'this point in October' } })
    expect(t(h)).toBe("You've spent ₱18,420, 12% less than this point in October.")
    expect(h.strong).toBe('₱18,420')
  })
  it('more', () => expect(t(dashboardHeadline({ spent: 100, comparison: { pct: 12, against: 'this point in October' } })))
    .toBe("You've spent ₱100, 12% more than this point in October."))
  it('same', () => expect(t(dashboardHeadline({ spent: 100, comparison: { pct: 0, against: 'this point in October' } })))
    .toBe("You've spent ₱100, about the same as this point in October."))
  it('no comparison', () => expect(t(dashboardHeadline({ spent: 18420, comparison: null }))).toBe("You've spent ₱18,420 so far."))
  it('nothing spent', () => expect(t(dashboardHeadline({ spent: 0, comparison: null }))).toBe('Nothing spent yet this month.'))
})

describe('expenses', () => {
  it('month', () => expect(t(expensesHeadline({ total: 18420, count: 42, monthName: 'November', top: { name: 'Food', total: 6840 } })))
    .toBe('₱18,420 across 42 expenses in November. Food is your biggest category at ₱6,840.'))
  it('singular, no top', () => expect(t(expensesHeadline({ total: 120, count: 1, monthName: 'November', top: null })))
    .toBe('₱120 across 1 expense in November.'))
  it('all months', () => expect(t(expensesHeadline({ total: 18420, count: 42, monthName: null, top: null })))
    .toBe('₱18,420 across 42 expenses in total.'))
  it('empty', () => {
    expect(t(expensesHeadline({ total: 0, count: 0, monthName: 'November', top: null }))).toBe('No expenses in November.')
    expect(t(expensesHeadline({ total: 0, count: 0, monthName: null, top: null }))).toBe('No expenses yet.')
  })
})

describe('revenues', () => {
  it('compared', () => expect(t(revenuesHeadline({ total: 42000, count: 2, monthName: 'November', comparison: { pct: 5, against: 'this point in October' } })))
    .toBe('₱42,000 from 2 entries in November, 5% more than this point in October.'))
  it('singular, no comparison', () => expect(t(revenuesHeadline({ total: 42000, count: 1, monthName: 'November', comparison: null })))
    .toBe('₱42,000 from 1 entry in November.'))
  it('all months', () => expect(t(revenuesHeadline({ total: 84000, count: 4, monthName: null, comparison: null })))
    .toBe('₱84,000 from 4 entries in total.'))
  it('empty', () => {
    expect(t(revenuesHeadline({ total: 0, count: 0, monthName: 'November', comparison: null }))).toBe('No income logged in November.')
    expect(t(revenuesHeadline({ total: 0, count: 0, monthName: null, comparison: null }))).toBe('No income logged yet.')
  })
})

describe('transfers', () => {
  it('month', () => expect(t(transfersHeadline({ total: 8000, count: 3, monthName: 'November' })))
    .toBe('₱8,000 moved between your banks in November, across 3 transfers.'))
  it('singular', () => expect(t(transfersHeadline({ total: 500, count: 1, monthName: 'November' })))
    .toBe('₱500 moved between your banks in November, across 1 transfer.'))
  it('all months', () => expect(t(transfersHeadline({ total: 8000, count: 3, monthName: null })))
    .toBe('₱8,000 moved between your banks across 3 transfers.'))
  it('empty', () => {
    expect(t(transfersHeadline({ total: 0, count: 0, monthName: 'November' }))).toBe('No transfers in November.')
    expect(t(transfersHeadline({ total: 0, count: 0, monthName: null }))).toBe('No transfers yet.')
  })
})

describe('recurring', () => {
  it('due', () => {
    const h = recurringHeadline({ activeCount: 8, monthlyTotal: 12340, dueCount: 2 })
    expect(t(h)).toBe('8 active, about ₱12,340 a month. 2 need paying now.')
    expect(h.strong).toBe('₱12,340 a month')
  })
  it('one due', () => expect(t(recurringHeadline({ activeCount: 3, monthlyTotal: 500, dueCount: 1 }))).toBe('3 active, about ₱500 a month. 1 needs paying now.'))
  it('none due', () => expect(t(recurringHeadline({ activeCount: 3, monthlyTotal: 500, dueCount: 0 }))).toBe('3 active, about ₱500 a month. Nothing needs paying now.'))
  it('none active', () => expect(t(recurringHeadline({ activeCount: 0, monthlyTotal: 0, dueCount: 0 }))).toBe('No active recurring expenses.'))
})

describe('analytics', () => {
  const a = (r) => t(analyticsHeadline({ savingsRate: r, monthName: 'November' }))
  it('bands', () => {
    expect(a(56)).toBe("You're saving 56% of your income in November, well above the 20% target.")
    expect(a(25)).toBe("You're saving 25% of your income in November, above the 20% target.")
    expect(a(20)).toBe("You're saving 20% of your income in November, right at the 20% target.")
    expect(a(8)).toBe("You're saving 8% of your income in November, below the 20% target.")
    expect(a(-15)).toBe("You're spending more than you earn in November.")
    expect(a(null)).toBe('No income logged yet this month.')
  })
  it('bold rate', () => expect(analyticsHeadline({ savingsRate: 56, monthName: 'November' }).strong).toBe('56%'))
})
