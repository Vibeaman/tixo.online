import seedEvents from '../data/seedEvents'

const EVENTS_KEY = 'planam_events'
const SEEDED_KEY = 'planam_seeded'

function ensureSeeded() {
  if (!localStorage.getItem(SEEDED_KEY)) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(seedEvents))
    localStorage.setItem(SEEDED_KEY, 'true')
  }
}

function getAll() {
  ensureSeeded()
  return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]')
}
function saveAll(events) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

const EventService = {
  getAll() {
    return getAll()
  },

  getById(id) {
    return getAll().find(e => e.id === id) || null
  },

  search({ query = '', category = '', sort = 'date' } = {}) {
    let results = getAll()
    if (query) {
      const q = query.toLowerCase()
      results = results.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      )
    }
    if (category) {
      results = results.filter(e => e.category.toLowerCase() === category.toLowerCase())
    }
    if (sort === 'date') results.sort((a, b) => new Date(a.date) - new Date(b.date))
    if (sort === 'demand') results.sort((a, b) => (b.demand || 0) - (a.demand || 0))
    if (sort === 'price') results.sort((a, b) => {
      const pa = a.tickets?.[0]?.price ?? 0
      const pb = b.tickets?.[0]?.price ?? 0
      return pa - pb
    })
    return results
  },

  getByCategory(category) {
    return getAll().filter(e => e.category.toLowerCase() === category.toLowerCase())
  },

  create(eventData) {
    const events = getAll()
    const event = {
      ...eventData,
      id: 'evt-' + Date.now(),
      viewers: 0,
      demand: 0,
      hot: false,
      createdAt: new Date().toISOString(),
    }
    events.push(event)
    saveAll(events)
    return event
  },

  getByOrganizer(userId) {
    return getAll().filter(e => e.organizerId === userId)
  },

  getCategories() {
    const events = getAll()
    const cats = {}
    events.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + 1
    })
    return Object.entries(cats).map(([name, count]) => ({ name, count }))
  },
}

export default EventService
