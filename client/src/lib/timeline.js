// Where a day's label sits against its dot: edge days hug the card edge so names stay inside
export function labelAnchor(day, days) {
  const at = (day - 1) / (days - 1)
  if (at < 0.06) return { align: 'start', transform: 'translateX(-8px)' }
  if (at > 0.94) return { align: 'end', transform: 'translateX(calc(-100% + 8px))' }
  return { align: 'center', transform: 'translateX(-50%)' }
}
