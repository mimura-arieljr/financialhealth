import { describe, it, expect } from 'vitest'
import { initials, categoryColorMap, categoryColor, bankColor, tint, avatarColors } from './palette'
import { CATEGORY_PALETTE, BANK_PALETTE, UNCATEGORISED_COLOR } from './consts'

describe('palette', () => {
  it('initials', () => {
    expect(initials('BPI')).toBe('BP')
    expect(initials('gcash')).toBe('GC')
    expect(initials('A')).toBe('A')
    expect(initials('  ')).toBe('?')
  })
  it('category colours follow name order', () => {
    const map = categoryColorMap([{ id: 'x', name: 'Transport' }, { id: 'y', name: 'bills' }, { id: 'z', name: 'Food' }])
    expect(map).toEqual({ y: CATEGORY_PALETTE[0], z: CATEGORY_PALETTE[1], x: CATEGORY_PALETTE[2] })
  })
  it('wraps past the palette length', () => {
    const cats = Array.from({ length: CATEGORY_PALETTE.length + 1 }, (_, i) => ({ id: String(i), name: `c${String(i).padStart(2, '0')}` }))
    expect(categoryColorMap(cats)[String(CATEGORY_PALETTE.length)]).toBe(CATEGORY_PALETTE[0])
  })
  it('categoryColor fallback', () => {
    expect(categoryColor({}, null)).toBe(UNCATEGORISED_COLOR)
    expect(categoryColor({}, 'gone')).toBe(UNCATEGORISED_COLOR)
  })
  it('palette avoids status colours', () => {
    const banned = ['#B45309', '#F59E0B', '#B91C1C', '#EF4444', '#15803D', '#10B981']
    expect(CATEGORY_PALETTE.map(c => c.toUpperCase()).filter(c => banned.includes(c))).toEqual([])
    expect(CATEGORY_PALETTE.length).toBeGreaterThanOrEqual(10)
  })
  it('bank colour is stable', () => {
    expect(bankColor('BPI')).toBe(bankColor('BPI'))
    expect(BANK_PALETTE).toContain(bankColor('GCash'))
  })
  it('tint', () => expect(tint('#0E7490')).toBe('rgba(14, 116, 144, 0.12)'))
  it('avatarColors keeps text readable', () => {
    expect(avatarColors('#0E7490')).toEqual({ bg: 'rgba(14, 116, 144, 0.14)', fg: '#0E7490' })
    expect(avatarColors('#00DCEB')).toEqual({ bg: 'rgba(0, 220, 235, 0.14)', fg: '#0E1116' })
    expect(avatarColors('#94A3B8').fg).toBe('#0E1116')
  })
})
