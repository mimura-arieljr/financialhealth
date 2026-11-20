// Shared quiet axis and grid styling
export const AXIS_TICK = { fill: '#9CA3AF', fontSize: 11 }
export const GRID_STROKE = '#E7EAEE'

// SVG ids cannot contain the characters React's useId produces
export const svgId = (id) => id.replace(/[^a-zA-Z0-9_-]/g, '')
