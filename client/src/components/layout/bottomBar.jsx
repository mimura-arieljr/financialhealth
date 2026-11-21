import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useQuickAdd } from '../../hooks/useQuickAdd'
import { HomeIcon, ListIcon, PlusIcon, RepeatIcon, MoreIcon, IncomeIcon, TransferIcon, ChartIcon, SparkleIcon, GearIcon, LogoutIcon } from '../ui/icons'
import { Sheet, SheetItem } from './sheet'

const MORE_PATHS = ['/revenues', '/transfers', '/analytics', '/ai', '/settings']
const tabCls = (active) => `flex flex-col items-center gap-0.5 w-14 py-1 text-[10px] font-medium transition-colors ${active ? 'text-cyan' : 'text-faint'}`

function Tab({ to, end, icon, label }) {
  const Icon = icon
  return (
    <NavLink to={to} end={end} className={({ isActive }) => tabCls(isActive)}>
      <Icon className="w-5 h-5" />{label}
    </NavLink>
  )
}

// Mobile floating bar with + and More sheets
export function BottomBar({ onSignOut }) {
  const { openQuickAdd } = useQuickAdd()
  const { pathname } = useLocation()
  // Remember which page a sheet was opened on, so navigating closes it
  const [sheet, setSheet] = useState(null)
  const open = sheet?.path === pathname ? sheet.type : null
  const close = () => setSheet(null)
  const add = (kind) => { close(); openQuickAdd(kind) }

  return (
    <>
      <nav aria-label="Main" className="lg:hidden fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 bg-ink rounded-full flex items-center justify-around px-2 py-1.5 shadow-[0_10px_30px_rgba(14,17,22,0.25)]">
        <Tab to="/" end icon={HomeIcon} label="Home" />
        <Tab to="/expenses" icon={ListIcon} label="Expenses" />
        <button type="button" aria-label="Add" onClick={() => setSheet({ type: 'add', path: pathname })}
          aria-expanded={open === 'add'} className="w-12 h-12 rounded-full bg-cyan text-ink grid place-items-center active:scale-95 transition-transform">
          <PlusIcon className={`w-6 h-6 transition-transform duration-200 ${open === 'add' ? 'rotate-45' : ''}`} />
        </button>
        <Tab to="/recurring" icon={RepeatIcon} label="Recurring" />
        <button type="button" onClick={() => setSheet({ type: 'more', path: pathname })} className={tabCls(MORE_PATHS.includes(pathname))}>
          <MoreIcon className="w-5 h-5" />More
        </button>
      </nav>

      {open === 'add' && (
        <Sheet title="Add" onClose={close}>
          <SheetItem icon={PlusIcon} label="Expense" onClick={() => add('expense')} />
          <SheetItem icon={IncomeIcon} label="Revenue" onClick={() => add('revenue')} />
          <SheetItem icon={TransferIcon} label="Transfer" onClick={() => add('transfer')} />
        </Sheet>
      )}
      {open === 'more' && (
        <Sheet title="More" onClose={close}>
          <SheetItem icon={IncomeIcon} label="Revenues" to="/revenues" onClick={close} />
          <SheetItem icon={TransferIcon} label="Transfers" to="/transfers" onClick={close} />
          <SheetItem icon={ChartIcon} label="Analytics" to="/analytics" onClick={close} />
          <SheetItem icon={SparkleIcon} label="AI Chat" to="/ai" onClick={close} />
          <SheetItem icon={GearIcon} label="Settings" to="/settings" onClick={close} />
          <SheetItem icon={LogoutIcon} label="Sign out" onClick={() => { close(); onSignOut() }} />
        </Sheet>
      )}
    </>
  )
}
