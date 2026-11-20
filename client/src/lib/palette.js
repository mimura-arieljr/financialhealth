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

// WCAG relative luminance of a #RRGGBB colour
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}

// Avatar on a soft tint; light colours get ink text so initials stay readable
export function avatarColors(hex) {
  return { bg: tint(hex, 0.14), fg: luminance(hex) > 0.25 ? '#0E1116' : hex }
}
