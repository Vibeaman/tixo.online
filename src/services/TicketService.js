const TICKETS_KEY = 'planam_tickets'

function getAll() {
  return JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]')
}
function saveAll(tickets) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets))
}

const TicketService = {
  purchase({ userId, eventId, eventTitle, tier, price, quantity }) {
    const tickets = getAll()
    const ticket = {
      id: 'tkt-' + Date.now(),
      userId,
      eventId,
      eventTitle,
      tier,
      price,
      quantity,
      total: price * quantity,
      purchasedAt: new Date().toISOString(),
      status: 'confirmed',
    }
    tickets.push(ticket)
    saveAll(tickets)
    return ticket
  },

  getByUser(userId) {
    return getAll().filter(t => t.userId === userId)
  },

  getByEvent(eventId) {
    return getAll().filter(t => t.eventId === eventId)
  },
}

export default TicketService
