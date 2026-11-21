import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useExitAnimation } from '../../hooks/useExitAnimation'

// Mobile bottom sheet used by the + and More buttons
export function Sheet({ title, onClose, children }) {
  const { closing, close } = useExitAnimation(onClose)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  return createPortal(
    <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`absolute inset-0 bg-ink/30 ${closing ? 'motion-fade-out' : 'motion-fade-in'}`} onClick={close} />
      <div className={`absolute inset-x-0 bottom-0 bg-card rounded-t-[28px] px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(14,17,22,0.12)] ${closing ? 'motion-panel-out' : 'motion-panel-in'}`}>
        <div className="w-9 h-1 rounded-full bg-line mx-auto mb-2" />
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function SheetItem({ icon, label, to, onClick }) {
  const Icon = icon
  const cls = 'flex items-center gap-3 w-full px-2 py-3 text-[15px] font-semibold border-b border-line last:border-0 text-left'
  const body = (
    <>
      <span className="w-9 h-9 rounded-[12px] bg-sub grid place-items-center"><Icon className="w-[18px] h-[18px]" /></span>
      {label}
    </>
  )
  if (to) return <Link to={to} onClick={onClick} className={cls}>{body}</Link>
  return <button type="button" onClick={onClick} className={cls}>{body}</button>
}
