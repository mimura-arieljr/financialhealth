import { describe, it, expect } from 'vitest'
import { gradientId, areaMargin } from './axes'

describe('gradientId', () => {
  it('builds an id usable inside url(#...) from a series key with spaces', () => {
    const id = gradientId('r1', 'Net Worth')
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(id).toContain('r1')
  })

  it('keeps different series apart', () => {
    expect(gradientId('r1', 'Revenue')).not.toBe(gradientId('r1', 'Expenses'))
  })
})

describe('areaMargin', () => {
  it('leaves room on the right for the 68px end label pill centred on the last point', () => {
    const m = areaMargin({ endLabel: true })
    expect(m.right).toBeGreaterThanOrEqual(36)
    expect(m.top).toBe(34)
  })

  it('keeps the quiet margins without an end label', () => {
    expect(areaMargin({ endLabel: false })).toEqual({ top: 10, right: 14, left: 0, bottom: 0 })
  })
})
