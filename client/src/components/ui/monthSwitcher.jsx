import { useState } from 'react'
import { monthKey, monthLabel, shiftMonth } from '../../lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'
import { Menu, MenuItem } from './menu'

const ARROW = 'w-8 h-8 grid place-items-center rounded-full hover:bg-sub disabled:opacity-30 disabled:hover:bg-transparent'

// ‹ November 2026 ›; '' means All months
export function MonthSwitcher({ value, onChange, options, allowAll = true }) {
  const [anchor, setAnchor] = useState(null)
  const current = monthKey(new Date())
  const pick = (key) => { onChange(key); setAnchor(null) }

  return (
    <div className="inline-flex items-center bg-card rounded-full h-10 px-1 shrink-0">
      <button type="button" aria-label="Previous month" className={ARROW}
        onClick={() => onChange(value ? shiftMonth(value, -1) : current)}>
        <ChevronLeftIcon />
      </button>
      <button type="button" aria-haspopup="menu" aria-expanded={!!anchor}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget.getBoundingClientRect())}
        className="px-2 text-sm font-semibold whitespace-nowrap min-w-[8.5rem] text-center">
        {value ? monthLabel(value) : 'All months'}
      </button>
      <button type="button" aria-label="Next month" className={ARROW}
        disabled={!value || value >= current}
        onClick={() => onChange(shiftMonth(value, 1))}>
        <ChevronRightIcon />
      </button>
      <Menu anchor={anchor} onClose={() => setAnchor(null)} align="right" width={200}>
        {allowAll && <MenuItem selected={value === ''} onClick={() => pick('')}>All months</MenuItem>}
        {options.map(k => <MenuItem key={k} selected={value === k} onClick={() => pick(k)}>{monthLabel(k)}</MenuItem>)}
      </Menu>
    </div>
  )
}
