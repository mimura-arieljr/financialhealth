import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })
const today = () => new Date().toISOString().split('T')[0]

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
      {message}
    </p>
  )
}

function FieldInput({ label, type = 'text', value, onChange, placeholder, required, min, step }) {
  return (
    <div>
      {label && <label className="block text-xs text-neutral-400 mb-1.5">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} min={min} step={step}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors" />
    </div>
  )
}

function FieldSelect({ label, value, onChange, children, required }) {
  return (
    <div>
      {label && <label className="block text-xs text-neutral-400 mb-1.5">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors appearance-none">
        {children}
      </select>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function TransferForm({ initialValues, banks, onSubmit, onClose, submitLabel }) {
  const [fromBankId, setFromBankId] = useState(initialValues?.from_bank_id || '')
  const [toBankId, setToBankId] = useState(initialValues?.to_bank_id || '')
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : '')
  const [date, setDate] = useState(initialValues?.date || today())
  const [note, setNote] = useState(initialValues?.note || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!fromBankId || !toBankId || !amount || !date) {
      setError('From bank, to bank, amount, and date are required.')
      return
    }
    if (fromBankId === toBankId) {
      setError('From and To banks must be different.')
      return
    }
    setSaving(true)
    const err = await onSubmit({
      from_bank_id: fromBankId,
      to_bank_id: toBankId,
      amount: parseFloat(amount),
      date,
      note: note.trim() || null,
    })
    if (err) setError(err)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldSelect label="From Bank" value={fromBankId} onChange={setFromBankId} required>
        <option value="">— Select source bank —</option>
        {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </FieldSelect>

      {/* Arrow indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-600">
          <div className="h-px w-16 bg-neutral-700" />
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div className="h-px w-16 bg-neutral-700" />
        </div>
      </div>

      <FieldSelect label="To Bank" value={toBankId} onChange={setToBankId} required>
        <option value="">— Select destination bank —</option>
        {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </FieldSelect>

      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Amount (₱)" type="number" value={amount} onChange={setAmount}
          placeholder="0.00" required min="0.01" step="0.01" />
        <FieldInput label="Date" type="date" value={date} onChange={setDate} required />
      </div>

      <FieldInput label="Note (optional)" value={note} onChange={setNote}
        placeholder="e.g. Load for bills" />

      <ErrorBanner message={error} />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg py-2.5 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 text-sm font-semibold rounded-lg py-2.5 transition-colors">
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default function Transfers() {
  const { user } = useAuth()
  const [banks, setBanks] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filterMonth, setFilterMonth] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('banks').select('id, name').eq('user_id', user.id).order('name')
      .then(({ data }) => { if (data) setBanks(data) })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const fetchTransfers = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('transfers')
        .select(`id, amount, date, note, created_at,
          from_bank_id, to_bank_id,
          from_bank:banks!transfers_from_bank_id_fkey(id, name),
          to_bank:banks!transfers_to_bank_id_fkey(id, name)`)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (!error && data) setTransfers(data)
      setLoading(false)
    }

    fetchTransfers()
    return () => { cancelled = true }
  }, [user?.id, refreshKey])

  const handleAdd = async (values) => {
    const { error } = await supabase.from('transfers').insert({ user_id: user.id, ...values })
    if (error) return error.message
    setRefreshKey(k => k + 1)
    setShowAdd(false)
    return null
  }

  const handleEdit = async (values) => {
    const { error } = await supabase.from('transfers').update(values).eq('id', editing.id)
    if (error) return error.message
    setRefreshKey(k => k + 1)
    setEditing(null)
    return null
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transfer?')) return
    setDeleting(id)
    await supabase.from('transfers').delete().eq('id', id)
    setDeleting(null)
    setRefreshKey(k => k + 1)
  }

  const months = [...new Set(transfers.map(t => t.date?.slice(0, 7)).filter(Boolean))].sort().reverse()
  const filtered = filterMonth ? transfers.filter(t => t.date?.slice(0, 7) === filterMonth) : transfers
  const totalFiltered = filtered.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Transfers</h1>
          <p className="text-neutral-500 text-sm mt-1">Move funds between your banks.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Transfer
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap mb-6">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="w-full sm:w-auto bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
          <option value="">All months</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {filterMonth && (
          <button onClick={() => setFilterMonth('')}
            className="text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-3.5 mb-4">
          <span className="text-sm text-neutral-400">
            {filtered.length} transfer{filtered.length !== 1 ? 's' : ''}{filterMonth ? ' (filtered)' : ''}
          </span>
          <span className="text-sm font-semibold text-white font-mono">₱{fmt(totalFiltered)}</span>
        </div>
      )}

      {/* List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center text-neutral-600 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-neutral-600 text-sm">
            {transfers.length === 0 ? 'No transfers yet.' : 'No transfers this month.'}
          </div>
        ) : (
          filtered.map(transfer => (
            <div key={transfer.id}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors group">

              {/* Arrow icon */}
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>

              {/* Banks */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm text-white">
                  <span className="truncate font-medium">{transfer.from_bank?.name}</span>
                  <svg className="w-3 h-3 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="truncate font-medium">{transfer.to_bank?.name}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {transfer.date}{transfer.note ? ` · ${transfer.note}` : ''}
                </p>
              </div>

              {/* Amount + actions */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-mono text-white">₱{fmt(transfer.amount)}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(transfer)}
                    className="text-neutral-500 hover:text-white transition-colors p-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(transfer.id)} disabled={deleting === transfer.id}
                    className="text-neutral-500 hover:text-red-400 transition-colors p-1 disabled:opacity-30">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <Modal title="New Transfer" onClose={() => setShowAdd(false)}>
          <TransferForm banks={banks} onSubmit={handleAdd} onClose={() => setShowAdd(false)} submitLabel="Transfer" />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Transfer" onClose={() => setEditing(null)}>
          <TransferForm initialValues={editing} banks={banks}
            onSubmit={handleEdit} onClose={() => setEditing(null)} submitLabel="Save Changes" />
        </Modal>
      )}
    </div>
  )
}