import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const TABS = ['Banks', 'Credit Cards', 'Categories']

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 w-full sm:w-fit">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            active === tab
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

function EmptyState({ message }) {
  return <div className="text-center py-12 text-neutral-600 text-sm">{message}</div>
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-3">
      {message}
    </p>
  )
}

function DeleteButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-neutral-600 hover:text-red-400 transition-colors disabled:opacity-30 p-1"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  )
}

function BanksTab({ userId }) {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [name, setName] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase.from('banks').select('*').eq('user_id', userId).order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setBanks(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId, refreshKey])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    setAdding(true)
    const { error } = await supabase.from('banks').insert({
      user_id: userId, name: name.trim(), initial_balance: parseFloat(initialBalance) || 0
    })
    if (error) setError(error.message)
    else { setName(''); setInitialBalance(''); setRefreshKey(k => k + 1) }
    setAdding(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    const { error } = await supabase.from('banks').delete().eq('id', id)
    if (error) setError(error.message)
    else setRefreshKey(k => k + 1)
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-4">Add Bank</h3>
        <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-36">
            <label className="block text-xs text-neutral-400 mb-1.5">Bank Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BPI"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors" />
          </div>
          <div className="flex-1 min-w-36">
            <label className="block text-xs text-neutral-400 mb-1.5">Initial Balance (₱)</label>
            <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)}
              placeholder="0.00" min="0" step="0.01"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors" />
          </div>
          <button type="submit" disabled={adding}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold text-sm rounded-lg px-4 py-2 transition-colors">
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
        <ErrorBanner message={error} />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800 flex justify-between text-xs font-medium text-neutral-500 uppercase tracking-wider">
          <span>Bank</span><span>Initial Balance</span>
        </div>
        {loading ? <div className="px-5 py-8 text-center text-neutral-600 text-sm">Loading...</div>
          : banks.length === 0 ? <EmptyState message="No banks added yet." />
          : banks.map(bank => (
            <div key={bank.id} className="px-5 py-3.5 flex items-center justify-between border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <DeleteButton onClick={() => handleDelete(bank.id)} loading={deleting === bank.id} />
                <span className="text-sm text-white">{bank.name}</span>
              </div>
              <span className="text-sm text-neutral-300 font-mono">
                ₱{Number(bank.initial_balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

function CreditCardsTab({ userId }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase.from('credit_cards').select('*').eq('user_id', userId).order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setCards(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId, refreshKey])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    setAdding(true)
    const { error } = await supabase.from('credit_cards').insert({ user_id: userId, name: name.trim() })
    if (error) setError(error.message)
    else { setName(''); setRefreshKey(k => k + 1) }
    setAdding(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    const { error } = await supabase.from('credit_cards').delete().eq('id', id)
    if (error) setError(error.message)
    else setRefreshKey(k => k + 1)
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-4">Add Credit Card</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs text-neutral-400 mb-1.5">Card / Issuer Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Metrobank"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors" />
          </div>
          <button type="submit" disabled={adding}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold text-sm rounded-lg px-4 py-2 transition-colors">
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
        <ErrorBanner message={error} />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">Card</div>
        {loading ? <div className="px-5 py-8 text-center text-neutral-600 text-sm">Loading...</div>
          : cards.length === 0 ? <EmptyState message="No credit cards added yet." />
          : cards.map(card => (
            <div key={card.id} className="px-5 py-3.5 flex items-center gap-3 border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors">
              <DeleteButton onClick={() => handleDelete(card.id)} loading={deleting === card.id} />
              <span className="text-sm text-white">{card.name}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

function CategoriesTab({ userId }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase.from('categories').select('*').eq('user_id', userId).order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setCategories(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId, refreshKey])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    setAdding(true)
    const { error } = await supabase.from('categories').insert({ user_id: userId, name: name.trim() })
    if (error) setError(error.message)
    else { setName(''); setRefreshKey(k => k + 1) }
    setAdding(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) setError(error.message)
    else setRefreshKey(k => k + 1)
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-4">Add Category</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs text-neutral-400 mb-1.5">Category Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Travel"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors" />
          </div>
          <button type="submit" disabled={adding}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold text-sm rounded-lg px-4 py-2 transition-colors">
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
        <ErrorBanner message={error} />
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</div>
        {loading ? <div className="px-5 py-8 text-center text-neutral-600 text-sm">Loading...</div>
          : categories.length === 0 ? <EmptyState message="No categories added yet." />
          : categories.map(cat => (
            <div key={cat.id} className="px-5 py-3.5 flex items-center gap-3 border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors">
              <DeleteButton onClick={() => handleDelete(cat.id)} loading={deleting === cat.id} />
              <span className="text-sm text-white">{cat.name}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('Banks')

  if (loading || !user) return null

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage your banks, credit cards, and categories.</p>
      </div>
      <div className="mb-6">
        <TabBar active={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === 'Banks' && <BanksTab userId={user.id} />}
      {activeTab === 'Credit Cards' && <CreditCardsTab userId={user.id} />}
      {activeTab === 'Categories' && <CategoriesTab userId={user.id} />}
    </div>
  )
}