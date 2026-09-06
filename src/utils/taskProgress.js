// Remembers which social tasks a user has already opened.
//
// The "I've Done This" button unlocks only after the user taps "Open".
// That flag used to live in component state, so leaving the page (or even
// switching tabs on mobile, where the browser may discard the page) reset it
// and the button went back to "Do Task First" — with no way to claim.
// Persisting it to localStorage keeps the unlock across reloads and sessions.

const KEY = 'tixo:opened-tasks'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function hasOpenedTask(taskId) {
  if (!taskId) return false
  return readAll().includes(String(taskId))
}

export function markTaskOpened(taskId) {
  if (!taskId) return
  try {
    const all = readAll()
    const id = String(taskId)
    if (!all.includes(id)) {
      all.push(id)
      localStorage.setItem(KEY, JSON.stringify(all))
    }
  } catch {
    /* storage unavailable (private mode) — unlock stays session-only */
  }
}
