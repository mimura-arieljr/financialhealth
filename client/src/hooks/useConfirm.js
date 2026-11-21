import { useContext } from 'react'
import { ConfirmContext } from '../components/ui/confirmContext'

export function useConfirm() {
  return useContext(ConfirmContext)
}
