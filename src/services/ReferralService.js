import { supabase } from '../lib/supabase'

const ReferralService = {
  // Generate a short unique referral code
  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  },

  // Get or create a referral link for a user + event
  async getOrCreateLink(eventId, userId) {
    // Check if one exists
    const { data: existing } = await supabase
      .from('referral_links')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (existing) return existing

    // Create new
    const referral_code = this.generateCode()
    const { data, error } = await supabase
      .from('referral_links')
      .insert([{ event_id: eventId, user_id: userId, referral_code }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Track a click on a referral link
  async trackClick(referralCode) {
    const { data: link } = await supabase
      .from('referral_links')
      .select('*')
      .eq('referral_code', referralCode)
      .single()

    if (link) {
      await supabase
        .from('referral_links')
        .update({ clicks: (link.clicks || 0) + 1 })
        .eq('id', link.id)
    }
    return link
  },

  // Record a commission when a ticket is purchased via referral
  async recordCommission({ referralLinkId, ticketId, eventId, referrerId, buyerId, ticketAmount }) {
    // Prevent self-referral
    if (referrerId === buyerId) return null

    const commissionAmount = ticketAmount * 0.025  // 2.5%
    const platformFee = ticketAmount * 0.075       // 7.5%
    const organizerRevenue = ticketAmount * 0.90   // 90%

    const { data, error } = await supabase
      .from('referral_commissions')
      .insert([{
        referral_link_id: referralLinkId,
        ticket_id: ticketId,
        event_id: eventId,
        referrer_id: referrerId,
        buyer_id: buyerId,
        ticket_amount: ticketAmount,
        commission_amount: commissionAmount,
        platform_fee: platformFee,
        organizer_revenue: organizerRevenue,
        status: 'confirmed'
      }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Get referral link by code
  async getByCode(code) {
    const { data, error } = await supabase
      .from('referral_links')
      .select('*')
      .eq('referral_code', code)
      .single()
    if (error) return null
    return data
  },

  // Get all referral links for a user (their reshares)
  async getUserLinks(userId) {
    const { data, error } = await supabase
      .from('referral_links')
      .select('*, events(title, image, date, reshare_enabled)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Get commissions earned by a user
  async getUserCommissions(userId) {
    const { data, error } = await supabase
      .from('referral_commissions')
      .select('*, events(title)')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Get referral stats for an event (organizer view)
  async getEventReferralStats(eventId) {
    const { data: links, error: linksErr } = await supabase
      .from('referral_links')
      .select('*')
      .eq('event_id', eventId)
    if (linksErr) throw linksErr

    const { data: commissions, error: commErr } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('event_id', eventId)
    if (commErr) throw commErr

    const totalPromoters = links?.length || 0
    const totalClicks = (links || []).reduce((sum, l) => sum + (l.clicks || 0), 0)
    const totalSales = commissions?.length || 0
    const totalRevenue = (commissions || []).reduce((sum, c) => sum + Number(c.ticket_amount || 0), 0)
    const totalCommissions = (commissions || []).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
    const netRevenue = (commissions || []).reduce((sum, c) => sum + Number(c.organizer_revenue || 0), 0)

    return {
      totalPromoters,
      totalClicks,
      totalSales,
      totalRevenue,
      totalCommissions,
      netRevenue,
      links: links || [],
      commissions: commissions || []
    }
  }
}

export default ReferralService
