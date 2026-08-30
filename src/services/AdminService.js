import { supabase } from '../lib/supabase'

const AdminService = {
  async isAdmin(userId) {
    if (!userId) return false
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()
      if (error) throw error
      return !!data?.is_admin
    } catch (e) {
      console.warn('isAdmin check failed:', e.message)
      return false
    }
  },

  async getAllEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getAllTickets() {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getStats() {
    const [events, tickets, users] = await Promise.all([
      this.getAllEvents(),
      this.getAllTickets(),
      this.getAllUsers(),
    ])

    let totalRevenue = 0
    let paidRevenue = 0
    let totalTicketsSold = 0
    let paidTicketsCount = 0
    let freeTicketsCount = 0
    let checkedInCount = 0

    for (const t of tickets) {
      const qty = Number(t.quantity) || 1
      const amount = Number(t.paid_amount) || 0
      totalTicketsSold += qty
      totalRevenue += amount
      if (t.checked_in) checkedInCount++

      const status = (t.payment_status || '').toLowerCase()
      if (status === 'paid' || status === 'verified') {
        paidTicketsCount += qty
        paidRevenue += amount
      } else if (status === 'free') {
        freeTicketsCount += qty
      }
    }

    return {
      totalRevenue,
      paidRevenue,
      totalTicketsSold,
      paidTicketsCount,
      freeTicketsCount,
      checkedInCount,
      totalEvents: events.length,
      totalUsers: users.length,
      events,
      tickets,
      users,
    }
  },
}

export default AdminService
