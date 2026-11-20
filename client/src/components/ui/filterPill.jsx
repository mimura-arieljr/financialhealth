import { useState } from 'react'
import { ChevronDownIcon, CloseIcon } from './icons'
import { Menu, MenuItem } from './menu'

// Dropdown filter; active state is an ink pill with a clear button
export function FilterPill({ label, value, options, onChange }) {
  const [anchor, setAnchor] = useState(null)
  const active = options.find(o => o.value === value)
  const toggle = (e) => setAnchor(anchor ? null : e.currentTarget.getBoundingClientRect())
  const pick = (v) => { onChange(v); setAnchor(null) }

  return (
    <>
      {active ? (
        <span className="inline-flex items-center h-8 rounded-full bg-ink text-white text-xs font-semibold pl-3 pr-1 gap-1 whitespace-nowrap shrink-0">
          <button type="button" onClick={toggle} aria-haspopup="menu" className="max-w-[10rem] truncate">{active.label}</button>
          <button type="button" aria-label={`Clear ${label} filter`} onClick={() => onChange('')}
            className="w-6 h-6 rounded-full grid place-items-center hover:bg-white/15">
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </span>
      ) : (
        <button type="button" onClick={toggle} aria-haspopup="menu"
          className="inline-flex items-center h-8 rounded-full bg-sub hover:bg-line text-xs font-semibold px-3 gap-1.5 whitespace-nowrap shrink-0">
          {label}<ChevronDownIcon className="w-3.5 h-3.5 text-muted" />
        </button>
      )}
      <Menu anchor={anchor} onClose={() => setAnchor(null)}>
        {options.map(o => <MenuItem key={o.value} selected={o.value === value} onClick={() => pick(o.value)}>{o.label}</MenuItem>)}
      </Menu>
    </>
  )
}
