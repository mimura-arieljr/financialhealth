import { useContext } from 'react'
import { QuickAddContext } from '../components/layout/quickAddContext'

export function useQuickAdd() {
  return useContext(QuickAddContext)
}
