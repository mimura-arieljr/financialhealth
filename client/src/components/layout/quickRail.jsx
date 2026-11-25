import { useState } from 'react'
import { useQuickAdd } from '../../hooks/useQuickAdd'
import { IconButton } from '../ui/button'
import { PlusIcon, BagIcon, BanknotesIcon, TransferIcon, LogoutIcon } from '../ui/icons'

const ACTIONS = [
  { kind: 'expense', label: 'Add expense', Icon: BagIcon },
  { kind: 'revenue', label: 'Add revenue', Icon: BanknotesIcon },
  { kind: 'transfer', label: 'New transfer', Icon: TransferIcon },
]

// Name shown beside a rail button on hover or keyboard focus
function RailLabel({ children }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute z-10 left-full top-1/2 -translate-y-1/2 ml-3 bg-ink text-white text-xs font-semibold rounded-full px-2.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
      {children}
    </span>
  )
}

// Desktop quick actions down the left edge: Add opens the three add options
export function QuickRail({ onSignOut }) {
  const { openQuickAdd } = useQuickAdd()
  const [open, setOpen] = useState(false)
  const add = (kind) => { setOpen(false); openQuickAdd(kind) }

  return (
    <aside aria-label="Quick actions" onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
      className="hidden lg:flex flex-col items-center gap-2 bg-card rounded-full py-2.5 w-14 self-start sticky top-6 shrink-0 z-30">
      <span className="group relative">
        <IconButton label={open ? 'Close add options' : 'Add'} variant="cyan" size="w-10 h-10" title={undefined}
          aria-expanded={open} aria-controls="rail-add-options" onClick={() => setOpen(o => !o)}>
          <PlusIcon className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
        </IconButton>
        {!open && <RailLabel>Add</RailLabel>}
      </span>
      {open && (
        <div id="rail-add-options" className="flex flex-col items-center gap-2">
          {ACTIONS.map((action, i) => {
            const Icon = action.Icon
            return (
              <span key={action.kind} className="group relative motion-rail-in" style={{ animationDelay: `${i * 80}ms` }}>
                <IconButton label={action.label} title={undefined} size="w-10 h-10" onClick={() => add(action.kind)}><Icon className="w-[18px] h-[18px]" /></IconButton>
                <RailLabel>{action.label}</RailLabel>
              </span>
            )
          })}
        </div>
      )}
      <span className="w-6 h-px bg-line my-1" />
      <span className="group relative">
        <IconButton label="Sign out" title={undefined} size="w-10 h-10" onClick={onSignOut}><LogoutIcon className="w-[18px] h-[18px]" /></IconButton>
        <RailLabel>Sign out</RailLabel>
      </span>
    </aside>
  )
}
