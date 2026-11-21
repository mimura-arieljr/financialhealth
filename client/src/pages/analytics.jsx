import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchCached } from '../lib/cache'
import { useAuth } from '../hooks/useAuth'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { analyticsHeadline } from '../lib/headlines'
import { fmtPeso, fmtShort, getLast12Months, getCurrentYear, getMonthsOfYear, monthKey, monthName } from '../lib/utils'
import { Card } from '../components/ui/card'
import { Chip } from '../components/ui/pill'
import { PageHeader } from '../components/ui/pageHeader'
import { EmptyState } from '../components/ui/emptyState'
import { Loading } from '../components/ui/spinner'
import { Ring } from '../components/charts/ring'
import { AreaTrend } from '../components/charts/areaTrend'
import { BarSeries } from '../components/charts/barSeries'
import { ChartLegend } from '../components/charts/chartTooltip'

const INK = '#0E1116'
const CYAN = '#00E5F2'
const BELOW_AVG = '#E5E7EB'

const sumKey = (rows, key) => rows.filter(r => r.date?.slice(0, 7) === key).reduce((s, r) => s + Number(r.amount), 0)

export default function Analytics() {
  const { user } = useAuth()
  const userId = user?.id
  const { dataVersion } = useQuickAdd()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [revenues, setRevenues] = useState([])
  const [banks, setBanks] = useState([])

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('expenses').select('id, amount, date, category_id, bank_id, credit_card_id, is_card_settled').eq('user_id', userId),
      supabase.from('revenues').select('id, amount, date, bank_id').eq('user_id', userId),
      fetchCached('banks', userId, 'id, name, initial_balance'),
    ]).then(([expRes, revRes, bankRes]) => {
      if (!expRes.error) setExpenses(expRes.data)
      if (!revRes.error) setRevenues(revRes.data)
      if (!bankRes.error) setBanks(bankRes.data)
      setLoading(false)
    })
  }, [userId, dataVersion])

  // 1. Savings rate, current month (local time key)
  const currentMonth = monthKey(new Date())
  const monthRevenue = sumKey(revenues, currentMonth)
  const monthExpenses = sumKey(expenses, currentMonth)
  const savingsRate = monthRevenue > 0 ? Math.round(((monthRevenue - monthExpenses) / monthRevenue) * 100) : null
  const savingsLabel = savingsRate === null ? 'No income this month'
    : savingsRate >= 20 ? 'Healthy'
      : savingsRate >= 0 ? 'Below target'
        : 'Spending exceeds income'

  // 2. Net worth, last 12 months (same maths as before)
  const last12 = getLast12Months()
  const initialTotal = banks.reduce((s, b) => s + Number(b.initial_balance), 0)
  const netWorthData = last12.map(({ key, label }) => {
    const totalRev = revenues.filter(r => r.date?.slice(0, 7) <= key).reduce((s, r) => s + Number(r.amount), 0)
    const totalExp = expenses
      .filter(e => e.date?.slice(0, 7) <= key && (e.credit_card_id === null || e.is_card_settled === true))
      .reduce((s, e) => s + Number(e.amount), 0)
    return { month: label, 'Net Worth': initialTotal + totalRev - totalExp }
  })
  const netWorthFlat = netWorthData.every(d => d['Net Worth'] === netWorthData[0]['Net Worth'])
  const netWorthChange = netWorthData[netWorthData.length - 1]['Net Worth'] - netWorthData[0]['Net Worth']

  // 3. Projected year-end savings
  const year = getCurrentYear()
  const yearMonths = getMonthsOfYear(year)
  const nowMonthIdx = new Date().getMonth()
  const actualNets = yearMonths.map(({ key }) => sumKey(revenues, key) - sumKey(expenses, key))
  // Average net of past months that had income
  const pastNets = actualNets.slice(0, nowMonthIdx).filter((_, i) => sumKey(revenues, yearMonths[i].key) > 0)
  const avgMonthlyNet = pastNets.length > 0 ? pastNets.reduce((s, n) => s + n, 0) / pastNets.length : null
  const projectionData = yearMonths.map(({ label }, i) => ({
    month: label,
    Actual: i <= nowMonthIdx ? actualNets[i] : null,
    Projected: i > nowMonthIdx && avgMonthlyNet !== null ? avgMonthlyNet : null,
    isCurrent: i === nowMonthIdx,
  }))
  const projectedYearEnd = avgMonthlyNet !== null
    ? actualNets.slice(0, nowMonthIdx + 1).reduce((s, n) => s + n, 0) + avgMonthlyNet * (11 - nowMonthIdx)
    : null

  // 4. Income consistency, last 12 months
  const incomeData = last12.map(({ key, label }) => ({ month: label, Revenue: sumKey(revenues, key) }))
  const avgMonthlyRevenue = incomeData.reduce((s, d) => s + d.Revenue, 0) / 12

  if (loading) return <Loading />

  return (
    <div className="motion-stagger">
      <PageHeader
        title="Analytics"
        headline={analyticsHeadline({ savingsRate, monthName: monthName(currentMonth) })}
        chips={<>
          {projectedYearEnd !== null && <Chip dot={projectedYearEnd < 0 ? 'alert' : 'cyan'}>Projected year-end {fmtShort(projectedYearEnd)}</Chip>}
          {!netWorthFlat && <Chip dot={netWorthChange < 0 ? 'neutral' : 'good'}>Net worth {netWorthChange < 0 ? '↓' : '↑'} {fmtShort(Math.abs(netWorthChange))} in 12 months</Chip>}
        </>}
      />

      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-4 motion-stagger">
        <Card title="Savings rate" subtitle={monthName(currentMonth)}>
          {savingsRate === null ? (
            <EmptyState title="No income data this month" body="Log this month's income to see how much you're saving." />
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <Ring value={savingsRate} target={20}>
                <div>
                  <p className="text-[28px] font-bold tracking-tight tnum leading-none">{savingsRate}%</p>
                  <p className={`text-xs font-semibold mt-1 ${savingsRate < 0 ? 'text-alert' : savingsRate >= 20 ? 'text-good' : 'text-muted'}`}>{savingsLabel}</p>
                </div>
              </Ring>
              <div className="flex gap-4 text-xs">
                <span><span className="font-bold tnum">{fmtPeso(monthRevenue)}</span> <span className="text-muted">in</span></span>
                <span><span className="font-bold tnum">{fmtPeso(monthExpenses)}</span> <span className="text-muted">out</span></span>
              </div>
              <p className="text-[11px] text-faint">Black tick marks the 20% target</p>
            </div>
          )}
        </Card>

        <Card title="Projected year-end savings" subtitle={`${year}, based on your average month`}
          action={projectedYearEnd !== null && <ChartLegend items={[{ name: 'Actual', color: INK }, { name: 'This month', color: CYAN }, { name: 'Projected', className: 'hatch' }]} />}>
          {projectedYearEnd === null ? (
            <EmptyState title="Not enough data yet" body="You need at least one past month with income this year." />
          ) : (
            <>
              <p className={`text-[30px] font-bold tracking-[-0.03em] tnum leading-tight ${projectedYearEnd < 0 ? 'text-alert' : ''}`}>{fmtPeso(projectedYearEnd)}</p>
              <p className="text-xs text-muted mt-1">avg monthly net <span className="font-semibold text-ink tnum">{fmtPeso(avgMonthlyNet, { sign: true })}</span></p>
              <div className="mt-3">
                <BarSeries data={projectionData} xKey="month" stacked height={190}
                  bars={[{ key: 'Actual', name: 'Actual' }, { key: 'Projected', name: 'Projected' }]}
                  colorFor={(d, key) => key === 'Projected' ? 'hatch' : d.isCurrent ? CYAN : INK} />
              </div>
            </>
          )}
        </Card>
      </div>

      <Card title="Net worth" subtitle="Total bank balance, last 12 months" className="mt-4">
        {netWorthFlat
          ? <EmptyState title="Not enough transaction history yet" />
          : <AreaTrend data={netWorthData} xKey="month" height={240} endLabel
              series={[{ key: 'Net Worth', name: 'Net worth', stroke: '#06B6D4', fill: CYAN }]} />}
      </Card>

      <Card title="Income consistency" subtitle="Monthly revenue against your 12-month average" className="mt-4"
        action={avgMonthlyRevenue > 0 && <ChartLegend items={[{ name: 'At or above average', color: CYAN }, { name: 'Below average', color: BELOW_AVG }]} />}>
        {avgMonthlyRevenue === 0
          ? <EmptyState title="No income in the last 12 months" />
          : <BarSeries data={incomeData} xKey="month" height={220}
              bars={[{ key: 'Revenue', name: 'Revenue' }]}
              colorFor={(d) => d.Revenue >= avgMonthlyRevenue ? CYAN : BELOW_AVG}
              average={avgMonthlyRevenue} averageLabel={`avg ${fmtShort(avgMonthlyRevenue)}`} />}
      </Card>
    </div>
  )
}
