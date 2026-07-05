import { supabase } from '../lib/supabase'

/**
 * NotificationService handles email notification preferences and
 * triggers for ticket confirmations, event reminders, and organizer alerts.
 *
 * Notifications are stored in a `notifications` table and preferences
 * in `notification_preferences`. If these tables don't exist yet,
 * methods will gracefully degrade.
 */
const NotificationService = {
  // ─── PREFERENCES ────────────────────────────────────────────

  async getPreferences(userId) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code === 'PGRST116') {
      // No row yet — return defaults
      return {
        user_id: userId,
        ticket_confirmation: true,
        event_reminders: true,
        reminder_hours_before: 24,
        organizer_new_ticket: true,
        organizer_daily_summary: false,
        marketing_updates: false,
      }
    }
    if (error) throw error
    return data
  },

  async updatePreferences(userId, prefs) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ─── IN-APP NOTIFICATIONS ──────────────────────────────────

  async getNotifications(userId, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') return []
      throw error
    }
    return data || []
  },

  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    if (error) throw error
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) throw error
  },

  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) return 0
    return count || 0
  },

  // ─── NOTIFICATION CREATORS ─────────────────────────────────

  async createTicketConfirmation({ userId, eventTitle, ticketCount, totalPrice }) {
    return this._create({
      user_id: userId,
      type: 'ticket_confirmation',
      title: 'Tickets Confirmed! 🎫',
      message: `You got ${ticketCount} ticket${ticketCount > 1 ? 's' : ''} for "${eventTitle}"${totalPrice > 0 ? ` — ₦${totalPrice.toLocaleString()}` : ' — Free'}`,
      data: { eventTitle, ticketCount, totalPrice }
    })
  },

  async createEventReminder({ userId, eventTitle, eventId, hoursUntil }) {
    return this._create({
      user_id: userId,
      type: 'event_reminder',
      title: 'Event Coming Up! ⏰',
      message: `"${eventTitle}" starts in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`,
      data: { eventTitle, eventId, hoursUntil }
    })
  },

  async createNewTicketSold({ userId, eventTitle, buyerName, tierName, amount }) {
    return this._create({
      user_id: userId,
      type: 'new_ticket_sold',
      title: 'New Ticket Sold! 💰',
      message: `${buyerName || 'Someone'} bought a ${tierName} ticket for "${eventTitle}"${amount > 0 ? ` — ₦${amount.toLocaleString()}` : ''}`,
      data: { eventTitle, buyerName, tierName, amount }
    })
  },

  async _create(notification) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ ...notification, read: false }])
        .select()
        .single()
      if (error) {
        console.warn('NotificationService: Could not create notification', error.message)
        return null
      }
      return data
    } catch {
      return null
    }
  },
}

export default NotificationService
