import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })
const fmtShort = (n) => {
  const num = Number(n)
  if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `₱${(num / 1_000).toFixed(1)}K`
  return `₱${num.toFixed(0)}`
}

const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#a855f7', '#e11d48', '#0ea5e9'
]

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, valueColor = 'text-white', loading }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{label}</p>
      {loading ? (
        <div className="h-7 w-32 bg-neutral-800 rounded animate-pulse" />
      ) : (
        <p className={`text-2xl font-semibold font-mono ${valueColor}`}>{value}</p>
      )}
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  )
}

// ── Bank Balance Card ──────────────────────────────────────────────────────
function BankCard({ bank, loading }) {
  const balance = Number(bank.current_balance)
  const isNegative = balance < 0
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
          {bank.name.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm text-white">{bank.name}</span>
      </div>
      {loading ? (
        <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse" />
      ) : (
        <span className={`text-sm font-mono font-medium ${isNegative ? 'text-red-400' : 'text-white'}`}>
          ₱{fmt(balance)}
        </span>
      )}
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-neutral-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: ₱{Number(p.value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-medium">{payload[0].name}</p>
      <p className="text-neutral-300 font-mono mt-0.5">₱{fmt(payload[0].value)}</p>
      <p className="text-neutral-500">{payload[0].payload.percent}%</p>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  // Data
  const [bankBalances, setBankBalances] = useState([])
  const [ccBalances, setCcBalances] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [totals, setTotals] = useState({ totalBalance: 0, totalDebt: 0, monthExpenses: 0, monthRevenue: 0 })

  useEffect(() => {
    if (!user?.id) return
    const fetchAll = async () => {
      const [banksRes, expensesRes, revenuesRes, ccsRes, categoriesRes, transfersRes] = await Promise.all([
        supabase.from('banks').select('id, name, initial_balance').eq('user_id', user.id),
        supabase.from('expenses').select('amount, date, bank_id, credit_card_id, is_card_settled, category_id').eq('user_id', user.id),
        supabase.from('revenues').select('amount, date, bank_id').eq('user_id', user.id),
        supabase.from('credit_cards').select('id, name').eq('user_id', user.id),
        supabase.from('categories').select('id, name').eq('user_id', user.id),
        supabase.from('transfers').select('amount, date, from_bank_id, to_bank_id').eq('user_id', user.id),
      ])

      const banks = banksRes.data || []
      const expenses = expensesRes.data || []
      const revenues = revenuesRes.data || []
      const creditCards = ccsRes.data || []
      const categories = categoriesRes.data || []
      const transfers = transfersRes.data || []

      // ── Bank balances ──────────────────────────────────────────────────
      const bankMap = banks.map(bank => {
        const spent = expenses
          .filter(e => e.bank_id === bank.id && (e.credit_card_id === null || e.is_card_settled === true))
          .reduce((sum, e) => sum + Number(e.amount), 0)
        const income = revenues
          .filter(r => r.bank_id === bank.id)
          .reduce((sum, r) => sum + Number(r.amount), 0)
        const transfersOut = transfers
          .filter(t => t.from_bank_id === bank.id)
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const transfersIn = transfers
          .filter(t => t.to_bank_id === bank.id)
          .reduce((sum, t) => sum + Number(t.amount), 0)
        return {
          ...bank,
          current_balance: Number(bank.initial_balance) - spent + income - transfersOut + transfersIn
        }
      })
      setBankBalances(bankMap)

      // ── Credit card outstanding ────────────────────────────────────────
      const ccMap = creditCards.map(cc => {
        const outstanding = expenses
          .filter(e => e.credit_card_id === cc.id && e.is_card_settled === false)
          .reduce((sum, e) => sum + Number(e.amount), 0)
        return { ...cc, outstanding_debt: outstanding }
      }).filter(cc => cc.outstanding_debt > 0)
      setCcBalances(ccMap)

      // ── Monthly expenses vs revenue (last 6 months) ────────────────────
      const now = new Date()
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        return d.toISOString().slice(0, 7) // "YYYY-MM"
      })

      const monthly = months.map(month => {
        const label = new Date(month + '-01').toLocaleString('en-PH', { month: 'short', year: '2-digit' })
        const exp = expenses
          .filter(e => e.date?.slice(0, 7) === month)
          .reduce((sum, e) => sum + Number(e.amount), 0)
        const rev = revenues
          .filter(r => r.date?.slice(0, 7) === month)
          .reduce((sum, r) => sum + Number(r.amount), 0)
        return { month: label, Expenses: exp, Revenue: rev }
      })
      setMonthlyData(monthly)

      // ── Category breakdown (current month) ────────────────────────────
      const currentMonth = now.toISOString().slice(0, 7)
      const catTotals = categories.map(cat => {
        const total = expenses
          .filter(e => e.category_id === cat.id && e.date?.slice(0, 7) === currentMonth)
          .reduce((sum, e) => sum + Number(e.amount), 0)
        return { name: cat.name, value: total }
      }).filter(c => c.value > 0).sort((a, b) => b.value - a.value)

      const grandTotal = catTotals.reduce((sum, c) => sum + c.value, 0)
      const catWithPercent = catTotals.map(c => ({
        ...c,
        percent: grandTotal > 0 ? ((c.value / grandTotal) * 100).toFixed(1) : '0'
      }))
      setCategoryData(catWithPercent)

      // ── Summary totals ─────────────────────────────────────────────────
      const totalBalance = bankMap.reduce((sum, b) => sum + b.current_balance, 0)
      const totalDebt = expenses
        .filter(e => e.credit_card_id !== null && e.is_card_settled === false)
        .reduce((sum, e) => sum + Number(e.amount), 0)
      const monthExpenses = expenses
        .filter(e => e.date?.slice(0, 7) === currentMonth)
        .reduce((sum, e) => sum + Number(e.amount), 0)
      const monthRevenue = revenues
        .filter(r => r.date?.slice(0, 7) === currentMonth)
        .reduce((sum, r) => sum + Number(r.amount), 0)

      setTotals({ totalBalance, totalDebt, monthExpenses, monthRevenue })
      setLoading(false)
    }

    fetchAll()
  }, [user?.id])

  const currentMonthLabel = new Date().toLocaleString('en-PH', { month: 'long', year: 'numeric' })
  const netThisMonth = totals.monthRevenue - totals.monthExpenses

  if (authLoading || !user) return null

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">{currentMonthLabel}</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={`₱${fmtShort(totals.totalBalance).replace('₱', '')}`}
          sub="Across all banks"
          loading={loading}
          valueColor={totals.totalBalance >= 0 ? 'text-white' : 'text-red-400'}
        />
        <StatCard
          label="Card Debt"
          value={totals.totalDebt > 0 ? `-₱${fmtShort(totals.totalDebt).replace('₱', '')}` : '₱0'}
          sub="Unsettled card charges"
          loading={loading}
          valueColor={totals.totalDebt > 0 ? 'text-red-400' : 'text-white'}
        />
        <StatCard
          label="Spent This Month"
          value={fmtShort(totals.monthExpenses)}
          loading={loading}
          valueColor="text-white"
        />
        <StatCard
          label="Net This Month"
          value={`${netThisMonth >= 0 ? '+' : ''}${fmtShort(netThisMonth)}`}
          sub={netThisMonth >= 0 ? 'Surplus' : 'Deficit'}
          loading={loading}
          valueColor={netThisMonth >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend — takes 2/3 width */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Expenses vs Revenue — Last 6 Months</h2>
          {loading ? (
            <div className="h-52 flex items-center justify-center text-neutral-600 text-sm">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtShort(v)} tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#a3a3a3' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#gradRevenue)" dot={false} />
                <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gradExpenses)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category pie — 1/3 width */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Spending by Category</h2>
          <p className="text-xs text-neutral-500 -mt-2 mb-3">Current month</p>
          {loading ? (
            <div className="h-52 flex items-center justify-center text-neutral-600 text-sm">Loading...</div>
          ) : categoryData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-neutral-600 text-sm">No expenses this month</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" stroke="none">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="text-neutral-400 truncate">{cat.name}</span>
                    </div>
                    <span className="text-neutral-300 font-mono ml-2 shrink-0">{cat.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank balances */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Bank Balances</h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : bankBalances.length === 0 ? (
            <p className="text-neutral-600 text-sm text-center py-8">No banks configured.</p>
          ) : (
            <div className="space-y-2">
              {bankBalances.map(bank => (
                <BankCard key={bank.id} bank={bank} loading={loading} />
              ))}
            </div>
          )}
        </div>

        {/* Credit card debt */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-1">Outstanding Card Debt</h2>
          <p className="text-xs text-neutral-500 mb-4">Unsettled charges per card</p>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : ccBalances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-500 text-sm">All cards settled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ccBalances.map(cc => (
                <div key={cc.id} className="bg-neutral-800 rounded-xl px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400">
                      {cc.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-white">{cc.name}</span>
                  </div>
                  <span className="text-sm font-mono text-red-400">-₱{fmt(cc.outstanding_debt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}