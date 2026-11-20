// Shared quiet axis and grid styling
export const AXIS_TICK = { fill: '#9CA3AF', fontSize: 11 }
export const GRID_STROKE = '#E7EAEE'

// SVG ids cannot contain the characters React's useId produces
export const svgId = (id) => id.replace(/[^a-zA-Z0-9_-]/g, '')

// Gradient id for one series; keys like 'Net Worth' have spaces, which break url(#...)
export const gradientId = (base, key) => svgId(`${base}-${key}`)

// The end label pill is 68px wide and centred on the last point, so it needs room on the right
export const areaMargin = ({ endLabel = false } = {}) => endLabel
  ? { top: 34, right: 40, left: 0, bottom: 0 }
  : { top: 10, right: 14, left: 0, bottom: 0 }
