import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { QuickAddProvider } from './quickAdd'
import { ConfirmProvider } from '../ui/confirmDialog'
import { ShellSlotProvider } from './shellSlot'
import { TopBar } from './topBar'
import { QuickRail } from './quickRail'
import { BottomBar } from './bottomBar'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <ShellSlotProvider>
      <ConfirmProvider>
      <QuickAddProvider>
        <div className="min-h-dvh bg-canvas">
          <TopBar email={user?.email} />
          <div className="max-w-[1320px] mx-auto px-4 lg:px-6 flex gap-5 pb-28 lg:pb-12">
            <QuickRail onSignOut={handleSignOut} />
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
          <BottomBar onSignOut={handleSignOut} />
        </div>
      </QuickAddProvider>
      </ConfirmProvider>
    </ShellSlotProvider>
  )
}
