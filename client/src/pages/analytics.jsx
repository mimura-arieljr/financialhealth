import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend
} from 'recharts'

const fmt = (n) => Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })
const fmtShort = (n) => {
  const num = Number(n)
  if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `₱${(num / 1_000).toFixed(1)}K`
  return `₱${Math.round(num)}`
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#a855f7', '#e11d48', '#0ea5e9'
]

function SectionCard({ title, subtitle, children, loading }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-white">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center text-neutral-600 text-sm">Loading...</div>
      ) : children}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-neutral-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value < 0 ? '-' : ''}₱{fmt(Math.abs(p.value))}
        </p>
      ))}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getLast12Months() {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString('en-PH', { month: 'short', year: '2-digit' })
    }
  })
}

function getCurrentYear() {
  return new Date().getFullYear()
}

function getMonthsOfYear(year) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1)
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString('en-PH', { month: 'short' })
    }
  })
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Analytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const [expenses, setExpenses] = useState([])
  const [revenues, setRevenues] = useState([])
  const [banks, setBanks] = useState([])

  useEffect(() => {
    if (!user?.id) return
    const fetchAll = async () => {
      setLoading(true)
      const [expRes, revRes, bankRes] = await Promise.all([
        supabase.from('expenses').select('id, amount, date, category_id, bank_id, credit_card_id, is_card_settled').eq('user_id', user.id),
        supabase.from('revenues').select('id, amount, date, bank_id').eq('user_id', user.id),
        supabase.from('banks').select('id, name, initial_balance').eq('user_id', user.id),
      ])
      if (!expRes.error) setExpenses(expRes.data)
      if (!revRes.error) setRevenues(revRes.data)
      if (!bankRes.error) setBanks(bankRes.data)
      setLoading(false)
    }
    fetchAll()
  }, [user?.id])

  // ── 1. Savings Rate % (current month) ─────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthRevenue = revenues
    .filter(r => r.date?.slice(0, 7) === currentMonth)
    .reduce((s, r) => s + Number(r.amount), 0)
  const monthExpenses = expenses
    .filter(e => e.date?.slice(0, 7) === currentMonth)
    .reduce((s, e) => s + Number(e.amount), 0)
  const savingsRate = monthRevenue > 0
    ? Math.round(((monthRevenue - monthExpenses) / monthRevenue) * 100)
    : null
  const savingsRateColor = savingsRate === null ? 'text-neutral-500'
    : savingsRate >= 20 ? 'text-emerald-400'
    : savingsRate >= 0 ? 'text-yellow-400'
    : 'text-red-400'
  const savingsRateLabel = savingsRate === null ? 'No income data this month'
    : savingsRate >= 20 ? 'Healthy — above 20%'
    : savingsRate >= 0 ? 'Below recommended 20%'
    : 'Spending exceeds income'

  // ── 2. Monthly Net Worth Trend (last 12 months) ────────────────────────
  const last12 = getLast12Months()
  const netWorthData = last12.map(({ key, label }) => {
    // Sum all revenues up to end of this month
    const totalRev = revenues
      .filter(r => r.date?.slice(0, 7) <= key)
      .reduce((s, r) => s + Number(r.amount), 0)
    // Sum all settled expenses up to end of this month
    const totalExp = expenses
      .filter(e => e.date?.slice(0, 7) <= key && (e.credit_card_id === null || e.is_card_settled === true))
      .reduce((s, e) => s + Number(e.amount), 0)
    const initialTotal = banks.reduce((s, b) => s + Number(b.initial_balance), 0)
    return { month: label, 'Net Worth': initialTotal + totalRev - totalExp }
  })

  // ── 3. Projected Year-End Savings ─────────────────────────────────────
  const year = getCurrentYear()
  const yearMonths = getMonthsOfYear(year)
  const nowMonthIdx = new Date().getMonth() // 0-based

  // Compute actual net per month this year
  const actualNets = yearMonths.map(({ key }) => {
    const rev = revenues.filter(r => r.date?.slice(0, 7) === key).reduce((s, r) => s + Number(r.amount), 0)
    const exp = expenses.filter(e => e.date?.slice(0, 7) === key).reduce((s, e) => s + Number(e.amount), 0)
    return rev - exp
  })

  // Average net of past months (up to but not including current)
  const pastNets = actualNets.slice(0, nowMonthIdx).filter((_, i) => {
    const rev = revenues.filter(r => r.date?.slice(0, 7) === yearMonths[i].key).reduce((s, r) => s + Number(r.amount), 0)
    return rev > 0 // only months with income
  })
  const avgMonthlyNet = pastNets.length > 0
    ? pastNets.reduce((s, n) => s + n, 0) / pastNets.length
    : null

  const projectionData = yearMonths.map(({ label }, i) => {
    const isActual = i <= nowMonthIdx
    const actual = isActual ? actualNets[i] : null
    const projected = !isActual && avgMonthlyNet !== null ? avgMonthlyNet : null
    return { month: label, Actual: actual, Projected: projected }
  })

  const projectedYearEnd = avgMonthlyNet !== null
    ? actualNets.slice(0, nowMonthIdx + 1).reduce((s, n) => s + n, 0) +
      avgMonthlyNet * (11 - nowMonthIdx)
    : null

  // ── 4. Income Consistency (last 12 months) ────────────────────────────
  const avgMonthlyRevenue = last12.reduce((s, { key }) => {
    return s + revenues.filter(r => r.date?.slice(0, 7) === key).reduce((ss, r) => ss + Number(r.amount), 0)
  }, 0) / 12

  const incomeData = last12.map(({ key, label }) => ({
    month: label,
    Revenue: revenues.filter(r => r.date?.slice(0, 7) === key).reduce((s, r) => s + Number(r.amount), 0)
  }))

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-neutral-500 text-sm mt-1">Financial insights from your data.</p>
      </div>

      {/* Row 1 — Savings Rate + Projected Year-End */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Savings Rate */}
        <SectionCard
          title="Savings Rate"
          subtitle="Current month — income minus expenses"
          loading={loading}
        >
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <p className={`text-6xl font-bold font-mono ${savingsRateColor}`}>
              {savingsRate !== null ? `${savingsRate}%` : '—'}
            </p>
            <p className="text-sm text-neutral-400">{savingsRateLabel}</p>
            {savingsRate !== null && (
              <div className="w-full mt-4">
                <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                  <span>₱{fmt(monthRevenue)} income</span>
                  <span>₱{fmt(monthExpenses)} spent</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 0 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(100, Math.max(0, (monthExpenses / monthRevenue) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-600 mt-1.5 text-center">Target: 20% savings rate</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Projected Year-End */}
        <SectionCard
          title="Projected Year-End Savings"
          subtitle={`${year} — based on avg of past months`}
          loading={loading}
        >
          {projectedYearEnd === null ? (
            <div className="flex items-center justify-center h-48 text-neutral-600 text-sm">
              Not enough data yet — need at least 1 month of history.
            </div>
          ) : (
            <>
              <div className="text-center py-3 mb-4">
                <p className={`text-4xl font-bold font-mono ${projectedYearEnd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {projectedYearEnd >= 0 ? '' : '-'}₱{fmtShort(Math.abs(projectedYearEnd)).replace('₱', '')}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Avg monthly net: {avgMonthlyNet >= 0 ? '+' : ''}₱{fmt(avgMonthlyNet)}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={projectionData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmtShort(v)} tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="#404040" />
                  <Bar dataKey="Actual" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="Projected" fill="#10b98150" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-neutral-600 mt-2 text-center">Solid = actual · Faded = projected</p>
            </>
          )}
        </SectionCard>
      </div>

      {/* Row 2 — Net Worth Trend */}
      <SectionCard
        title="Net Worth Trend"
        subtitle="Last 12 months — total bank balance over time"
        loading={loading}
      >
        {netWorthData.every(d => d['Net Worth'] === netWorthData[0]['Net Worth']) ? (
          <div className="flex items-center justify-center h-48 text-neutral-600 text-sm">
            Not enough transaction history yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={netWorthData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmtShort(v)} tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="Net Worth" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Row 3 — Income Consistency */}
      <SectionCard
        title="Income Consistency"
        subtitle="Last 12 months — monthly revenue"
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={incomeData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => fmtShort(v)} tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={avgMonthlyRevenue} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Avg', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
            <Bar dataKey="Revenue" radius={[3, 3, 0, 0]} maxBarSize={32}>
              {incomeData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.Revenue >= avgMonthlyRevenue ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-neutral-600 mt-1 text-center">
          Green = at or above average · Red = below average · Dashed line = 12-month average
        </p>
      </SectionCard>
    </div>
  )
}