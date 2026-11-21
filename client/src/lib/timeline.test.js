import { describe, it, expect } from 'vitest'
import { labelAnchor } from './timeline'

describe('labelAnchor', () => {
  it('starts labels at the dot on the first days so they stay inside the card', () => {
    expect(labelAnchor(1, 30)).toEqual({ align: 'start', transform: 'translateX(-8px)' })
    expect(labelAnchor(2, 30).align).toBe('start')
  })

  it('ends labels at the dot on the last days', () => {
    expect(labelAnchor(30, 30)).toEqual({ align: 'end', transform: 'translateX(calc(-100% + 8px))' })
    expect(labelAnchor(29, 30).align).toBe('end')
    expect(labelAnchor(28, 28).align).toBe('end')
  })

  it('centres labels everywhere else', () => {
    expect(labelAnchor(15, 30)).toEqual({ align: 'center', transform: 'translateX(-50%)' })
    expect(labelAnchor(3, 30).align).toBe('center')
    expect(labelAnchor(28, 30).align).toBe('center')
  })
})
