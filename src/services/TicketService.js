import { supabase } from '../lib/supabase'

const TicketService = {
  async purchase({ eventId, eventTitle, tierName, quantity, totalPrice, userId, referralCode }) {
    const insertData = {
      event_id: eventId,
      user_id: userId,
      event_title: eventTitle,
      tier_name: tierName,
      quantity,
      total_price: totalPrice
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

  async getByUser(userId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
    if (error) throw error
    return data
  }
}

export default TicketService
