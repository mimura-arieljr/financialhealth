import { monthKey, shiftMonth, daysInMonth, monthName, pctChange } from './utils'

const sum = (rows) => rows.reduce((s, r) => s + Number(r.amount), 0)
const pad = (n) => String(n).padStart(2, '0')

export const sumInMonth = (rows, key) => sum(rows.filter(r => r.date?.slice(0, 7) === key))

const sumBetween = (rows, from, to) => sum(rows.filter(r => r.date && r.date >= from && r.date <= to))

// "More/less than" comparison (spec 6.2)
// - current month: day 1 to today vs the same point last month (clamped)
// - past month: full month vs full previous month
// - '' (All months) or previous 0: no comparison
export function compareMonth(rows, key, now) {
  if (!key) return { current: sum(rows), previous: null, pct: null, against: null }
  const prevKey = shiftMonth(key, -1)
  let current, previous, against
  if (key === monthKey(now)) {
    const day = now.getDate()
    current = sumBetween(rows, `${key}-01`, `${key}-${pad(day)}`)
    previous = sumBetween(rows, `${prevKey}-01`, `${prevKey}-${pad(Math.min(day, daysInMonth(prevKey)))}`)
    against = `this point in ${monthName(prevKey)}`
  } else {
    current = sumInMonth(rows, key)
    previous = sumInMonth(rows, prevKey)
    against = monthName(prevKey)
  }
  if (!previous) return { current, previous, pct: null, against: null }
  return { current, previous, pct: pctChange(current, previous), against }
}

// Cash expenses and settled card expenses leave the bank; unsettled card charges do not yet
const leavesBank = (e) => e.credit_card_id === null || e.credit_card_id === undefined || e.is_card_settled === true

export function computeBankBalances({ banks, expenses, revenues, transfers }, asOf) {
  const inRange = (r) => !asOf || (r.date && r.date <= asOf)
  const exp = expenses.filter(inRange)
  const rev = revenues.filter(inRange)
  const tr = transfers.filter(inRange)
  return banks.map(bank => ({
    ...bank,
    balance: Number(bank.initial_balance)
      - sum(exp.filter(e => e.bank_id === bank.id && leavesBank(e)))
      + sum(rev.filter(r => r.bank_id === bank.id))
      - sum(tr.filter(t => t.from_bank_id === bank.id))
      + sum(tr.filter(t => t.to_bank_id === bank.id)),
  }))
}

export function bankMonthFlow(bankId, { expenses, revenues, transfers }, key) {
  const inMonth = (r) => r.date?.slice(0, 7) === key
  return sum(revenues.filter(r => inMonth(r) && r.bank_id === bankId))
    + sum(transfers.filter(t => inMonth(t) && t.to_bank_id === bankId))
    - sum(transfers.filter(t => inMonth(t) && t.from_bank_id === bankId))
    - sum(expenses.filter(e => inMonth(e) && e.bank_id === bankId && leavesBank(e)))
}

export function cardDebt(expenses) {
  const unpaid = expenses.filter(e => e.credit_card_id && e.is_card_settled === false)
  return { total: sum(unpaid), cardCount: new Set(unpaid.map(e => e.credit_card_id)).size }
}

// Spend per category, biggest first; no category or a deleted one counts as "Uncategorised"
export function categoryTotals(expenses, categories, key) {
  const names = new Map(categories.map(c => [c.id, c.name]))
  const totals = new Map()
  for (const e of expenses) {
    if (key && e.date?.slice(0, 7) !== key) continue
    const id = names.has(e.category_id) ? e.category_id : null
    totals.set(id, (totals.get(id) || 0) + Number(e.amount))
  }
  return [...totals.entries()]
    .map(([id, value]) => ({ id, name: id === null ? 'Uncategorised' : names.get(id), value }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)
}
