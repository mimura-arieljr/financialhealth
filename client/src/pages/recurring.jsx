import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchCached } from '../lib/cache'
import { useAuth } from '../hooks/useAuth'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { logRecurringExpense } from '../lib/recurring'
import { DAYS_OF_WEEK } from '../lib/consts'
import { recurringStatus, daysUntil, monthlyEquivalent, sortByAttention } from '../lib/recurringStatus'
import { recurringHeadline } from '../lib/headlines'
import { categoryColorMap, categoryColor } from '../lib/palette'
import { fmtDayMonth, fmtMoney, fmtPeso, ordinal } from '../lib/utils'
import { Modal } from '../components/ui/modal'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge, Chip } from '../components/ui/pill'
import { PageHeader } from '../components/ui/pageHeader'
import { Toggle } from '../components/ui/toggle'
import { EmptyState } from '../components/ui/emptyState'
import { ErrorBanner } from '../components/ui/errorBanner'
import { Loading } from '../components/ui/spinner'
import { RowActions } from '../components/ui/rowActions'
import { CategoryAvatar } from '../components/ui/avatar'
import { PlusIcon } from '../components/ui/icons'
import { RecurringForm } from './recurring/recurringForm'
import { Timeline } from './recurring/timeline'

const isDueState = (s) => s.state === 'overdue' || s.state === 'due-today'

function scheduleLine(item) {
  const when = item.frequency === 'monthly' ? `Every ${ordinal(item.day_of_month)}` : `Every ${DAYS_OF_WEEK[item.day_of_week]}`
  return [when, item.categories?.name, item.banks?.name].filter(Boolean).join(' · ')
}

function statusBadge(item, s, now) {
  if (!item.is_active) return <Badge>Paused</Badge>
  if (s.state === 'overdue') return <Badge tone="alert">Overdue · {fmtDayMonth(s.dueDate)}</Badge>
  if (s.state === 'due-today') return <Badge tone="alert">Due today</Badge>
  if (s.state === 'logged') return <Badge tone="good">Logged this {item.frequency === 'weekly' ? 'week' : 'month'}</Badge>
  const days = daysUntil(s.nextDue, now)
  return <Badge>{days === 1 ? 'Tomorrow' : `In ${days} days`}</Badge>
}

function RecurringRow({ item, now, colors, onEdit, onDelete, onToggle, onPay, busy }) {
  const s = recurringStatus(item, now)
  const due = item.is_active && isDueState(s)
  const catName = item.categories?.name || 'Uncategorised'
  return (
    <div className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-row transition-colors ${due ? 'bg-alert-bg/50' : 'hover:bg-sub'} ${item.is_active ? '' : 'opacity-60'}`}>
      <button type="button" className="md:hidden absolute inset-0 rounded-row" aria-label={`Edit ${item.description}`} onClick={onEdit} />
      <span className="relative z-10"><Toggle checked={item.is_active} onChange={onToggle} disabled={busy.toggling} label={`${item.description} active`} /></span>
      <span className="hidden sm:block"><CategoryAvatar name={catName} color={categoryColor(colors, item.category_id)} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate flex items-center gap-2">
          <span className="truncate">{item.description}</span>
          {item.credit_cards?.name && <Badge className="max-md:hidden">{item.credit_cards.name}</Badge>}
          <span className="md:hidden font-semibold text-muted tnum shrink-0">· {fmtPeso(item.amount)}</span>
        </p>
        <p className="text-xs text-muted truncate">{scheduleLine(item)}</p>
        <div className="md:hidden mt-1">{statusBadge(item, s, now)}</div>
      </div>
      <div className="hidden md:block w-36 shrink-0">{statusBadge(item, s, now)}</div>
      <span className="hidden lg:block w-24 text-xs text-muted shrink-0">{item.last_logged ? `Last ${fmtDayMonth(item.last_logged)}` : 'Never logged'}</span>
      <span className="hidden md:block w-24 text-right text-sm font-bold tnum shrink-0">{fmtMoney(item.amount)}</span>
      {item.is_active && (
        <span className={`relative z-10 shrink-0 ${due ? '' : 'hidden md:inline-block'}`}>
          <Button size="sm" variant={due ? 'cyan' : 'light'} disabled={busy.paying} onClick={onPay}>
            {busy.paying ? 'Paying...' : 'Pay now'}
          </Button>
        </span>
      )}
      <RowActions name={item.description} onEdit={onEdit} onDelete={onDelete} deleting={busy.deleting} />
    </div>
  )
}

export default function Recurring() {
  const { user } = useAuth()
  const userId = user?.id
  const { dataVersion, notifySaved } = useQuickAdd()
  const now = useMemo(() => new Date(), [])

  const [banks, setBanks] = useState([])
  const [creditCards, setCreditCards] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [paying, setPaying] = useState(null)
  const [payError, setPayError] = useState('')

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
      .from('recurring_expenses')
      .select(`id, description, amount, frequency, day_of_month, day_of_week,
        last_logged, is_active, category_id, bank_id, credit_card_id,
        categories(id, name), banks(id, name), credit_cards(id, name)`)
      .eq('user_id', userId)
      .order('description')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setItems(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId, dataVersion])

  const handleAdd = async (values) => {
    const { error } = await supabase.from('recurring_expenses').insert({ user_id: userId, ...values })
    if (error) return error.message
    setShowAdd(false)
    notifySaved()
    return null
  }

  const handleEdit = async (values) => {
    const { error } = await supabase.from('recurring_expenses').update(values).eq('id', editing.id)
    if (error) return error.message
    setEditing(null)
    notifySaved()
    return null
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring expense?')) return
    setDeleting(id)
    await supabase.from('recurring_expenses').delete().eq('id', id)
    setDeleting(null)
    setEditing(null)
    notifySaved()
  }

  const handleToggle = async (item) => {
    setToggling(item.id)
    await supabase.from('recurring_expenses').update({ is_active: !item.is_active }).eq('id', item.id)
    setToggling(null)
    notifySaved()
  }

  const handlePayNow = async (item) => {
    setPaying(item.id)
    setPayError('')
    const err = await logRecurringExpense(userId, item)
    if (err) setPayError(err)
    setPaying(null)
    notifySaved()
  }

  const colors = categoryColorMap(categories)
  const active = sortByAttention(items.filter(i => i.is_active), now)
  const paused = items.filter(i => !i.is_active)
  const dueItems = active.filter(i => isDueState(recurringStatus(i, now)))
  const comingUp = active.filter(i => !dueItems.includes(i))
  const monthlyTotal = active.reduce((s, i) => s + monthlyEquivalent(i), 0)

  const row = (item) => (
    <RecurringRow key={item.id} item={item} now={now} colors={colors}
      onEdit={() => setEditing(item)} onDelete={() => handleDelete(item.id)}
      onToggle={() => handleToggle(item)} onPay={() => handlePayNow(item)}
      busy={{ toggling: toggling === item.id, paying: paying === item.id, deleting: deleting === item.id }} />
  )

  const groupTitle = (title, extra) => (
    <div className="flex items-center justify-between px-1 mb-1.5 mt-5 first:mt-0 text-xs font-semibold text-muted">
      <span>{title}</span>{extra && <span className="tnum">{extra}</span>}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Recurring"
        headline={loading ? null : recurringHeadline({ activeCount: active.length, monthlyTotal, dueCount: dueItems.length })}
        chips={!loading && <>
          {dueItems.length > 0 && <Chip dot="alert">{dueItems.length} due now</Chip>}
          {paused.length > 0 && <Chip dot="ink">{paused.length} paused</Chip>}
        </>}
        actions={<Button icon={<PlusIcon />} onClick={() => setShowAdd(true)}>Add recurring</Button>}
      />

      {!loading && active.length > 0 && <div className="mb-4"><Timeline items={active} now={now} /></div>}

      {loading ? <Loading /> : (
        <Card>
          <ErrorBanner message={payError} />
          {items.length === 0 ? (
            <EmptyState title="No recurring expenses yet" body="Add bills and subscriptions to see what's due and pay them in one tap."
              action={<Button icon={<PlusIcon />} onClick={() => setShowAdd(true)}>Add recurring</Button>} />
          ) : (
            <>
              {/* Desktop: one attention-sorted list; mobile: needs attention, then coming up */}
              <div className="hidden md:block">
                {active.length > 0 && groupTitle(`Active · ${active.length}`, `≈ ${fmtPeso(monthlyTotal)} / month`)}
                <div className="space-y-1">{active.map(row)}</div>
              </div>
              <div className="md:hidden">
                {dueItems.length > 0 && <>{groupTitle('Needs attention')}<div className="space-y-1">{dueItems.map(row)}</div></>}
                {comingUp.length > 0 && <>{groupTitle('Coming up')}<div className="space-y-1">{comingUp.map(row)}</div></>}
              </div>
              {paused.length > 0 && <>{groupTitle(`Paused · ${paused.length}`)}<div className="space-y-1">{paused.map(row)}</div></>}
            </>
          )}
        </Card>
      )}

      {showAdd && (
        <Modal title="Add recurring expense" onClose={() => setShowAdd(false)}>
          <RecurringForm banks={banks} creditCards={creditCards} categories={categories}
            onSubmit={handleAdd} onClose={() => setShowAdd(false)} submitLabel="Add recurring" />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit recurring expense" onClose={() => setEditing(null)}>
          <RecurringForm initialValues={editing} banks={banks} creditCards={creditCards} categories={categories}
            onSubmit={handleEdit} onClose={() => setEditing(null)} onDelete={() => handleDelete(editing.id)} submitLabel="Save changes" />
        </Modal>
      )}
    </div>
  )
}
