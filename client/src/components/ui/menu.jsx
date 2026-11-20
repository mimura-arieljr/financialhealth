import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon } from './icons'

// Popover list anchored to a DOMRect captured on click (fixed, so scrolling rows never clip it)
export function Menu({ anchor, onClose, align = 'left', width = 224, children }) {
  useEffect(() => {
    if (!anchor) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [anchor, onClose])

  if (!anchor) return null
  const raw = align === 'right' ? anchor.right - width : anchor.left
  const left = Math.max(8, Math.min(raw, window.innerWidth - width - 8))
  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div role="menu" style={{ top: anchor.bottom + 6, left, width }}
        className="fixed z-50 bg-card rounded-panel p-1.5 shadow-[0_12px_32px_rgba(14,17,22,0.14)] max-h-72 overflow-y-auto">
        {children}
      </div>
    </>,
    document.body,
  )
}

export function MenuItem({ selected = false, onClick, children }) {
  return (
    <button type="button" role="menuitemradio" aria-checked={selected} onClick={onClick}
      className="w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-[10px] text-sm hover:bg-sub">
      <span className="truncate">{children}</span>
      {selected && <CheckIcon className="w-4 h-4 text-cyan-ink shrink-0" />}
    </button>
  )
}
