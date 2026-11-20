import { SearchIcon } from './icons'

export function SearchField({ value, onChange, placeholder = 'Search', label = 'Search', className = '' }) {
  return (
    <label className={`flex items-center gap-1.5 bg-sub rounded-full h-8 px-3 ${className}`}>
      <SearchIcon className="w-3.5 h-3.5 text-faint shrink-0" />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={label}
        className="bg-transparent outline-none text-base lg:text-xs w-full placeholder:text-faint" />
    </label>
  )
}
