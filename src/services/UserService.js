import AuthService from './AuthService'
import EventService from './EventService'
import TicketService from './TicketService'

const UserService = {
  getProfile() {
    return AuthService.getCurrentUser()
  },

  getMyEvents() {
    const user = AuthService.getCurrentUser()
    if (!user) return []
    return EventService.getByOrganizer(user.id)
  },

  getMyTickets() {
    const user = AuthService.getCurrentUser()
    if (!user) return []
    return TicketService.getByUser(user.id)
  },

  updateProfile(updates) {
    return AuthService.updateProfile(updates)
  },
}

export default UserService
