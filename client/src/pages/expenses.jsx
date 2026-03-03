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

function CardStatusBadge({ creditCardId, isCardSettled }) {
  if (!creditCardId) return <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">Cash</span>
  if (isCardSettled) return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Settled</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Unpaid</span>
}

function ExpenseForm({ initialValues, banks, creditCards, categories, onSubmit, onClose, submitLabel }) {
  const [description, setDescription] = useState(initialValues?.description || '')
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : '')
  const [date, setDate] = useState(initialValues?.date || today())
  const [categoryId, setCategoryId] = useState(initialValues?.category_id || '')
  const [bankId, setBankId] = useState(initialValues?.bank_id || '')
  const [creditCardId, setCreditCardId] = useState(initialValues?.credit_card_id || '')
  const [isCardSettled, setIsCardSettled] = useState(initialValues?.is_card_settled || false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const usedCard = creditCardId !== ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!description.trim() || !amount || !date || !bankId) {
      setError('Description, amount, date, and bank are required.')
      return
    }
    setSaving(true)
    const err = await onSubmit({
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      category_id: categoryId || null,
      bank_id: bankId,
      credit_card_id: creditCardId || null,
      is_card_settled: usedCard ? isCardSettled : null,
    })
    if (err) setError(err)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldInput label="Description" value={description} onChange={setDescription} placeholder="e.g. Starbucks" required />
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Amount (₱)" type="number" value={amount} onChange={setAmount} placeholder="0.00" required min="0.01" step="0.01" />
        <FieldInput label="Date" type="date" value={date} onChange={setDate} required />
      </div>
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
      {usedCard && (
        <div className="flex items-center justify-between bg-neutral-800 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm text-white">Card bill settled?</p>
            <p className="text-xs text-neutral-500 mt-0.5">Toggle on if you've already paid this card bill</p>
          </div>
          <button type="button" onClick={() => setIsCardSettled(v => !v)}
            className={`relative inline-flex w-10 h-6 rounded-full transition-colors shrink-0 ${isCardSettled ? 'bg-emerald-500' : 'bg-neutral-600'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isCardSettled ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      )}
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

export default function Expenses() {
  const { user, loading: authLoading } = useAuth()
  const [banks, setBanks] = useState([])
  const [creditCards, setCreditCards] = useState([])
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBank, setFilterBank] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    const fetchRef = async () => {
      const [b, cc, cat] = await Promise.all([
        supabase.from('banks').select('id, name').eq('user_id', user.id).order('name'),
        supabase.from('credit_cards').select('id, name').eq('user_id', user.id).order('name'),
        supabase.from('categories').select('id, name').eq('user_id', user.id).order('name'),
      ])
      if (!b.error) setBanks(b.data)
      if (!cc.error) setCreditCards(cc.data)
      if (!cat.error) setCategories(cat.data)
    }
    fetchRef()
  }, [user?.id, refreshKey])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase
      .from('expenses')
      .select(`id, description, amount, date, is_card_settled, created_at,
        category_id, bank_id, credit_card_id,
        categories(id, name), banks(id, name), credit_cards(id, name)`)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setExpenses(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user?.id, refreshKey])

  const handleAdd = async (values) => {
    const { error } = await supabase.from('expenses').insert({ user_id: user.id, ...values })
    if (error) return error.message
    setRefreshKey(k => k + 1)
    setShowAdd(false)
    return null
  }

  const handleEdit = async (values) => {
    const { error } = await supabase.from('expenses').update(values).eq('id', editingExpense.id)
    if (error) return error.message
    setRefreshKey(k => k + 1)
    setEditingExpense(null)
    return null
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    setDeleting(id)
    await supabase.from('expenses').delete().eq('id', id)
    setDeleting(null)
    setRefreshKey(k => k + 1)
  }

  const filtered = expenses.filter(e => {
    if (filterCategory && e.categories?.id !== filterCategory) return false
    if (filterBank && e.banks?.id !== filterBank) return false
    if (filterMonth && e.date?.slice(0, 7) !== filterMonth) return false
    return true
  })

  const totalFiltered = filtered.reduce((sum, e) => sum + Number(e.amount), 0)
  const months = [...new Set(expenses.map(e => e.date?.slice(0, 7)).filter(Boolean))].sort().reverse()
  const hasFilters = filterMonth || filterCategory || filterBank

  if (authLoading || !user) return null
  
  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Expenses</h1>
          <p className="text-neutral-500 text-sm mt-1">Track and manage your spending.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap mb-6">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="w-full sm:w-auto bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
          <option value="">All months</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="w-full sm:w-auto bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterBank} onChange={e => setFilterBank(e.target.value)}
          className="w-full sm:w-auto bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
          <option value="">All banks</option>
          {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterMonth(''); setFilterCategory(''); setFilterBank('') }}
            className="text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-3.5 mb-4">
          <span className="text-sm text-neutral-400">
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' (filtered)' : ''}
          </span>
          <span className="text-sm font-semibold text-white font-mono">₱{fmt(totalFiltered)}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 pr-20 py-3 border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
          <span>Expenses</span>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-neutral-600 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-neutral-600 text-sm">
            {expenses.length === 0 ? 'No expenses yet. Add your first one!' : 'No expenses match your filters.'}
          </div>
        ) : (
          filtered.map(expense => (
            <div key={expense.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors group">
              {/* Mobile card */}
              <div className="sm:hidden flex items-center gap-3 px-4 py-3.5">
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingExpense(expense)} className="text-neutral-500 hover:text-white transition-colors p-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(expense.id)} disabled={deleting === expense.id}
                    className="text-neutral-500 hover:text-red-400 transition-colors p-1 disabled:opacity-30">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{expense.description}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {expense.date}{expense.categories?.name ? ` · ${expense.categories.name}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-mono text-white">₱{fmt(expense.amount)}</p>
                  <div className="mt-1">
                    <CardStatusBadge creditCardId={expense.credit_cards?.id} isCardSettled={expense.is_card_settled} />
                  </div>
                </div>
              </div>
              {/* Desktop row */}
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 items-center">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{expense.description}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{expense.date}</p>
                </div>
                <span className="text-sm font-mono text-white text-right whitespace-nowrap">₱{fmt(expense.amount)}</span>
                <span className="text-xs text-neutral-400 whitespace-nowrap">
                  {expense.categories?.name || <span className="text-neutral-600">—</span>}
                </span>
                <span className="text-xs text-neutral-400 whitespace-nowrap">
                  {expense.banks?.name || <span className="text-neutral-600">—</span>}
                </span>
                <div className="flex items-center gap-2">
                  <CardStatusBadge creditCardId={expense.credit_cards?.id} isCardSettled={expense.is_card_settled} />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingExpense(expense)} className="text-neutral-500 hover:text-white transition-colors p-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(expense.id)} disabled={deleting === expense.id}
                      className="text-neutral-500 hover:text-red-400 transition-colors p-1 disabled:opacity-30">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <Modal title="Add Expense" onClose={() => setShowAdd(false)}>
          <ExpenseForm banks={banks} creditCards={creditCards} categories={categories}
            onSubmit={handleAdd} onClose={() => setShowAdd(false)} submitLabel="Save Expense" />
        </Modal>
      )}

      {editingExpense && (
        <Modal title="Edit Expense" onClose={() => setEditingExpense(null)}>
          <ExpenseForm initialValues={editingExpense} banks={banks} creditCards={creditCards} categories={categories}
            onSubmit={handleEdit} onClose={() => setEditingExpense(null)} submitLabel="Save Changes" />
        </Modal>
      )}
    </div>
  )
}