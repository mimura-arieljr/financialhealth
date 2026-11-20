import { Link } from 'react-router-dom'
import { dueSoon, recurringStatus, daysUntil } from '../../lib/recurringStatus'
import { fmtDayMonth, fmtPeso } from '../../lib/utils'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/pill'
import { EmptyState } from '../../components/ui/emptyState'
import { ErrorBanner } from '../../components/ui/errorBanner'

function statusLine(s, now) {
  if (s.state === 'overdue') return { text: `Overdue · ${fmtDayMonth(s.dueDate)}`, cls: 'text-alert' }
  if (s.state === 'due-today') return { text: 'Due today', cls: 'text-alert' }
  const days = daysUntil(s.nextDue, now)
  return { text: days === 1 ? 'Tomorrow' : `In ${days} days`, cls: 'text-muted' }
}

export function DueSoonCard({ recurring, now, onPay, paying, error }) {
  const items = dueSoon(recurring, now)
  return (
    <Card title="Due soon" action={<Link to="/recurring" className="text-xs font-semibold text-cyan-ink hover:underline whitespace-nowrap">View recurring →</Link>}>
      {items.length === 0 ? (
        <EmptyState title="Nothing due this week" className="py-6" />
      ) : (
        <div className="grid sm:grid-cols-3 gap-2">
          {items.map(item => {
            const s = recurringStatus(item, now)
            const due = s.state === 'overdue' || s.state === 'due-today'
            const line = statusLine(s, now)
            return (
              <div key={item.id} className="bg-sub rounded-row p-3 flex sm:flex-col justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold ${line.cls}`}>{line.text}</p>
                  <p className="text-sm font-bold mt-1 truncate">{item.description} <span className="font-semibold text-muted tnum">· {fmtPeso(item.amount)}</span></p>
                </div>
                <div className="shrink-0 self-center sm:self-start">
                  {due
                    ? <Button size="sm" variant="cyan" disabled={paying === item.id} onClick={() => onPay(item)}>{paying === item.id ? 'Paying...' : 'Pay now'}</Button>
                    : <Badge>Upcoming</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <ErrorBanner message={error} />
    </Card>
  )
}
