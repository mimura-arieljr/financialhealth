import { createContext } from 'react'

// Lets a page place its month switcher in the mobile top bar
export const ShellSlotContext = createContext({ el: null, setEl: () => {} })
