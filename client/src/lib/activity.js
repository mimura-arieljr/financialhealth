// One list of expenses, revenues and transfers for "Recent activity", newest first
export function buildActivity({ expenses, revenues, transfers, banks, creditCards, categories }) {
  const bank = new Map(banks.map(b => [b.id, b.name]))
  const card = new Map(creditCards.map(c => [c.id, c.name]))
  const cat = new Map(categories.map(c => [c.id, c.name]))
  const base = (r) => ({ date: r.date, created_at: r.created_at, amount: Number(r.amount) })

  const rows = [
    ...expenses.map(e => ({
      key: `e${e.id}`, type: 'expense', description: e.description, note: null,
      category: cat.get(e.category_id) || 'Uncategorised', categoryId: cat.has(e.category_id) ? e.category_id : null,
      account: (e.credit_card_id && card.get(e.credit_card_id)) || bank.get(e.bank_id) || '', ...base(e),
    })),
    ...revenues.map(r => ({
      key: `r${r.id}`, type: 'revenue', description: r.description, note: null,
      category: 'Revenue', categoryId: null, account: bank.get(r.bank_id) || '', ...base(r),
    })),
    ...transfers.map(t => {
      const from = bank.get(t.from_bank_id) || 'Unknown bank'
      const to = bank.get(t.to_bank_id) || 'Unknown bank'
      return {
        key: `t${t.id}`, type: 'transfer', description: `${from} → ${to}`, note: t.note || null,
        category: 'Transfer', categoryId: null, account: `${from}, ${to}`, ...base(t),
      }
    }),
  ]
  return rows.sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || '').localeCompare(a.created_at || ''))
}
