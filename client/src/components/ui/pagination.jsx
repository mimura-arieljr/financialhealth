import { ChevronLeftIcon, ChevronRightIcon } from './icons'

// Pages around the current one, first and last, with gaps as "…"
function pageItems(page, total) {
  return Array.from({ length: total }, (_, i) => i)
    .filter(i => i === 0 || i === total - 1 || Math.abs(i - page) <= 1)
    .reduce((acc, i, idx, arr) => {
      if (idx > 0 && i - arr[idx - 1] > 1) acc.push('gap' + i)
      acc.push(i)
      return acc
    }, [])
}

const NAV = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium hover:bg-sub disabled:opacity-30 disabled:hover:bg-transparent'

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Pages" className="flex items-center justify-between mt-4 pt-3 border-t border-line">
      <button type="button" className={NAV} disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeftIcon /> <span className="hidden sm:inline">Previous</span>
      </button>
      <div className="flex items-center gap-1">
        {pageItems(page, totalPages).map(item => typeof item === 'string'
          ? <span key={item} className="text-faint text-sm px-1">…</span>
          : (
            <button key={item} type="button" onClick={() => onChange(item)} aria-current={page === item ? 'page' : undefined}
              className={`w-9 h-9 rounded-full text-sm tnum transition-colors ${page === item ? 'bg-ink text-white font-semibold' : 'hover:bg-sub'}`}>
              {item + 1}
            </button>
          ))}
      </div>
      <button type="button" className={NAV} disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        <span className="hidden sm:inline">Next</span> <ChevronRightIcon />
      </button>
    </nav>
  )
}
