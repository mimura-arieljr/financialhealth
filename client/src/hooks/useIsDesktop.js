import { useSyncExternalStore } from 'react'

// Matches Tailwind's lg breakpoint (spec: desktop layout at 1024px and up)
const QUERY = '(min-width: 1024px)'

function subscribe(onChange) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => true)
}
