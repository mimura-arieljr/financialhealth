import { useContext } from 'react'
import { ModalContext } from '../components/ui/motion'

// Animated close from inside a Modal; falls back to the given handler elsewhere
export function useModalClose(fallback) {
  return useContext(ModalContext)?.close ?? fallback
}
