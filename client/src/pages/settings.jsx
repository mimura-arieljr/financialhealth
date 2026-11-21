import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { invalidateTable } from '../lib/cache'
import { useAuth } from '../hooks/useAuth'
import { fmtMoney } from '../lib/utils'
import { ErrorBanner } from '../components/ui/errorBanner'
import { PageHeader } from '../components/ui/pageHeader'
import { Card } from '../components/ui/card'
import { Button, IconButton } from '../components/ui/button'
import { FieldInput } from '../components/ui/fieldInput'
import { EmptyState } from '../components/ui/emptyState'
import { Loading } from '../components/ui/spinner'
import { BankAvatar } from '../components/ui/avatar'
import { PlusIcon, TrashIcon } from '../components/ui/icons'

const TABS = ['Banks', 'Credit Cards', 'Categories']

function TabBar({ active, onChange }) {
  return (
    <div role="tablist" className="inline-flex gap-0.5 bg-card rounded-full p-1.5 w-full sm:w-fit">
      {TABS.map(tab => (
        <button key={tab} type="button" role="tab" aria-selected={active === tab} onClick={() => onChange(tab)}
          className={`flex-1 sm:flex-none px-4 h-9 rounded-full text-sm font-medium transition-colors ${active === tab ? 'bg-ink text-white' : 'text-[#4B5563] hover:text-ink hover:bg-sub'}`}>
          {tab}
        </button>
      ))}
    </div>
  )
}

function DeleteButton({ name, onClick, loading }) {
  return (
    <IconButton label={`Delete ${name}`} size="w-8 h-8" variant="dangerLight" onClick={onClick} disabled={loading}>
      <TrashIcon className="w-3.5 h-3.5" />
    </IconButton>
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
    else { setName(''); setInitialBalance(''); setRefreshKey(k => k + 1); invalidateTable('banks', userId) }
    setAdding(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    const { error } = await supabase.from('banks').delete().eq('id', id)
    if (error) setError(error.message)
    else { setRefreshKey(k => k + 1); invalidateTable('banks', userId) }
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <Card title="Add bank">
        <form onSubmit={handleAdd} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <FieldInput label="Bank name" value={name} onChange={setName} placeholder="e.g. BPI" />
          <FieldInput label="Initial balance (₱)" type="number" value={initialBalance} onChange={setInitialBalance} placeholder="0.00" min="0" step="0.01" />
          <Button type="submit" disabled={adding} icon={<PlusIcon />} className="h-11">{adding ? 'Adding...' : 'Add'}</Button>
        </form>
        <ErrorBanner message={error} />
      </Card>

      {loading ? <Loading className="py-16" /> : (
        <Card title="Your banks" subtitle="Balances start from the initial balance you set here">
          {banks.length === 0 ? <EmptyState title="No banks added yet" body="Add the banks and e-wallets you pay from." />
            : (
              <ul className="divide-y divide-line">
                {banks.map(bank => (
                  <li key={bank.id} className="flex items-center gap-3 py-2.5">
                    <BankAvatar name={bank.name} size="sm" />
                    <span className="text-sm font-semibold flex-1 min-w-0 truncate">{bank.name}</span>
                    <span className="text-sm text-muted tnum">{fmtMoney(bank.initial_balance)}</span>
                    <DeleteButton name={bank.name} onClick={() => handleDelete(bank.id)} loading={deleting === bank.id} />
                  </li>
                ))}
              </ul>
            )}
        </Card>
      )}
    </div>
  )
}

// Credit cards and categories share the same name-only list
function NameListTab({ userId, table, singular, plural, placeholder, emptyBody }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase.from(table).select('*').eq('user_id', userId).order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setRows(data)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId, table, refreshKey])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    setAdding(true)
    const { error } = await supabase.from(table).insert({ user_id: userId, name: name.trim() })
    if (error) setError(error.message)
    else { setName(''); setRefreshKey(k => k + 1); invalidateTable(table, userId) }
    setAdding(false)
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) setError(error.message)
    else { setRefreshKey(k => k + 1); invalidateTable(table, userId) }
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <Card title={`Add ${singular}`}>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <FieldInput label={`${singular.charAt(0).toUpperCase()}${singular.slice(1)} name`} value={name} onChange={setName} placeholder={placeholder} />
          <Button type="submit" disabled={adding} icon={<PlusIcon />} className="h-11">{adding ? 'Adding...' : 'Add'}</Button>
        </form>
        <ErrorBanner message={error} />
      </Card>

      {loading ? <Loading className="py-16" /> : (
        <Card title={`Your ${plural}`}>
          {rows.length === 0 ? <EmptyState title={`No ${plural} added yet`} body={emptyBody} />
            : (
              <ul className="divide-y divide-line">
                {rows.map(row => (
                  <li key={row.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-sm font-semibold flex-1 min-w-0 truncate">{row.name}</span>
                    <DeleteButton name={row.name} onClick={() => handleDelete(row.id)} loading={deleting === row.id} />
                  </li>
                ))}
              </ul>
            )}
        </Card>
      )}
    </div>
  )
}

export default function Settings() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('Banks')

  if (loading || !user) return null

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your banks, credit cards, and categories." />
      <div className="mb-4">
        <TabBar active={activeTab} onChange={setActiveTab} />
      </div>
      {activeTab === 'Banks' && <BanksTab userId={user.id} />}
      {activeTab === 'Credit Cards' && (
        <NameListTab key="credit_cards" userId={user.id} table="credit_cards" singular="credit card" plural="credit cards"
          placeholder="e.g. BPI Amore" emptyBody="Add a card to track charges you haven't paid off yet." />
      )}
      {activeTab === 'Categories' && (
        <NameListTab key="categories" userId={user.id} table="categories" singular="category" plural="categories"
          placeholder="e.g. Food" emptyBody="Categories group your spending on the dashboard." />
      )}
    </div>
  )
}
