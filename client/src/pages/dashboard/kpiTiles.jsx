import { cardDebt, compareMonth, sumInMonth } from '../../lib/finance'
import { fmtPeso, monthKey, monthShort, shiftMonth } from '../../lib/utils'
import { StatTile } from '../../components/ui/statTile'
import { DeltaPill } from '../../components/ui/pill'
import { SpendIcon, IncomeIcon, NetIcon, CardIcon } from '../../components/ui/icons'

const ICON = 'w-3.5 h-3.5'

export function KpiTiles({ data, now }) {
  const current = monthKey(now)
  const vs = `vs ${monthShort(shiftMonth(current, -1))}`
  const spent = sumInMonth(data.expenses, current)
  const earned = sumInMonth(data.revenues, current)
  const net = earned - spent
  const debt = cardDebt(data.expenses)

  return (
    <div className="grid grid-cols-2 auto-rows-fr gap-2.5">
      <StatTile hero label="Spent this month" icon={<SpendIcon className={ICON} />} value={fmtPeso(spent)}
        footer={<DeltaPill pct={compareMonth(data.expenses, current, now).pct} goodWhen="down" suffix={vs} onDark />} />
      <StatTile label="Earned this month" icon={<IncomeIcon className={ICON} />} value={fmtPeso(earned)}
        footer={<DeltaPill pct={compareMonth(data.revenues, current, now).pct} goodWhen="up" suffix={vs} />} />
      <StatTile label="Net this month" icon={<NetIcon className={ICON} />}
        value={fmtPeso(net, { sign: true })} valueClassName={net < 0 ? 'text-alert' : 'text-good'}
        footer={net < 0 ? 'Deficit' : 'Surplus'} />
      <StatTile label="Card debt" icon={<CardIcon className={ICON} />} value={fmtPeso(debt.total)}
        footer={debt.cardCount ? `Across ${debt.cardCount} ${debt.cardCount === 1 ? 'card' : 'cards'}` : 'No unpaid charges'} />
    </div>
  )
}
