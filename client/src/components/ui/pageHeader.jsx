import { createPortal } from 'react-dom'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { useShellSlot } from '../../hooks/useShellSlot'

// Title, live sentence and chips; on mobile the month switcher moves into the top bar
export function PageHeader({ title, headline, subtitle, chips, month, actions }) {
  const isDesktop = useIsDesktop()
  const slot = useShellSlot()
  const portalMonth = month && !isDesktop && slot

  return (
    <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5 lg:mb-6">
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-[28px] lg:text-[34px] font-bold tracking-[-0.03em] leading-[1.1]">{title}</h1>
        {headline && (
          <p className="text-muted text-[15px] mt-2 leading-relaxed">
            {headline.before}
            {headline.strong && <strong className="text-ink font-bold tnum">{headline.strong}</strong>}
            {headline.after}
          </p>
        )}
        {subtitle && <p className="text-muted text-sm mt-1.5">{subtitle}</p>}
        {chips && <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">{chips}</div>}
      </div>
      {((month && !portalMonth) || actions) && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {!portalMonth && month}
          {actions}
        </div>
      )}
      {portalMonth && createPortal(month, slot)}
    </header>
  )
}
