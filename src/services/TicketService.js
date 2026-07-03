import { supabase } from '../lib/supabase'

const TicketService = {
  // Single tier purchase (backward compat)
  async purchase({ eventId, eventTitle, tierName, quantity, totalPrice, userId, referralCode, attendanceMode, isRsvp }) {
    const insertData = {
      event_id: eventId,
      user_id: userId,
      event_title: eventTitle,
      tier_name: tierName,
      quantity,
      total_price: totalPrice,
      attendance_mode: attendanceMode || 'in-person',
      is_rsvp: isRsvp || false
    }
    if (referralCode) insertData.referral_code = referralCode

    const { data, error } = await supabase
      .from('tickets')
      .insert([insertData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Multi-tier purchase (cart checkout)
  async purchaseMultiple({ eventId, eventTitle, items, userId, referralCode, attendanceMode, isRsvp }) {
    // items: [{ tierName, quantity, totalPrice }]
    const inserts = items.map(item => ({
      event_id: eventId,
      user_id: userId,
      event_title: eventTitle,
      tier_name: item.tierName,
      quantity: item.quantity,
      total_price: item.totalPrice,
      attendance_mode: attendanceMode || 'in-person',
      is_rsvp: isRsvp || false,
      ...(referralCode ? { referral_code: referralCode } : {})
    }))

    const { data, error } = await supabase
      .from('tickets')
      .insert(inserts)
      .select()
    if (error) throw error
    return data
  },

  async getByUser(userId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
    if (error) throw error
    return data
  },

  // Check if user already RSVP'd to an event
  async hasRsvp(eventId, userId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_rsvp', true)
      .limit(1)
    if (error) throw error
    return data && data.length > 0
  },

  // Analytics: sales summary per event for organizer
  async getOrganizerSummary(organizerId) {
    const { data, error } = await supabase
      .from('ticket_sales_summary')
      .select('*')
      .eq('organizer_id', organizerId)
    if (error) throw error
    return data || []
  },

  // Analytics: daily sales for organizer
  async getDailySales(organizerId) {
    const { data, error } = await supabase
      .from('daily_sales')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('sale_date', { ascending: true })
      .limit(30)
    if (error) throw error
    return data || []
  },

  // Get tickets for a specific event (organizer view)
  async getByEvent(eventId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('event_id', eventId)
      .order('purchased_at', { ascending: false })
    if (error) throw error
    return data || []
  }
}

export default TicketService
