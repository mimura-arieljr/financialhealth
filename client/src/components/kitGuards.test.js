import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Source-level guards for class rules a node test cannot see in a browser
const SRC = fileURLToPath(new URL('..', import.meta.url))

const jsxFiles = (dir) => readdirSync(dir).flatMap(name => {
  const path = join(dir, name)
  if (statSync(path).isDirectory()) return jsxFiles(path)
  return path.endsWith('.jsx') ? [path] : []
})

// Every JSX opening tag with its className text ("..." or the raw {...} expression)
function classNames(source) {
  const found = []
  const tagRe = /<([A-Za-z][\w.]*)/g
  let m
  while ((m = tagRe.exec(source))) {
    let i = m.index + m[0].length
    while (i < source.length && source[i] !== '>' && !(source[i] === '/' && source[i + 1] === '>')) {
      const attr = /^\s*([\w-]+)=/.exec(source.slice(i))
      if (!attr) { i++; continue }
      i += attr[0].length
      let value
      if (source[i] === '"') {
        const end = source.indexOf('"', i + 1)
        value = source.slice(i + 1, end)
        i = end + 1
      } else if (source[i] === '{') {
        let depth = 0, j = i
        do { if (source[j] === '{') depth++; else if (source[j] === '}') depth--; j++ } while (depth > 0 && j < source.length)
        value = source.slice(i + 1, j - 1)
        i = j
      }
      if (attr[1] === 'className' && value !== undefined) found.push({ tag: m[1], value })
    }
  }
  return found
}

const all = jsxFiles(SRC).flatMap(file => classNames(readFileSync(file, 'utf8')).map(c => ({ ...c, file: file.slice(SRC.length) })))
const tokens = (value) => value.split(/[\s"'`{}$?:]+(?![\w-]*\])/).filter(Boolean)
const hasToken = (value, re) => value.split(/[\s"'`{}]+/).some(t => re.test(t))

describe('kit class guards', () => {
  it('finds class names to check', () => {
    expect(all.length).toBeGreaterThan(100)
    expect(tokens('a b')).toEqual(['a', 'b'])
  })

  it('never hides a kit component with plain `hidden` (its base display class wins; use max-<bp>:hidden)', () => {
    // Router links pass className straight to <a>, with no base classes to fight
    const bad = all.filter(c => /^[A-Z]/.test(c.tag) && !/^(Nav)?Link$/.test(c.tag) && hasToken(c.value, /^hidden$/))
    expect(bad.map(c => `${c.file}: <${c.tag} className=${c.value}>`)).toEqual([])
  })

  it('never recolours a Button or IconButton through className (the variant text colour wins; use a variant)', () => {
    const bad = all.filter(c => /^(Icon)?Button$/.test(c.tag) && hasToken(c.value, /^text-(alert|good|warn|muted|faint|cyan-ink|white|ink)$/))
    expect(bad.map(c => `${c.file}: <${c.tag} className=${c.value}>`)).toEqual([])
  })

  it('keeps every text input at 16px on phones so iOS does not zoom on focus', () => {
    const inputs = all.filter(c => /^(input|select|textarea)$/.test(c.tag))
    expect(inputs.length).toBeGreaterThan(0)
    const bad = inputs.filter(c => !/\bFIELD\b/.test(c.value) && !hasToken(c.value, /^text-base$/))
    expect(bad.map(c => `${c.file}: <${c.tag} className=${c.value}>`)).toEqual([])
  })

  it('never forces every category tick onto a chart axis (labels overlap on phones)', () => {
    const charts = jsxFiles(join(SRC, 'components/charts')).map(f => readFileSync(f, 'utf8'))
    expect(charts.some(s => /interval=\{0\}/.test(s))).toBe(false)
  })
})

describe('layout guards for the final review findings', () => {
  const read = (p) => readFileSync(join(SRC, p), 'utf8')

  it('lets the transfer bank pair shrink on phones so the amount stays inside the row', () => {
    const row = classNames(read('pages/transfers.jsx')).find(c => c.value.includes('md:w-[300px]'))
    expect(hasToken(row.value, /^shrink-0$/)).toBe(false)
    expect(hasToken(row.value, /^md:shrink-0$/)).toBe(true)
  })

  it('lays the recent activity table out at fixed widths so it cannot push past its card', () => {
    const table = classNames(read('pages/dashboard/recentActivity.jsx')).find(c => c.tag === 'table')
    expect(hasToken(table.value, /^table-fixed$/)).toBe(true)
  })

  it('collapses the logo wordmark on phones narrower than 380px so the month switcher fits', () => {
    const wordmark = classNames(read('components/layout/topBar.jsx')).find(c => c.value.includes('sr-only'))
    expect(wordmark?.value).toMatch(/max-\[379px\]:sr-only/)
  })

  it('paints a falling net worth red (bad news is red)', () => {
    expect(read('pages/analytics.jsx')).toMatch(/netWorthChange < 0 \? 'alert'/)
  })
})

describe('round two tweaks', () => {
  const read = (p) => readFileSync(join(SRC, p), 'utf8')

  it('shows the spinner, not skeletons, while pages load', () => {
    const importers = jsxFiles(SRC).filter(f => /from '[^']*\/skeleton'/.test(readFileSync(f, 'utf8')))
    expect(importers.map(f => f.slice(SRC.length))).toEqual([])
    expect(read('components/ui/spinner.jsx')).toMatch(/export function Spinner/)
  })

  it('does not wrap the login logo in a white pill', () => {
    const logo = classNames(read('pages/login.jsx')).find(c => c.value.includes('font-bold') && c.value.includes('tracking-tight') && c.value.includes('items-center'))
    expect(hasToken(logo.value, /^bg-card$/)).toBe(false)
  })

  it('lets stat tile labels wrap instead of truncating', () => {
    const label = classNames(read('components/ui/statTile.jsx')).find(c => c.tag === 'span' && !c.value.includes('rounded-full'))
    expect(hasToken(label.value, /^truncate$/)).toBe(false)
  })

  it('renders header chips as plain text, not white pills', () => {
    expect(read('components/ui/pill.jsx')).not.toMatch(/bg-card rounded-full px-3 h-8/)
  })

  it('folds the three add actions on the desktop rail behind one Add toggle', () => {
    const rail = read('components/layout/quickRail.jsx')
    expect(rail).toMatch(/aria-expanded=\{open\}/)
    expect(rail.match(/openQuickAdd\(/g)).toHaveLength(1)
  })
})

describe('round three tweaks', () => {
  const read = (p) => readFileSync(join(SRC, p), 'utf8')

  it('never shows the loading spinner inside a card', () => {
    const bad = jsxFiles(join(SRC, 'pages')).filter(f => {
      const s = readFileSync(f, 'utf8')
      return [...s.matchAll(/<Card[\s>][\s\S]*?<\/Card>/g)].some(m => m[0].includes('<Loading'))
    })
    expect(bad.map(f => f.slice(SRC.length))).toEqual([])
  })

  it('uses a larger spinner, centred in the page area by default', () => {
    const s = read('components/ui/spinner.jsx')
    expect(s).toMatch(/size = 'w-4 h-4'/)
    expect(s).toMatch(/export function Loading\(\{ className = 'min-h-\[60vh\]' \}\)/)
  })
})

describe('motion', () => {
  const read = (p) => readFileSync(join(SRC, p), 'utf8')
  const body = (src, name) => {
    const start = src.indexOf(`const ${name} = async`)
    return start < 0 ? '' : src.slice(start, src.indexOf('\n  }\n', start))
  }

  it('defines the motion keyframes and falls back to a fade for reduced motion', () => {
    const css = read('index.css')
    for (const k of ['fade-in', 'fade-out', 'sheet-in', 'sheet-out', 'dialog-in', 'dialog-out', 'rise', 'pop', 'rail-in']) {
      expect(css).toMatch(new RegExp(`@keyframes ${k} `))
    }
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.motion-panel-in/)
  })

  it('animates the modal in and out, and lets forms close it through context', () => {
    const modal = read('components/ui/modal.jsx')
    expect(modal).toMatch(/motion-panel-in/)
    expect(modal).toMatch(/motion-panel-out/)
    expect(modal).toMatch(/ModalContext\.Provider/)
  })

  it('shows a Saved tick before a form closes its modal', () => {
    expect(read('components/forms/formActions.jsx')).toMatch(/Saved/)
    for (const f of ['components/forms/expenseForm.jsx', 'components/forms/revenueForm.jsx', 'components/forms/transferForm.jsx', 'pages/recurring/recurringForm.jsx']) {
      const s = read(f)
      expect(s, f).toMatch(/useModalClose\(onClose\)/)
      expect(s, f).toMatch(/setSaved\(true\)/)
    }
  })

  it('leaves closing after a save to the modal so it can animate out', () => {
    expect(body(read('components/layout/quickAdd.jsx'), 'handleSubmit')).not.toMatch(/close\(\)/)
    for (const p of ['pages/expenses.jsx', 'pages/revenues.jsx', 'pages/transfers.jsx', 'pages/recurring.jsx']) {
      expect(body(read(p), 'handleEdit'), p).not.toMatch(/setEditing\(null\)/)
    }
    expect(body(read('pages/recurring.jsx'), 'handleAdd')).not.toMatch(/setShowAdd\(false\)/)
  })

  it('animates the add options on the rail and the mobile sheet', () => {
    expect(read('components/layout/quickRail.jsx')).toMatch(/motion-rail-in/)
    expect(read('components/layout/sheet.jsx')).toMatch(/motion-panel-in/)
  })

  it('brings page content in with a stagger once it is ready', () => {
    for (const p of ['pages/dashboard.jsx', 'pages/expenses.jsx', 'pages/revenues.jsx', 'pages/transfers.jsx', 'pages/recurring.jsx', 'pages/analytics.jsx', 'pages/settings.jsx']) {
      expect(read(p), p).toMatch(/motion-stagger/)
    }
  })
})

describe('rail labels', () => {
  it('stack above page content so hover labels are never covered', () => {
    const rail = classNames(readFileSync(join(SRC, 'components/layout/quickRail.jsx'), 'utf8'))
    const aside = rail.find(c => c.tag === 'aside')
    const label = rail.find(c => c.value.includes('left-full'))
    expect(hasToken(aside.value, /^z-\d+$/)).toBe(true)
    expect(hasToken(label.value, /^z-\d+$/)).toBe(true)
  })
})

describe('confirm modal and slower motion', () => {
  const read = (p) => readFileSync(join(SRC, p), 'utf8')
  const ms = (css, sel) => Number(new RegExp(`${sel}[^}]*?(\\d+)ms`).exec(css)?.[1])

  it('never uses the browser confirm alert', () => {
    const bad = jsxFiles(SRC).filter(f => /(?<![\w.])confirm\(\s*['"`]/.test(readFileSync(f, 'utf8')))
    expect(bad.map(f => f.slice(SRC.length))).toEqual([])
  })

  it('provides one confirm modal for the whole app', () => {
    expect(read('components/layout/layout.jsx')).toMatch(/<ConfirmProvider>/)
    expect(read('components/ui/confirmDialog.jsx')).toMatch(/export function ConfirmProvider/)
  })

  it('asks before deleting banks, cards and categories in Settings', () => {
    expect(read('pages/settings.jsx').match(/await confirm\(/g)).toHaveLength(2)
  })

  it('closes the edit modal with its animation after a confirmed delete', () => {
    expect(read('components/forms/formActions.jsx')).toMatch(/await onDelete\(\)/)
    for (const p of ['pages/expenses.jsx', 'pages/revenues.jsx', 'pages/transfers.jsx', 'pages/recurring.jsx']) {
      const s = read(p)
      const body = s.slice(s.indexOf('const handleDelete = async'), s.indexOf('\n  }\n', s.indexOf('const handleDelete = async')))
      expect(body, p).not.toMatch(/setEditing\(null\)/)
      expect(body, p).toMatch(/return true/)
    }
  })

  it('lets only the top modal answer Escape when two are open', () => {
    expect(read('components/ui/modal.jsx')).toMatch(/querySelectorAll\('\[role="dialog"\]'\)/)
  })

  it('runs animations long enough to notice', async () => {
    const { EXIT_MS, SAVED_MS } = await import('./ui/motion.js')
    expect(EXIT_MS).toBeGreaterThanOrEqual(260)
    expect(SAVED_MS).toBeGreaterThanOrEqual(900)
    const css = read('index.css')
    expect(ms(css, '\\.motion-stagger > \\[data-revealed\\] \\{ animation: rise')).toBeGreaterThanOrEqual(650)
    expect(ms(css, '\\.motion-panel-in \\{ animation: dialog-in')).toBeGreaterThanOrEqual(380)
    expect(ms(css, '\\.motion-rail-in')).toBeGreaterThanOrEqual(320)
  })
})

describe('scroll reveal and dashboard columns', () => {
  const read = (p) => readFileSync(join(SRC, p), 'utf8')

  it('reveals staggered content as it scrolls into view, one after another', () => {
    const hook = read('hooks/useScrollReveal.js')
    expect(hook).toMatch(/IntersectionObserver/)
    expect(hook).toMatch(/MutationObserver/)
    expect(Number(/\* (\d+)\}ms/.exec(hook)?.[1])).toBeGreaterThanOrEqual(110)
    expect(read('components/layout/layout.jsx')).toMatch(/useScrollReveal\(/)
  })

  it('hides content before reveal only when the observer is running', () => {
    const css = read('index.css')
    expect(css).toMatch(/\.reveal-ready \.motion-stagger > :not\(\[role="dialog"\]\):not\(\[data-revealed\]\) \{ opacity: 0; \}/)
    expect(css).not.toMatch(/:nth-child\(2\) \{ animation-delay/)
  })

  it('ends both dashboard columns level and keeps recent activity compact', () => {
    const cols = classNames(read('pages/dashboard.jsx')).filter(c => c.value.includes('space-y-4 order-'))
    expect(cols).toHaveLength(2)
    for (const c of cols) expect(c.value).toMatch(/lg:\[&>\*:last-child\]:flex-1/)
    expect(read('pages/dashboard/recentActivity.jsx')).toMatch(/\.slice\(0, 5\)/)
  })
})
