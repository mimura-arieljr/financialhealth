import { useLayoutEffect } from 'react'

const TARGETS = '.motion-stagger > :not([role="dialog"]):not([data-revealed])'

// Staggered content rises in as it scrolls into view; whatever shows together cascades
export function useScrollReveal(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !('IntersectionObserver' in window)) return
    const html = document.documentElement
    html.classList.add('reveal-ready')

    const io = new IntersectionObserver((entries) => {
      let i = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.style.animationDelay = `${Math.min(i++, 5) * 120}ms`
        entry.target.setAttribute('data-revealed', '')
        io.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px' })

    const watch = () => root.querySelectorAll(TARGETS).forEach(el => io.observe(el))
    watch()
    // Pages render their content after loading, so watch for new elements too
    const mo = new MutationObserver(watch)
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      html.classList.remove('reveal-ready')
    }
  }, [rootRef])
}
