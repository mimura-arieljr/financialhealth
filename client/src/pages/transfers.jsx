import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchCached } from '../lib/cache'
import { useAuth } from '../hooks/useAuth'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { transfersHeadline } from '../lib/headlines'
import { groupByDay } from '../lib/grouping'
import { fmtMoney, monthKey, monthName, monthOptions } from '../lib/utils'
import { Modal } from '../components/ui/modal'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/pageHeader'
import { MonthSwitcher } from '../components/ui/monthSwitcher'
import { DayGroup } from '../components/ui/dayGroup'
import { EmptyState } from '../components/ui/emptyState'
import { Loading } from '../components/ui/spinner'
import { RowActions } from '../components/ui/rowActions'
import { BankPill } from '../components/ui/avatar'
import { TransferIcon } from '../components/ui/icons'
import { TransferForm } from '../components/forms/transferForm'

export default function Transfers() {
  const { user } = useAuth()
  const userId = user?.id
  const { openQuickAdd, dataVersion, notifySaved } = useQuickAdd()
  const now = useMemo(() => new Date(), [])

  const [banks, setBanks] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [month, setMonth] = useState(monthKey(now))

  useEffect(() => {
    if (!userId) return
    fetchCached('banks', userId, 'id, name', 'name').then(({ data, error }) => { if (!error) setBanks(data) })
  }, [userId, dataVersion])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('transfers')
      .select(`id, amount, date, note, created_at,
        from_bank_id, to_bank_id,
        from_bank:banks!transfers_from_bank_id_fkey(id, name),
        to_bank:banks!transfers_to_bank_id_fkey(id, name)`)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setTransfers(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId, dataVersion])

  const handleEdit = async (values) => {
    const { error } = await supabase.from('transfers').update(values).eq('id', editing.id)
    if (error) return error.message
    setEditing(null)
    notifySaved()
    return null
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transfer?')) return
    setDeleting(id)
    await supabase.from('transfers').delete().eq('id', id)
    setDeleting(null)
    setEditing(null)
    notifySaved()
  }

  const inMonth = month ? transfers.filter(t => t.date?.slice(0, 7) === month) : transfers
  const total = inMonth.reduce((s, t) => s + Number(t.amount), 0)
  const label = (t) => `${t.from_bank?.name || 'Unknown bank'} to ${t.to_bank?.name || 'Unknown bank'}`

  return (
    <div>
      <PageHeader
        title="Transfers"
        headline={loading ? null : transfersHeadline({ total, count: inMonth.length, monthName: month ? monthName(month) : null })}
        month={<MonthSwitcher value={month} onChange={setMonth} options={monthOptions(transfers.map(t => t.date?.slice(0, 7)), now)} />}
        actions={<Button icon={<TransferIcon />} onClick={() => openQuickAdd('transfer')} className="max-lg:hidden">New transfer</Button>}
      />

      <Card>
        <p className="text-xs text-muted mb-4 text-right">
          {inMonth.length} {inMonth.length === 1 ? 'transfer' : 'transfers'} · <span className="font-bold text-ink tnum">{fmtMoney(total)}</span>
        </p>

        {loading ? (
          <Loading />
        ) : inMonth.length === 0 ? (
          transfers.length === 0
            ? <EmptyState title="No transfers yet" body="Moving money between your banks keeps each balance right."
                action={<Button icon={<TransferIcon />} onClick={() => openQuickAdd('transfer')}>New transfer</Button>} />
            : <EmptyState title={`No transfers in ${monthName(month)}`} />
        ) : (
          groupByDay(inMonth, now).map(day => (
            <DayGroup key={day.date} label={day.label} total={fmtMoney(day.total)}>
              {day.rows.map(t => (
                <div key={t.id} className="group relative flex items-center gap-3 px-2 py-2 rounded-row hover:bg-sub transition-colors">
                  <button type="button" className="md:hidden absolute inset-0 rounded-row" aria-label={`Edit transfer ${label(t)}`} onClick={() => setEditing(t)} />
                  <div className="flex items-center gap-1.5 min-w-0 md:w-[300px] md:shrink-0">
                    <BankPill name={t.from_bank?.name || 'Unknown bank'} />
                    <TransferIcon className="w-3.5 h-3.5 text-cyan-ink shrink-0" />
                    <BankPill name={t.to_bank?.name || 'Unknown bank'} />
                  </div>
                  <p className={`hidden md:block flex-1 min-w-0 text-sm truncate ${t.note ? '' : 'text-faint'}`}>{t.note || 'No note'}</p>
                  <span className="ml-auto md:ml-0 text-sm font-bold tnum w-28 text-right shrink-0">{fmtMoney(t.amount)}</span>
                  <RowActions name={`transfer ${label(t)}`} onEdit={() => setEditing(t)} onDelete={() => handleDelete(t.id)} deleting={deleting === t.id} />
                </div>
              ))}
            </DayGroup>
          ))
        )}
      </Card>

      {editing && (
        <Modal title="Edit transfer" onClose={() => setEditing(null)}>
          <TransferForm initialValues={editing} banks={banks} onSubmit={handleEdit} onClose={() => setEditing(null)}
            onDelete={() => handleDelete(editing.id)} submitLabel="Save changes" />
        </Modal>
      )}
    </div>
  )
}
