import { describe, it, expect } from 'vitest'
import {
  monthKey, shiftMonth, daysInMonth, monthName, monthShort, monthLabel,
  fmtDayMonth, lastMonthEnd, monthOptions, fmtPeso, fmtMoney, fmtShort, pctChange, deltaTone,
} from './utils'

const NOW = new Date(2026, 10, 21) // Sat 21 Nov 2026

describe('month helpers', () => {
  it('monthKey uses local time', () => expect(monthKey(NOW)).toBe('2026-11'))
  it('monthKey at 00:30 on the 1st', () => expect(monthKey(new Date(2026, 10, 1, 0, 30))).toBe('2026-11'))
  it('shiftMonth crosses years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })
  it('daysInMonth', () => {
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2028-02')).toBe(29)
  })
  it('names', () => {
    expect(monthName('2026-11')).toBe('November')
    expect(monthShort('2026-10')).toBe('Oct')
    expect(monthLabel('2026-11')).toBe('November 2026')
    expect(fmtDayMonth('2026-11-18')).toBe('18 Nov')
  })
  it('lastMonthEnd', () => {
    expect(lastMonthEnd(NOW)).toBe('2026-10-31')
    expect(lastMonthEnd(new Date(2026, 2, 5))).toBe('2026-02-28')
  })
  it('monthOptions', () => {
    expect(monthOptions(['2026-09', '2026-11', '2026-09', '2027-01'], NOW)).toEqual(['2026-11', '2026-09'])
    expect(monthOptions(['2026-08'], NOW)).toEqual(['2026-11', '2026-08'])
  })
})

describe('fmtPeso', () => {
  it('whole pesos with separators', () => expect(fmtPeso(18420)).toBe('₱18,420'))
  it('rounds', () => expect(fmtPeso(18420.6)).toBe('₱18,421'))
  it('accepts strings', () => expect(fmtPeso('549.00')).toBe('₱549'))
  it('real minus sign', () => expect(fmtPeso(-1240)).toBe('−₱1,240'))
  it('plus sign on request', () => expect(fmtPeso(42000, { sign: true })).toBe('+₱42,000'))
  it('no sign on zero', () => {
    expect(fmtPeso(0, { sign: true })).toBe('₱0')
    expect(fmtPeso(-0.4)).toBe('₱0')
  })
})

describe('fmtShort', () => {
  it('thousands and millions', () => {
    expect(fmtShort(23580)).toBe('₱23.6K')
    expect(fmtShort(1200000)).toBe('₱1.2M')
    expect(fmtShort(999)).toBe('₱999')
    expect(fmtShort(0)).toBe('₱0')
  })
  it('negatives', () => {
    expect(fmtShort(-23580)).toBe('−₱23.6K')
    expect(fmtShort(-500)).toBe('−₱500')
  })
})

describe('pctChange and deltaTone', () => {
  it('pctChange', () => {
    expect(pctChange(110, 100)).toBe(10)
    expect(pctChange(90, 100)).toBe(-10)
    expect(pctChange(5, 0)).toBeNull()
    expect(pctChange(104.2, 100, 1)).toBe(4.2)
    expect(pctChange(-50, -100)).toBe(50)
  })
  it('deltaTone colours by meaning', () => {
    expect(deltaTone(-12, 'down')).toBe('good')
    expect(deltaTone(12, 'down')).toBe('neutral')
    expect(deltaTone(5, 'up')).toBe('good')
    expect(deltaTone(-5, 'up')).toBe('neutral')
    expect(deltaTone(0, 'up')).toBe('neutral')
    expect(deltaTone(null, 'up')).toBeNull()
  })
})

describe('fmtMoney', () => {
  it('two decimals with peso sign', () => expect(fmtMoney(1240.5)).toBe('₱1,240.50'))
  it('real minus sign', () => expect(fmtMoney(-1240)).toBe('\u2212₱1,240.00'))
  it('plus sign on request', () => expect(fmtMoney('42000', { sign: true })).toBe('+₱42,000.00'))
  it('no sign on zero', () => expect(fmtMoney(0, { sign: true })).toBe('₱0.00'))
  it('rounds to cents', () => expect(fmtMoney(1.239)).toBe('₱1.24'))
})
