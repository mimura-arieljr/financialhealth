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

  it('does not paint a falling net worth red (balance down is grey news)', () => {
    expect(read('pages/analytics.jsx')).not.toMatch(/netWorthChange < 0 \? 'alert'/)
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
