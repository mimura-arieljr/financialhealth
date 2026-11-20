import { CATEGORY_PALETTE, BANK_PALETTE, UNCATEGORISED_COLOR } from './consts'

export function initials(name) {
  const letters = (name || '').replace(/[^\p{L}\p{N}]/gu, '')
  return letters ? letters.slice(0, 2).toUpperCase() : '?'
}

// Colour by position in the alphabetical category list, so it follows the category, not its rank
export function categoryColorMap(categories) {
  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  return Object.fromEntries(sorted.map((c, i) => [c.id, CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]]))
}

export const categoryColor = (map, id) => (id && map[id]) || UNCATEGORISED_COLOR

export function bankColor(name) {
  let h = 0
  for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return BANK_PALETTE[h % BANK_PALETTE.length]
}

export function tint(hex, alpha = 0.12) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
