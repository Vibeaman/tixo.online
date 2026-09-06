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

// Whether an event has already finished is the PRIMARY ranking signal: every
// ended event sinks below every upcoming one, no exceptions. Missing artwork is
// only a tiebreak within each of those two groups.
//
// (Ranking them as one flat scale used to let an ended event with a nice photo
// outrank an upcoming event that had no image yet — past events belong at the
// very bottom regardless of how good they look.)
//
// 0 = upcoming w/ image, 1 = upcoming w/o image, 2 = ended w/ image, 3 = ended w/o image
export function eventTier(event) {
  return (isEventEnded(event) ? 2 : 0) + (isPlaceholderEvent(event) ? 1 : 0)
}

// Stable sort: preserves whatever order the list already had within a tier
// (e.g. from a prior date/popularity sort) while grouping upcoming events
// first, ended events below them, and placeholder events last of all.
export function sortByEventTier(list) {
  return [...list].sort((a, b) => eventTier(a) - eventTier(b))
}
