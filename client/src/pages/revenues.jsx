import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchCached } from '../lib/cache'
import { useAuth } from '../hooks/useAuth'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { compareMonth } from '../lib/finance'
import { revenuesHeadline } from '../lib/headlines'
import { groupByDay } from '../lib/grouping'
import { fmtMoney, fmtPeso, getLast12Months, monthKey, monthName, monthOptions } from '../lib/utils'
import { Modal } from '../components/ui/modal'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Chip } from '../components/ui/pill'
import { PageHeader } from '../components/ui/pageHeader'
import { MonthSwitcher } from '../components/ui/monthSwitcher'
import { FilterPill } from '../components/ui/filterPill'
import { DayGroup } from '../components/ui/dayGroup'
import { EmptyState } from '../components/ui/emptyState'
import { Loading } from '../components/ui/spinner'
import { RowActions } from '../components/ui/rowActions'
import { BankPill } from '../components/ui/avatar'
import { IncomeIcon, PlusIcon } from '../components/ui/icons'
import { RevenueForm } from '../components/forms/revenueForm'

export default function Revenues() {
  const { user } = useAuth()
  const userId = user?.id
  const { openQuickAdd, dataVersion, notifySaved } = useQuickAdd()
  const now = useMemo(() => new Date(), [])

  const [banks, setBanks] = useState([])
  const [revenues, setRevenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [month, setMonth] = useState(monthKey(now))
  const [filterBank, setFilterBank] = useState('')

  useEffect(() => {
    if (!userId) return
    fetchCached('banks', userId, 'id, name', 'name').then(({ data, error }) => { if (!error) setBanks(data) })
  }, [userId, dataVersion])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('revenues')
      .select('id, description, amount, date, bank_id, created_at, banks(id, name)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setRevenues(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId, dataVersion])

  const handleEdit = async (values) => {
    const { error } = await supabase.from('revenues').update(values).eq('id', editing.id)
    if (error) return error.message
    notifySaved()
    return null
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this revenue entry?')) return
    setDeleting(id)
    await supabase.from('revenues').delete().eq('id', id)
    setDeleting(null)
    setEditing(null)
    notifySaved()
  }

  const inMonth = month ? revenues.filter(r => r.date?.slice(0, 7) === month) : revenues
  const monthTotal = inMonth.reduce((s, r) => s + Number(r.amount), 0)
  // Same 12-month average as Analytics' income consistency
  const avg12 = getLast12Months().reduce((s, { key }) =>
    s + revenues.filter(r => r.date?.slice(0, 7) === key).reduce((ss, r) => ss + Number(r.amount), 0), 0) / 12

  const filtered = filterBank ? inMonth.filter(r => r.bank_id === filterBank) : inMonth
  const filteredTotal = filtered.reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div className="motion-stagger">
      <PageHeader
        title="Revenues"
        headline={loading ? null : revenuesHeadline({
          total: monthTotal, count: inMonth.length, monthName: month ? monthName(month) : null,
          comparison: month ? compareMonth(revenues, month, now) : null,
        })}
        chips={!loading && avg12 > 0 && <Chip dot="cyan">12-month avg {fmtPeso(avg12)}</Chip>}
        month={<MonthSwitcher value={month} onChange={setMonth} options={monthOptions(revenues.map(r => r.date?.slice(0, 7)), now)} />}
        actions={<Button icon={<PlusIcon />} onClick={() => openQuickAdd('revenue')} className="max-lg:hidden">Add revenue</Button>}
      />

      {loading ? <Loading /> : (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            {banks.length > 0 && <FilterPill label="All banks" value={filterBank} onChange={setFilterBank} options={banks.map(b => ({ value: b.id, label: b.name }))} />}
            <p className="ml-auto text-xs text-muted whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} · <span className="font-bold text-good tnum">{fmtMoney(filteredTotal, { sign: true })}</span>
            </p>
          </div>

          {filtered.length === 0 ? (
            revenues.length === 0
              ? <EmptyState title="No income logged yet" body="Add your salary or any money you receive to see it here."
                  action={<Button icon={<PlusIcon />} onClick={() => openQuickAdd('revenue')}>Add revenue</Button>} />
              : <EmptyState title={filterBank ? 'No entries for this bank' : `No income logged in ${monthName(month)}`} />
          ) : (
            groupByDay(filtered, now).map(day => (
              <DayGroup key={day.date} label={day.label} total={<span className="text-good">{fmtMoney(day.total, { sign: true })}</span>}>
                {day.rows.map(r => (
                  <div key={r.id} className="group relative flex items-center gap-3 px-2 py-2 rounded-row hover:bg-sub transition-colors">
                    <button type="button" className="md:hidden absolute inset-0 rounded-row" aria-label={`Edit ${r.description}`} onClick={() => setEditing(r)} />
                    <span className="w-9 h-9 rounded-[12px] bg-good-bg text-good grid place-items-center shrink-0"><IncomeIcon /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{r.description}</p>
                      <p className="md:hidden text-xs text-muted truncate">{r.banks?.name}</p>
                    </div>
                    <div className="hidden md:block shrink-0">{r.banks?.name && <BankPill name={r.banks.name} />}</div>
                    <span className="text-sm font-bold text-good tnum w-32 text-right shrink-0">{fmtMoney(r.amount, { sign: true })}</span>
                    <RowActions name={r.description} onEdit={() => setEditing(r)} onDelete={() => handleDelete(r.id)} deleting={deleting === r.id} />
                  </div>
                ))}
              </DayGroup>
            ))
          )}
        </Card>
      )}

      {editing && (
        <Modal title="Edit revenue" onClose={() => setEditing(null)}>
          <RevenueForm initialValues={editing} banks={banks} onSubmit={handleEdit} onClose={() => setEditing(null)}
            onDelete={() => handleDelete(editing.id)} submitLabel="Save changes" />
        </Modal>
      )}
    </div>
  )
}
