import { useContext } from 'react'
import { ShellSlotContext } from '../components/layout/shellSlotContext'

export function useShellSlot() {
  return useContext(ShellSlotContext).el
}
