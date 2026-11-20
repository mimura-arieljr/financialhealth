import { monthKey, monthShort, shiftMonth } from '../../lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

const ARROW = 'w-7 h-7 grid place-items-center rounded-full hover:bg-sub disabled:opacity-30 disabled:hover:bg-transparent'

// Compact ‹ Nov 2026 › for a single card
export function MonthArrows({ value, onChange }) {
  const atCurrent = value >= monthKey(new Date())
  return (
    <div className="inline-flex items-center gap-0.5 text-xs font-semibold shrink-0">
      <button type="button" aria-label="Previous month" className={ARROW} onClick={() => onChange(shiftMonth(value, -1))}>
        <ChevronLeftIcon className="w-3.5 h-3.5" />
      </button>
      <span className="tnum whitespace-nowrap">{monthShort(value)} {value.slice(0, 4)}</span>
      <button type="button" aria-label="Next month" className={ARROW} disabled={atCurrent} onClick={() => onChange(shiftMonth(value, 1))}>
        <ChevronRightIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
