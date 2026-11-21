import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchCached } from '../lib/cache'
import { useAuth } from '../hooks/useAuth'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { logRecurringExpense } from '../lib/recurring'
import { cardDebt, categoryTotals } from '../lib/finance'
import { expensesHeadline } from '../lib/headlines'
import { groupByDay } from '../lib/grouping'
import { categoryColorMap, categoryColor } from '../lib/palette'
import { fmt, fmtMoney, fmtPeso, isDue, monthKey, monthName, monthOptions } from '../lib/utils'
import { Modal } from '../components/ui/modal'
import { Card } from '../components/ui/card'
import { Button, IconButton } from '../components/ui/button'
import { Badge, Chip } from '../components/ui/pill'
import { PageHeader } from '../components/ui/pageHeader'
import { MonthSwitcher } from '../components/ui/monthSwitcher'
import { FilterPill } from '../components/ui/filterPill'
import { SearchField } from '../components/ui/searchField'
import { DayGroup } from '../components/ui/dayGroup'
import { EmptyState } from '../components/ui/emptyState'
import { Loading } from '../components/ui/spinner'
import { Pagination } from '../components/ui/pagination'
import { RowActions } from '../components/ui/rowActions'
import { BankPill, CategoryAvatar } from '../components/ui/avatar'
import { CloseIcon, PlusIcon, StarIcon } from '../components/ui/icons'
import { ExpenseForm } from '../components/forms/expenseForm'

const PAGE_SIZE = 10
const MARKED_OPTIONS = [{ value: 'marked', label: 'Marked' }, { value: 'unmarked', label: 'Not marked' }]

function cardStatus(e) {
  if (!e.credit_card_id) return { label: 'Cash', tone: 'neutral', short: 'Cash' }
  const card = e.credit_cards?.name || 'Card'
  if (e.is_card_settled) return { label: `${card} · Settled`, tone: 'good', short: 'Settled' }
  return { label: `${card} · Unpaid`, tone: 'warn', short: 'Unpaid' }
}

function DueToLog({ items, onLog, onDismiss, logging }) {
  return (
    <Card title="Due to log" subtitle="Recurring expenses that are due now">
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-2 bg-sub rounded-row pl-3 pr-1.5 py-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{item.description}</p>
              <p className="text-xs text-muted tnum">{fmtPeso(item.amount)}</p>
            </div>
            <Button size="sm" variant="cyan" disabled={logging === item.id} onClick={() => onLog(item)}>
              {logging === item.id ? 'Logging...' : 'Log'}
            </Button>
            <IconButton label={`Dismiss ${item.description}`} size="w-8 h-8" variant="light" onClick={() => onDismiss(item.id)}>
              <CloseIcon className="w-3.5 h-3.5" />
            </IconButton>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function UnpaidCards({ cards, onSettle, settling }) {
  const confirmSettle = (cc) => {
    const n = cc.items.length
    if (confirm(`Mark all ${cc.name} charges as settled?\n\n₱${fmt(cc.total)} across ${n} expense${n !== 1 ? 's' : ''}`)) onSettle(cc.id)
  }
  return (
    <Card title="Unpaid card charges" subtitle="Charges not yet paid off">
      <ul className="space-y-1.5">
        {cards.map(cc => (
          <li key={cc.id} className="flex items-center gap-2 bg-sub rounded-row pl-3 pr-1.5 py-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{cc.name}</p>
              <p className="text-xs text-muted tnum">{cc.items.length} {cc.items.length === 1 ? 'charge' : 'charges'} · <span className="text-warn font-semibold">{fmtPeso(cc.total)}</span></p>
            </div>
            <Button size="sm" variant="white" disabled={settling === cc.id} onClick={() => confirmSettle(cc)}>
              {settling === cc.id ? 'Settling...' : 'Settle all'}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ByCategory({ totals, colors, subtitle }) {
  const top = totals.slice(0, 3)
  const rest = totals.slice(3)
  const max = top[0]?.value || 1
  return (
    <Card title="By category" subtitle={subtitle}>
      <ul className="space-y-2.5">
        {top.map(c => (
          <li key={c.id ?? 'none'} className="flex items-center gap-2 text-xs">
            <span className="w-24 truncate text-[#374151]">{c.name}</span>
            <span className="flex-1 h-2 bg-sub rounded-full overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${(c.value / max) * 100}%`, background: categoryColor(colors, c.id) }} />
            </span>
            <span className="w-20 text-right font-semibold tnum">{fmtPeso(c.value)}</span>
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <p className="text-xs text-muted mt-3">+{rest.length} more · <span className="tnum">{fmtPeso(rest.reduce((s, c) => s + c.value, 0))}</span></p>
      )}
    </Card>
  )
}

const GRID_COLS = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' }

export default function Expenses() {
  const { user } = useAuth()
  const userId = user?.id
  const { openQuickAdd, dataVersion, notifySaved } = useQuickAdd()
  const now = useMemo(() => new Date(), [])

  const [banks, setBanks] = useState([])
  const [creditCards, setCreditCards] = useState([])
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [month, setMonth] = useState(monthKey(now))
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBank, setFilterBank] = useState('')
  const [filterCard, setFilterCard] = useState('')
  const [filterMarked, setFilterMarked] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [settlingCard, setSettlingCard] = useState(null)
  const [dueItems, setDueItems] = useState([])
  const [loggingDue, setLoggingDue] = useState(null)
  const [dismissedDue, setDismissedDue] = useState([])

  useEffect(() => {
    if (!userId) return
    Promise.all([
      fetchCached('banks', userId, 'id, name', 'name'),
      fetchCached('credit_cards', userId, 'id, name', 'name'),
      fetchCached('categories', userId, 'id, name', 'name'),
    ]).then(([b, cc, cat]) => {
      if (!b.error) setBanks(b.data)
      if (!cc.error) setCreditCards(cc.data)
      if (!cat.error) setCategories(cat.data)
    })
  }, [userId, dataVersion])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('expenses')
      .select(`id, description, amount, date, is_card_settled, is_marked, created_at,
        category_id, bank_id, credit_card_id,
        categories(id, name), banks(id, name), credit_cards(id, name)`)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setExpenses(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId, dataVersion])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('recurring_expenses')
      .select(`id, description, amount, frequency, day_of_month, day_of_week,
        last_logged, category_id, bank_id, credit_card_id`)
      .eq('user_id', userId)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setDueItems(data.filter(i => isDue(i)))
      })
  }, [userId, dataVersion])

  const handleEdit = async (values) => {
    const { error } = await supabase.from('expenses').update(values).eq('id', editing.id)
    if (error) return error.message
    setEditing(null)
    notifySaved()
    return null
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    setDeleting(id)
    await supabase.from('expenses').delete().eq('id', id)
    setDeleting(null)
    setEditing(null)
    notifySaved()
  }

  const handleLogDue = async (item) => {
    setLoggingDue(item.id)
    const error = await logRecurringExpense(userId, item)
    if (!error) {
      setDismissedDue(d => [...d, item.id])
      notifySaved()
    }
    setLoggingDue(null)
  }

  const handleSettleCard = async (creditCardId) => {
    setSettlingCard(creditCardId)
    const { error } = await supabase
      .from('expenses')
      .update({ is_card_settled: true })
      .eq('user_id', userId)
      .eq('credit_card_id', creditCardId)
      .eq('is_card_settled', false)
    if (!error) notifySaved()
    setSettlingCard(null)
  }

  // Filter setters also go back to the first page
  const withReset = (setter) => (v) => { setter(v); setPage(0) }

  const colors = categoryColorMap(categories)
  const inMonth = month ? expenses.filter(e => e.date?.slice(0, 7) === month) : expenses
  const monthTotal = inMonth.reduce((s, e) => s + Number(e.amount), 0)
  const catTotals = categoryTotals(expenses, categories, month)
  const markedTotal = inMonth.filter(e => e.is_marked).reduce((s, e) => s + Number(e.amount), 0)
  const unpaidTotal = cardDebt(expenses).total

  const visibleDue = dueItems.filter(i => !dismissedDue.includes(i.id))
  const unpaidByCard = creditCards
    .map(cc => {
      const items = expenses.filter(e => e.credit_card_id === cc.id && e.is_card_settled === false)
      return { ...cc, items, total: items.reduce((s, e) => s + Number(e.amount), 0) }
    })
    .filter(cc => cc.items.length > 0)

  const q = search.trim().toLowerCase()
  const filtered = inMonth.filter(e => {
    if (filterCategory && e.category_id !== filterCategory) return false
    if (filterBank && e.bank_id !== filterBank) return false
    if (filterCard && e.credit_card_id !== filterCard) return false
    if (filterMarked === 'marked' && !e.is_marked) return false
    if (filterMarked === 'unmarked' && e.is_marked) return false
    if (q && !e.description?.toLowerCase().includes(q)) return false
    return true
  })
  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0)
  const hasFilters = filterCategory || filterBank || filterCard || filterMarked || search
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const clearFilters = () => {
    setFilterCategory(''); setFilterBank(''); setFilterCard(''); setFilterMarked(''); setSearch(''); setPage(0)
  }

  const topCards = [
    visibleDue.length > 0 && <DueToLog key="due" items={visibleDue} onLog={handleLogDue} onDismiss={id => setDismissedDue(d => [...d, id])} logging={loggingDue} />,
    unpaidByCard.length > 0 && <UnpaidCards key="cards" cards={unpaidByCard} onSettle={handleSettleCard} settling={settlingCard} />,
    catTotals.length > 0 && <ByCategory key="cats" totals={catTotals} colors={colors} subtitle={month ? monthName(month) : 'All months'} />,
  ].filter(Boolean)

  return (
    <div>
      <PageHeader
        title="Expenses"
        headline={loading ? null : expensesHeadline({
          total: monthTotal, count: inMonth.length, monthName: month ? monthName(month) : null,
          top: catTotals[0] ? { name: catTotals[0].name, total: catTotals[0].value } : null,
        })}
        chips={!loading && <>
          {markedTotal > 0 && <Chip dot="cyan">{fmtPeso(markedTotal)} marked</Chip>}
          {unpaidTotal > 0 && <Chip dot="warn">{fmtPeso(unpaidTotal)} unpaid on cards</Chip>}
        </>}
        month={<MonthSwitcher value={month} onChange={withReset(setMonth)} options={monthOptions(expenses.map(e => e.date?.slice(0, 7)), now)} />}
        actions={<Button icon={<PlusIcon />} onClick={() => openQuickAdd('expense')} className="max-lg:hidden">Add expense</Button>}
      />

      {topCards.length > 0 && (
        <div className={`flex lg:grid ${GRID_COLS[topCards.length]} gap-4 overflow-x-auto lg:overflow-visible snap-x -mx-4 px-4 lg:mx-0 lg:px-0 mb-4 [&>*]:min-w-[280px] lg:[&>*]:min-w-0 [&>*]:snap-start`}>
          {topCards}
        </div>
      )}

      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 lg:mx-0 lg:px-0 lg:flex-wrap">
            <SearchField value={search} onChange={withReset(setSearch)} placeholder="Search expenses" className="w-44 shrink-0" />
            {categories.length > 0 && <FilterPill label="Category" value={filterCategory} onChange={withReset(setFilterCategory)} options={categories.map(c => ({ value: c.id, label: c.name }))} />}
            {banks.length > 0 && <FilterPill label="Bank" value={filterBank} onChange={withReset(setFilterBank)} options={banks.map(b => ({ value: b.id, label: b.name }))} />}
            {creditCards.length > 0 && <FilterPill label="Card" value={filterCard} onChange={withReset(setFilterCard)} options={creditCards.map(c => ({ value: c.id, label: c.name }))} />}
            <FilterPill label="Marked" value={filterMarked} onChange={withReset(setFilterMarked)} options={MARKED_OPTIONS} />
            {hasFilters && <Button size="sm" variant="light" onClick={clearFilters} className="shrink-0">Clear</Button>}
          </div>
          <p className="lg:ml-auto text-xs text-muted whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? 'expense' : 'expenses'} · <span className="font-bold text-ink tnum">{fmtMoney(filteredTotal)}</span>
          </p>
        </div>

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          expenses.length === 0
            ? <EmptyState title="No expenses yet" body="Add your first expense to start tracking where your money goes."
                action={<Button icon={<PlusIcon />} onClick={() => openQuickAdd('expense')}>Add expense</Button>} />
            : <EmptyState title={hasFilters ? 'No expenses match these filters' : `No expenses in ${monthName(month)}`}
                action={hasFilters && <Button variant="light" size="sm" onClick={clearFilters}>Clear filters</Button>} />
        ) : (
          groupByDay(paginated, now).map(day => (
            <DayGroup key={day.date} label={day.label} total={fmtMoney(day.total)}>
              {day.rows.map(e => {
                const status = cardStatus(e)
                const catName = e.categories?.name || 'Uncategorised'
                const account = e.credit_cards?.name || e.banks?.name || ''
                return (
                  <div key={e.id} className="group relative flex items-center gap-3 px-2 py-2 rounded-row hover:bg-sub transition-colors">
                    <button type="button" className="md:hidden absolute inset-0 rounded-row" aria-label={`Edit ${e.description}`} onClick={() => setEditing(e)} />
                    <CategoryAvatar name={catName} color={categoryColor(colors, e.category_id)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{e.description}</p>
                      <p className="hidden md:block text-xs text-muted truncate">{catName}</p>
                      <p className="md:hidden text-xs text-muted truncate">
                        {account} · {status.short}{e.is_marked && <> · <StarIcon className="w-3 h-3 inline -mt-0.5 text-cyan-ink" /></>}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 justify-end shrink-0">
                      {e.banks?.name && <BankPill name={e.banks.name} />}
                      <Badge tone={status.tone}>{status.label}</Badge>
                      {e.is_marked && <Badge tone="mark">Marked</Badge>}
                    </div>
                    <span className="text-sm font-bold tnum w-28 text-right shrink-0">{fmtMoney(e.amount)}</span>
                    <RowActions name={e.description} onEdit={() => setEditing(e)} onDelete={() => handleDelete(e.id)} deleting={deleting === e.id} />
                  </div>
                )
              })}
            </DayGroup>
          ))
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>

      {editing && (
        <Modal title="Edit expense" onClose={() => setEditing(null)}>
          <ExpenseForm initialValues={editing} banks={banks} creditCards={creditCards} categories={categories}
            onSubmit={handleEdit} onClose={() => setEditing(null)} onDelete={() => handleDelete(editing.id)} submitLabel="Save changes" />
        </Modal>
      )}
    </div>
  )
}
