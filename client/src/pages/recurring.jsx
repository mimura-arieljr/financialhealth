import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })

const FREQUENCY_LABELS = { monthly: 'Monthly', weekly: 'Weekly' }

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
      {message}
    </p>
  )
}

function FieldInput({ label, type = 'text', value, onChange, placeholder, required, min, max, step }) {
  return (
    <div>
      {label && <label className="block text-xs text-neutral-400 mb-1.5">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} min={min} max={max} step={step}
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
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
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

function RecurringForm({ initialValues, banks, creditCards, categories, onSubmit, onClose, submitLabel }) {
  const [description, setDescription] = useState(initialValues?.description || '')
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : '')
  const [categoryId, setCategoryId] = useState(initialValues?.category_id || '')
  const [bankId, setBankId] = useState(initialValues?.bank_id || '')
  const [creditCardId, setCreditCardId] = useState(initialValues?.credit_card_id || '')
  const [frequency, setFrequency] = useState(initialValues?.frequency || 'monthly')
  const [dayOfMonth, setDayOfMonth] = useState(initialValues?.day_of_month ? String(initialValues.day_of_month) : '1')
  const [dayOfWeek, setDayOfWeek] = useState(initialValues?.day_of_week !== undefined ? String(initialValues.day_of_week) : '1')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!description.trim() || !amount || !bankId) {
      setError('Description, amount, and bank are required.')
      return
    }
    setSaving(true)
    const err = await onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      category_id: categoryId || null,
      bank_id: bankId,
      credit_card_id: creditCardId || null,
      frequency,
      day_of_month: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
      day_of_week: frequency === 'weekly' ? parseInt(dayOfWeek) : null,
    })
    if (err) setError(err)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldInput label="Description" value={description} onChange={setDescription}
        placeholder="e.g. Netflix" required />
      <FieldInput label="Amount (₱)" type="number" value={amount} onChange={setAmount}
        placeholder="0.00" required min="0.01" step="0.01" />
      <FieldSelect label="Frequency" value={frequency} onChange={setFrequency}>
        <option value="monthly">Monthly</option>
        <option value="weekly">Weekly</option>
      </FieldSelect>

      {/* Day selector — changes based on frequency */}
      {frequency === 'monthly' ? (
        <FieldInput
          label="Day of Month"
          type="number"
          value={dayOfMonth}
          onChange={setDayOfMonth}
          min="1"
          max="31"
          required
        />
      ) : (
        <FieldSelect label="Day of Week" value={dayOfWeek} onChange={setDayOfWeek}>
          {DAYS_OF_WEEK.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </FieldSelect>
      )}

      <FieldSelect label="Category" value={categoryId} onChange={setCategoryId}>
        <option value="">— Select category —</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </FieldSelect>
      <FieldSelect label="Financing Bank" value={bankId} onChange={setBankId} required>
        <option value="">— Select bank —</option>
        {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </FieldSelect>
      <FieldSelect label="Credit Card (optional)" value={creditCardId} onChange={setCreditCardId}>
        <option value="">— Cash / Direct Debit —</option>
        {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </FieldSelect>

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

function scheduleLabel(item) {
  if (item.frequency === 'monthly') {
    const day = item.day_of_month
    const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
    return `Every ${day}${suffix} of the month`
  }
  return `Every ${DAYS_OF_WEEK[item.day_of_week]}`
}

export default function Recurring() {
  const { user } = useAuth()
  const [banks, setBanks] = useState([])
  const [creditCards, setCreditCards] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('banks').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('credit_cards').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('categories').select('id, name').eq('user_id', user.id).order('name'),
    ]).then(([b, cc, cat]) => {
      if (!b.error) setBanks(b.data)
      if (!cc.error) setCreditCards(cc.data)
      if (!cat.error) setCategories(cat.data)
    })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('recurring_expenses')
      .select(`id, description, amount, frequency, day_of_month, day_of_week,
        last_logged, is_active, category_id, bank_id, credit_card_id,
        categories(id, name), banks(id, name), credit_cards(id, name)`)
      .eq('user_id', user.id)
      .order('description')
      .then(({ data, error }) => {
        if (!error) setItems(data)
        setLoading(false)
      })
  }, [user?.id, refreshKey])

  const handleAdd = async (values) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .insert({ user_id: user.id, ...values })
    if (error) return error.message
    setRefreshKey(k => k + 1)
    setShowAdd(false)
    return null
  }

  const handleEdit = async (values) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .update(values)
      .eq('id', editing.id)
    if (error) return error.message
    setRefreshKey(k => k + 1)
    setEditing(null)
    return null
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring expense?')) return
    setDeleting(id)
    await supabase.from('recurring_expenses').delete().eq('id', id)
    setDeleting(null)
    setRefreshKey(k => k + 1)
  }

  const handleToggle = async (item) => {
    setToggling(item.id)
    await supabase
      .from('recurring_expenses')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
    setToggling(null)
    setRefreshKey(k => k + 1)
  }

  const active = items.filter(i => i.is_active)
  const inactive = items.filter(i => !i.is_active)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Recurring</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your scheduled expenses.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Recurring
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-600 text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-neutral-600 text-sm">
          No recurring expenses yet. Add your first one.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active */}
          {active.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Active — {active.length} item{active.length !== 1 ? 's' : ''}
              </p>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                {active.map((item, idx) => (
                  <RecurringRow key={item.id} item={item} isLast={idx === active.length - 1}
                    onEdit={() => setEditing(item)}
                    onDelete={() => handleDelete(item.id)}
                    onToggle={() => handleToggle(item)}
                    deleting={deleting === item.id}
                    toggling={toggling === item.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive */}
          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                Paused — {inactive.length} item{inactive.length !== 1 ? 's' : ''}
              </p>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden opacity-60">
                {inactive.map((item, idx) => (
                  <RecurringRow key={item.id} item={item} isLast={idx === inactive.length - 1}
                    onEdit={() => setEditing(item)}
                    onDelete={() => handleDelete(item.id)}
                    onToggle={() => handleToggle(item)}
                    deleting={deleting === item.id}
                    toggling={toggling === item.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Recurring Expense" onClose={() => setShowAdd(false)}>
          <RecurringForm banks={banks} creditCards={creditCards} categories={categories}
            onSubmit={handleAdd} onClose={() => setShowAdd(false)} submitLabel="Save" />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Recurring Expense" onClose={() => setEditing(null)}>
          <RecurringForm initialValues={editing} banks={banks} creditCards={creditCards}
            categories={categories} onSubmit={handleEdit} onClose={() => setEditing(null)}
            submitLabel="Save Changes" />
        </Modal>
      )}
    </div>
  )
}

function RecurringRow({ item, isLast, onEdit, onDelete, onToggle, deleting, toggling }) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 group hover:bg-neutral-800/30 transition-colors ${!isLast ? 'border-b border-neutral-800/50' : ''}`}>
      {/* Toggle active */}
      <button onClick={onToggle} disabled={toggling}
        className={`relative inline-flex w-8 h-4.5 rounded-full transition-colors shrink-0 disabled:opacity-30 ${item.is_active ? 'bg-emerald-500' : 'bg-neutral-600'}`}>
        <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${item.is_active ? 'translate-x-3.5' : ''}`} />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-white font-medium">{item.description}</p>
          {item.credit_cards?.name && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
              {item.credit_cards.name}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          {scheduleLabel(item)}
          {item.categories?.name ? ` · ${item.categories.name}` : ''}
          {item.banks?.name ? ` · ${item.banks.name}` : ''}
          {item.last_logged ? ` · Last logged ${item.last_logged}` : ''}
        </p>
      </div>

      {/* Amount */}
      <span className="text-sm font-mono text-white whitespace-nowrap shrink-0">
        ₱{fmt(item.amount)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onEdit} className="text-neutral-500 hover:text-white transition-colors p-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
        </button>
        <button onClick={onDelete} disabled={deleting}
          className="text-neutral-500 hover:text-red-400 transition-colors p-1 disabled:opacity-30">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  )
}