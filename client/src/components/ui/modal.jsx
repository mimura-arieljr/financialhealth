import { useEffect } from 'react'
import { IconButton } from './button'
import { CloseIcon } from './icons'

// Centred dialog on desktop, bottom sheet on mobile
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:px-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card w-full lg:max-w-md rounded-t-[28px] lg:rounded-card px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="lg:hidden w-9 h-1 rounded-full bg-line mx-auto -mt-1 mb-4" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <IconButton label="Close" onClick={onClose}><CloseIcon /></IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}
