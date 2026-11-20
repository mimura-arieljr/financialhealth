import { useQuickAdd } from '../../hooks/useQuickAdd'
import { IconButton } from '../ui/button'
import { PlusIcon, IncomeIcon, TransferIcon, LogoutIcon } from '../ui/icons'

// Desktop quick actions down the left edge
export function QuickRail({ onSignOut }) {
  const { openQuickAdd } = useQuickAdd()
  return (
    <aside aria-label="Quick actions" className="hidden lg:flex flex-col items-center gap-2 bg-card rounded-full py-2.5 w-14 self-start sticky top-6 shrink-0">
      <IconButton label="Add expense" variant="cyan" size="w-10 h-10" onClick={() => openQuickAdd('expense')}><PlusIcon className="w-5 h-5" /></IconButton>
      <IconButton label="Add revenue" size="w-10 h-10" onClick={() => openQuickAdd('revenue')}><IncomeIcon className="w-[18px] h-[18px]" /></IconButton>
      <IconButton label="New transfer" size="w-10 h-10" onClick={() => openQuickAdd('transfer')}><TransferIcon className="w-[18px] h-[18px]" /></IconButton>
      <span className="w-6 h-px bg-line my-1" />
      <IconButton label="Sign out" size="w-10 h-10" onClick={onSignOut}><LogoutIcon className="w-[18px] h-[18px]" /></IconButton>
    </aside>
  )
}
