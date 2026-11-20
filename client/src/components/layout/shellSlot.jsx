import { useContext, useState } from 'react'
import { ShellSlotContext } from './shellSlotContext'

export function ShellSlotProvider({ children }) {
  const [el, setEl] = useState(null)
  return <ShellSlotContext.Provider value={{ el, setEl }}>{children}</ShellSlotContext.Provider>
}

// The element in the mobile top bar that pages portal into
export function ShellSlotTarget({ className = '' }) {
  const { setEl } = useContext(ShellSlotContext)
  return <div ref={setEl} className={className} />
}
