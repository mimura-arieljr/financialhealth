import { it, expect } from 'vitest'
import { buildActivity } from './activity'

it('merges expenses, revenues and transfers newest first', () => {
  const rows = buildActivity({
    banks: [{ id: 'b1', name: 'BPI' }, { id: 'b2', name: 'GCash' }],
    creditCards: [{ id: 'c1', name: 'Amore' }],
    categories: [{ id: 'f', name: 'Food' }],
    expenses: [{ id: 1, description: 'Ramen', amount: '1240', date: '2026-11-20', created_at: '2026-11-20T10:00:00', bank_id: 'b1', credit_card_id: 'c1', category_id: 'f' }],
    revenues: [{ id: 2, description: 'Salary', amount: 42000, date: '2026-11-15', created_at: '2026-11-15T09:00:00', bank_id: 'b1' }],
    transfers: [{ id: 3, amount: 3000, date: '2026-11-20', created_at: '2026-11-20T12:00:00', note: 'Load', from_bank_id: 'b1', to_bank_id: 'b2' }],
  })
  expect(rows).toEqual([
    { key: 't3', type: 'transfer', description: 'BPI → GCash', note: 'Load', category: 'Transfer', categoryId: null, account: 'BPI, GCash', date: '2026-11-20', created_at: '2026-11-20T12:00:00', amount: 3000 },
    { key: 'e1', type: 'expense', description: 'Ramen', note: null, category: 'Food', categoryId: 'f', account: 'Amore', date: '2026-11-20', created_at: '2026-11-20T10:00:00', amount: 1240 },
    { key: 'r2', type: 'revenue', description: 'Salary', note: null, category: 'Revenue', categoryId: null, account: 'BPI', date: '2026-11-15', created_at: '2026-11-15T09:00:00', amount: 42000 },
  ])
})

it('handles missing names', () => {
  const [row] = buildActivity({
    banks: [], creditCards: [], categories: [], revenues: [], transfers: [],
    expenses: [{ id: 9, description: 'X', amount: 1, date: '2026-11-01', created_at: null, bank_id: 'gone', credit_card_id: null, category_id: null }],
  })
  expect([row.category, row.account]).toEqual(['Uncategorised', ''])
})
