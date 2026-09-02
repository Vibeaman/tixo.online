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
      .order('purchased_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
    if (error) throw error
    return data || []
  },

  // Referral commissions — used to split ticket revenue between Tixo, organizers, and referrers
  async getAllReferralCommissions() {
    try {
      const { data, error } = await supabase
        .from('referral_commissions')
        .select('*')
      if (error) throw error
      return data || []
    } catch (e) {
      console.warn('getAllReferralCommissions failed:', e.message)
      return []
    }
  },

  async getStats() {
    const [events, tickets, users, referralCommissions] = await Promise.all([
      this.getAllEvents(),
      this.getAllTickets(),
      this.getAllUsers(),
      this.getAllReferralCommissions(),
    ])

    // Map ticket_id -> commission row, for tickets sold through a referral link
    const commissionByTicket = {}
    for (const c of referralCommissions) {
      if (c.ticket_id) commissionByTicket[c.ticket_id] = c
    }

    const STANDARD_TIXO_RATE = 0.05 // Tixo's normal platform cut on ticket sales

    let totalRevenue = 0       // gross amount buyers paid
    let paidRevenue = 0        // gross amount buyers paid, paid/verified tickets only
    let tixoRevenue = 0        // Tixo's actual platform earnings (its cut)
    let organizerRevenue = 0   // what organizers keep/get paid out
    let referrerRevenue = 0    // commissions paid out to referrers
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

        const commission = commissionByTicket[t.id]
        if (commission) {
          tixoRevenue += Number(commission.platform_fee) || 0
          referrerRevenue += Number(commission.commission_amount) || 0
          organizerRevenue += Number(commission.organizer_revenue) || 0
        } else {
          tixoRevenue += amount * STANDARD_TIXO_RATE
          organizerRevenue += amount * (1 - STANDARD_TIXO_RATE)
        }
      } else if (status === 'free') {
        freeTicketsCount += qty
      }
    }

    return {
      totalRevenue,
      paidRevenue,
      tixoRevenue,
      organizerRevenue,
      referrerRevenue,
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
