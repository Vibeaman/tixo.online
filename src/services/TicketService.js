import { supabase } from '../lib/supabase'

const TicketService = {
  // Single tier purchase (supports guest checkout)
  async purchase({ eventId, eventTitle, tierName, quantity, totalPrice, userId, guestName, guestEmail, referralCode, attendanceMode, isRsvp, attendeeName, paymentReference, paymentStatus, paymentChannel, paidAmount, registrationData }) {
    // Generate a unique 8-char check-in code
    const checkInCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

    const insertData = {
      event_id: eventId,
      event_title: eventTitle,
      tier_name: tierName,
      quantity,
      total_price: totalPrice,
      attendance_mode: attendanceMode || 'in-person',
      is_rsvp: isRsvp || false,
      check_in_code: checkInCode,
      checked_in: false,
      attendee_name: attendeeName || guestName || null,
      payment_reference: paymentReference || null,
      payment_status: paymentStatus || (totalPrice > 0 ? 'pending' : 'free'),
      payment_channel: paymentChannel || null,
      paid_amount: paidAmount || 0,
      registration_data: registrationData && Object.keys(registrationData).length > 0 ? registrationData : null
    }

    if (userId) {
      insertData.user_id = userId
    } else {
      insertData.user_id = null
      insertData.guest_name = guestName || null
      insertData.guest_email = guestEmail || null
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

  // Set approved status on tickets (for private virtual events)
  async setApproved(ticketId, approved) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ approved })
      .eq('id', ticketId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Bulk approve tickets
  async bulkApprove(ticketIds) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ approved: true })
      .in('id', ticketIds)
      .select()
    if (error) throw error
    return data
  },

  // Multi-tier purchase (cart checkout — supports guest checkout)
  // Each item can include an attendeeName for the individual ticket holder
  async purchaseMultiple({ eventId, eventTitle, items, userId, guestName, guestEmail, referralCode, attendanceMode, isRsvp, paymentReference, paymentStatus, paymentChannel, paidAmount, registrationData }) {
    const inserts = items.map(item => {
      const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

      const row = {
        event_id: eventId,
        event_title: eventTitle,
        tier_name: item.tierName,
        quantity: item.quantity,
        total_price: item.totalPrice,
        attendance_mode: attendanceMode || 'in-person',
        is_rsvp: isRsvp || false,
        check_in_code: code,
        checked_in: false,
        attendee_name: item.attendeeName || guestName || null,
        payment_reference: paymentReference || null,
        payment_status: paymentStatus || (item.totalPrice > 0 ? 'pending' : 'free'),
        payment_channel: paymentChannel || null,
        paid_amount: paidAmount || 0,
        registration_data: registrationData && Object.keys(registrationData).length > 0 ? registrationData : null,
        ...(referralCode ? { referral_code: referralCode } : {})
      }

      if (userId) {
        row.user_id = userId
      } else {
        row.user_id = null
        row.guest_name = guestName || null
        row.guest_email = guestEmail || null
      }

      return row
    })

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

  // ═══════ CHECK-IN METHODS ═══════

  // Look up ticket by check-in code
  async getByCheckInCode(code) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, events(*), profiles:user_id(full_name, avatar_url, email)')
      .eq('check_in_code', code.toUpperCase().trim())
      .single()
    if (error) throw error
    return data
  },

  // Mark ticket as checked in
  async checkIn(ticketId, checkedInBy) {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: checkedInBy
      })
      .eq('id', ticketId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Undo check-in
  async undoCheckIn(ticketId) {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        checked_in: false,
        checked_in_at: null,
        checked_in_by: null
      })
      .eq('id', ticketId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Get all attendees for an event (for organizer check-in view)
  async getEventAttendees(eventId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, profiles:user_id(full_name, avatar_url, email)')
      .eq('event_id', eventId)
      .order('purchased_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Get check-in stats for organizer's events
  async getCheckInStats(organizerId) {
    const { data, error } = await supabase
      .from('event_checkin_stats')
      .select('*')
      .eq('organizer_id', organizerId)
    if (error) throw error
    return data || []
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
  },

  // Transfer a ticket to another person
  async transferTicket(ticketId, recipientEmail, recipientName) {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        transferred_to_email: recipientEmail,
        transferred_to_name: recipientName,
        transferred_at: new Date().toISOString(),
        transfer_status: 'transferred'
      })
      .eq('id', ticketId)
      .select('*, events(*)')
      .single()
    if (error) throw error
    return data
  },

  // Look up tickets by payment reference
  async getByReference(reference) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('payment_reference', reference)
    if (error) throw error
    return data
  }
}

export default TicketService
