import { createContext } from 'react'

// Quick add from anywhere, plus a version number pages refetch on
export const QuickAddContext = createContext({ openQuickAdd: () => {}, dataVersion: 0, notifySaved: () => {} })
