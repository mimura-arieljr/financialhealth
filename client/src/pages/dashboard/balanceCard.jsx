import { Link } from 'react-router-dom'
import { computeBankBalances, bankMonthFlow } from '../../lib/finance'
import { fmtMoney, fmtPeso, lastMonthEnd, monthKey, monthName, pctChange, shiftMonth } from '../../lib/utils'
import { Card, Panel } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { DeltaPill } from '../../components/ui/pill'
import { BankAvatar } from '../../components/ui/avatar'
import { EmptyState } from '../../components/ui/emptyState'
import { PlusIcon, TransferIcon } from '../../components/ui/icons'

function flowLine(flow) {
  if (Math.round(flow) > 0) return `↑ ${fmtPeso(flow)} in`
  if (Math.round(flow) < 0) return `↓ ${fmtPeso(Math.abs(flow))} out`
  return 'no change'
}

export function BalanceCard({ data, now, onAddExpense, onTransfer }) {
  const current = monthKey(now)
  const balances = computeBankBalances(data)
  const total = balances.reduce((s, b) => s + b.balance, 0)
  const before = computeBankBalances(data, lastMonthEnd(now)).reduce((s, b) => s + b.balance, 0)

  return (
    <Card className="flex flex-col">
      <p className="text-sm font-medium text-muted">Total balance</p>
      <p className="text-[30px] font-bold tracking-[-0.03em] tnum mt-1 leading-tight">{fmtMoney(total)}</p>
      <DeltaPill pct={pctChange(total, before, 1)} goodWhen="up" suffix={`vs end of ${monthName(shiftMonth(current, -1))}`} className="text-muted mt-1.5" />
      <div className="flex gap-2 mt-4">
        <Button size="sm" icon={<PlusIcon className="w-4 h-4" />} onClick={onAddExpense}>Add expense</Button>
        <Button size="sm" variant="light" icon={<TransferIcon className="w-4 h-4" />} onClick={onTransfer}>Transfer</Button>
      </div>
      <Panel className="mt-4 flex-1">
        <div className="flex items-center gap-2 text-xs font-semibold px-1">
          Banks <span className="text-faint font-medium">{balances.length} {balances.length === 1 ? 'account' : 'accounts'}</span>
        </div>
        {balances.length === 0 ? (
          <EmptyState title="No banks yet" body="Add a bank to see balances here."
            action={<Link to="/settings" className="text-xs font-semibold text-cyan-ink hover:underline">Add a bank in Settings</Link>}
            className="py-6" />
        ) : (
          <div className="flex gap-2 mt-2 overflow-x-auto snap-x pb-0.5">
            {balances.map(b => (
              <div key={b.id} className="bg-card rounded-[12px] p-2.5 min-w-[calc((100%-16px)/3)] shrink-0 snap-start">
                <div className="flex items-center gap-1.5 text-xs font-semibold min-w-0">
                  <BankAvatar name={b.name} /><span className="truncate">{b.name}</span>
                </div>
                <p className="text-sm font-bold tnum mt-1.5">{fmtPeso(b.balance)}</p>
                <p className="text-[11px] text-faint tnum">{flowLine(bankMonthFlow(b.id, data, current))}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </Card>
  )
}
