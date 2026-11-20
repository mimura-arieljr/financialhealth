import { describe, it, expect } from 'vitest'
import { sumInMonth, compareMonth, computeBankBalances, bankMonthFlow, cardDebt, categoryTotals } from './finance'

const NOW = new Date(2026, 10, 21)
const rows = [
  { amount: 100, date: '2026-11-03' },
  { amount: '50', date: '2026-11-21' },
  { amount: 999, date: '2026-11-25' },
  { amount: 200, date: '2026-10-10' },
  { amount: 300, date: '2026-10-22' },
  { amount: 250, date: '2026-09-30' },
]

describe('compareMonth', () => {
  it('current month compares with the same point last month', () => {
    expect(compareMonth(rows, '2026-11', NOW)).toEqual({ current: 150, previous: 200, pct: -25, against: 'this point in October' })
  })
  it('past month compares full months', () => {
    expect(compareMonth(rows, '2026-10', NOW)).toEqual({ current: 500, previous: 250, pct: 100, against: 'September' })
  })
  it('all months drops the comparison', () => {
    expect(compareMonth(rows, '', NOW)).toEqual({ current: 1899, previous: null, pct: null, against: null })
  })
  it('previous zero drops the comparison', () => {
    expect(compareMonth(rows, '2026-09', NOW)).toEqual({ current: 250, previous: 0, pct: null, against: null })
  })
  it('clamps to February', () => {
    const r = [{ amount: 10, date: '2026-02-28' }, { amount: 20, date: '2026-03-31' }]
    expect(compareMonth(r, '2026-03', new Date(2026, 2, 31))).toEqual({ current: 20, previous: 10, pct: 100, against: 'this point in February' })
  })
  it('sumInMonth', () => expect(sumInMonth(rows, '2026-11')).toBe(1149))
})

const data = {
  banks: [{ id: 'b1', name: 'BPI', initial_balance: 1000 }, { id: 'b2', name: 'GCash', initial_balance: '200' }],
  expenses: [
    { amount: 100, date: '2026-11-02', bank_id: 'b1', credit_card_id: null, is_card_settled: null },
    { amount: '300', date: '2026-11-03', bank_id: 'b1', credit_card_id: 'c1', is_card_settled: false },
    { amount: 50, date: '2026-10-20', bank_id: 'b1', credit_card_id: 'c1', is_card_settled: true },
  ],
  revenues: [{ amount: '500.00', date: '2026-11-15', bank_id: 'b1' }],
  transfers: [{ amount: 150, date: '2026-10-25', from_bank_id: 'b1', to_bank_id: 'b2' }],
}

describe('balances', () => {
  it('current balances', () => {
    expect(computeBankBalances(data).map(b => b.balance)).toEqual([1200, 350])
  })
  it('as of last month end', () => {
    expect(computeBankBalances(data, '2026-10-31').map(b => b.balance)).toEqual([800, 350])
  })
  it('bankMonthFlow', () => {
    expect(bankMonthFlow('b1', data, '2026-11')).toBe(400)
    expect(bankMonthFlow('b2', data, '2026-11')).toBe(0)
    expect(bankMonthFlow('b2', data, '2026-10')).toBe(150)
  })
  it('cardDebt', () => expect(cardDebt(data.expenses)).toEqual({ total: 300, cardCount: 1 }))
  it('empty data', () => {
    const empty = { banks: [], expenses: [], revenues: [], transfers: [] }
    expect(computeBankBalances(empty)).toEqual([])
    expect(cardDebt([])).toEqual({ total: 0, cardCount: 0 })
    expect(compareMonth([], '2026-11', NOW)).toEqual({ current: 0, previous: 0, pct: null, against: null })
  })
})

describe('categoryTotals', () => {
  const cats = [{ id: 'f', name: 'Food' }, { id: 'b', name: 'Bills' }]
  const exps = [
    { amount: 100, date: '2026-11-02', category_id: 'f' },
    { amount: '50', date: '2026-11-03', category_id: 'f' },
    { amount: 300, date: '2026-11-04', category_id: 'b' },
    { amount: 20, date: '2026-11-05', category_id: null },
    { amount: 5, date: '2026-11-06', category_id: 'gone' },
    { amount: 999, date: '2026-10-01', category_id: 'f' },
  ]
  it('sums one month, uncategorised and deleted categories together', () => {
    expect(categoryTotals(exps, cats, '2026-11')).toEqual([
      { id: 'b', name: 'Bills', value: 300 },
      { id: 'f', name: 'Food', value: 150 },
      { id: null, name: 'Uncategorised', value: 25 },
    ])
  })
  it('all months', () => expect(categoryTotals(exps, cats, '')[0]).toEqual({ id: 'f', name: 'Food', value: 1149 }))
  it('empty', () => expect(categoryTotals([], cats, '2026-11')).toEqual([]))
})
