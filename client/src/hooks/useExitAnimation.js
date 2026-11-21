import { useCallback, useEffect, useRef, useState } from 'react'
import { EXIT_MS } from '../components/ui/motion'

// Plays the exit animation, then calls onClose once (repeat requests are ignored)
export function useExitAnimation(onClose) {
  const [closing, setClosing] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const close = useCallback(() => {
    if (timer.current) return
    setClosing(true)
    timer.current = setTimeout(onClose, EXIT_MS)
  }, [onClose])
  return { closing, close }
}
