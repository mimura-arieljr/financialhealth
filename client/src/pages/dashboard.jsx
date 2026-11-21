import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchCached } from '../lib/cache'
import { useAuth } from '../hooks/useAuth'
import { useQuickAdd } from '../hooks/useQuickAdd'
import { logRecurringExpense } from '../lib/recurring'
import { compareMonth, sumInMonth } from '../lib/finance'
import { dashboardHeadline } from '../lib/headlines'
import { fmtPeso, isDue, monthKey, monthName } from '../lib/utils'
import { PageHeader } from '../components/ui/pageHeader'
import { Chip } from '../components/ui/pill'
import { Loading } from '../components/ui/spinner'
import { BalanceCard } from './dashboard/balanceCard'
import { KpiTiles } from './dashboard/kpiTiles'
import { MoneyTrend } from './dashboard/moneyTrend'
import { WhereItWent } from './dashboard/whereItWent'
import { MarkedCard } from './dashboard/markedCard'
import { DueSoonCard } from './dashboard/dueSoonCard'
import { RecentActivity } from './dashboard/recentActivity'


export default function Dashboard() {
  const { user } = useAuth()
  const userId = user?.id
  const { openQuickAdd, dataVersion, notifySaved } = useQuickAdd()
  const [data, setData] = useState(null)
  const [paying, setPaying] = useState(null)
  const [payError, setPayError] = useState('')
  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([
      fetchCached('banks', userId, 'id, name, initial_balance'),
      supabase.from('expenses').select('id, description, amount, date, created_at, bank_id, credit_card_id, is_card_settled, category_id, is_marked').eq('user_id', userId),
      supabase.from('revenues').select('id, description, amount, date, created_at, bank_id').eq('user_id', userId),
      supabase.from('transfers').select('id, amount, date, note, created_at, from_bank_id, to_bank_id').eq('user_id', userId),
      fetchCached('credit_cards', userId, 'id, name'),
      fetchCached('categories', userId, 'id, name'),
      supabase.from('recurring_expenses').select('id, description, amount, frequency, day_of_month, day_of_week, last_logged, category_id, bank_id, credit_card_id').eq('user_id', userId).eq('is_active', true),
    ]).then(([banks, expenses, revenues, transfers, creditCards, categories, recurring]) => {
      if (cancelled) return
      setData({
        banks: banks.data || [],
        expenses: expenses.data || [],
        revenues: revenues.data || [],
        transfers: transfers.data || [],
        creditCards: creditCards.data || [],
        categories: categories.data || [],
        recurring: recurring.data || [],
      })
    })
    return () => { cancelled = true }
  }, [userId, dataVersion])

  const handlePay = async (item) => {
    setPaying(item.id)
    setPayError('')
    const error = await logRecurringExpense(userId, item)
    setPaying(null)
    if (error) setPayError(error)
    else notifySaved()
  }

  if (!data) return <Loading />

  const current = monthKey(now)
  const spent = sumInMonth(data.expenses, current)
  const net = sumInMonth(data.revenues, current) - spent
  const billsDue = data.recurring.filter(i => isDue(i, now)).length

  return (
    <div className="motion-stagger">
      <PageHeader
        title={`${monthName(current)} so far`}
        headline={dashboardHeadline({ spent, comparison: compareMonth(data.expenses, current, now) })}
        chips={<>
          {billsDue > 0 && <Chip dot="alert" to="/recurring">{billsDue} {billsDue === 1 ? 'bill' : 'bills'} due</Chip>}
          <Chip dot={net < 0 ? 'alert' : 'good'} to="/analytics">Net {fmtPeso(net, { sign: true })}</Chip>
        </>}
      />

      <div className="grid lg:grid-cols-[1.05fr_1fr_1.1fr] gap-4 motion-stagger">
        <BalanceCard data={data} now={now} onAddExpense={() => openQuickAdd('expense')} onTransfer={() => openQuickAdd('transfer')} />
        <KpiTiles data={data} now={now} />
        <MoneyTrend data={data} now={now} />
      </div>

      <div className="grid lg:grid-cols-[1.05fr_2.1fr] gap-4 mt-4">
        <div className="space-y-4 order-2 lg:order-1 min-w-0 motion-stagger lg:flex lg:flex-col lg:[&>*:last-child]:flex-1">
          <WhereItWent expenses={data.expenses} categories={data.categories} now={now} />
          <MarkedCard expenses={data.expenses} now={now} />
        </div>
        <div className="space-y-4 order-1 lg:order-2 min-w-0 motion-stagger lg:flex lg:flex-col lg:[&>*:last-child]:flex-1">
          <DueSoonCard recurring={data.recurring} now={now} onPay={handlePay} paying={paying} error={payError} />
          <RecentActivity data={data} />
        </div>
      </div>
    </div>
  )
}
