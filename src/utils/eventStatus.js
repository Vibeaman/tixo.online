// Shared helpers for classifying events as upcoming / ended / placeholder
// so listing pages can group and sort them consistently.

export function isEventEnded(event) {
  const endRef = event.end_date || event.date
  if (!endRef) return false
  const endTimeRef = event.end_time || event.time || '23:59'
  const [y, m, d] = endRef.split('-').map(Number)
  const [h, min] = (endTimeRef || '23:59').split(':').map(Number)
  return new Date(y, m - 1, d, h || 0, min || 0, 0) < new Date()
}

// Events with no real photo — least valuable in a browse grid, so they
// should sink to the bottom regardless of date.
export function isPlaceholderEvent(event) {
  return !event.image
}

// 0 = upcoming/live, 1 = ended, 2 = placeholder (no image) — always last.
export function eventTier(event) {
  if (isPlaceholderEvent(event)) return 2
  if (isEventEnded(event)) return 1
  return 0
}

// Stable sort: preserves whatever order the list already had within a tier
// (e.g. from a prior date/popularity sort) while grouping upcoming events
// first, ended events below them, and placeholder events last of all.
export function sortByEventTier(list) {
  return [...list].sort((a, b) => eventTier(a) - eventTier(b))
}
