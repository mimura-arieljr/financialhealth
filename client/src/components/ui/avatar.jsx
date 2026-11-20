import { initials, bankColor, avatarColors } from '../../lib/palette'

const SIZES = { sm: 'w-7 h-7 rounded-[9px] text-[10px]', md: 'w-9 h-9 rounded-[12px] text-[11px]' }

export function CategoryAvatar({ name, color, size = 'md' }) {
  const { bg, fg } = avatarColors(color)
  return (
    <span aria-hidden="true" style={{ background: bg, color: fg }}
      className={`grid place-items-center font-bold shrink-0 ${SIZES[size]}`}>
      {initials(name)}
    </span>
  )
}

export function BankAvatar({ name, size = 'xs' }) {
  const cls = size === 'xs' ? 'w-[18px] h-[18px] rounded-[6px] text-[8px]' : 'w-7 h-7 rounded-[9px] text-[10px]'
  return (
    <span aria-hidden="true" style={{ background: bankColor(name) }}
      className={`grid place-items-center font-bold text-white shrink-0 ${cls}`}>
      {initials(name)}
    </span>
  )
}

export function BankPill({ name }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-sub rounded-full pl-1 pr-2.5 py-0.5 text-xs font-medium whitespace-nowrap max-w-full min-w-0">
      <BankAvatar name={name} />
      <span className="truncate">{name}</span>
    </span>
  )
}
