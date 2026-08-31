import { supabase } from '../lib/supabase'

const TxpService = {
  // ── Wallet ────────────────────────────────────────────────

  /** Get (or auto-create) the TXP wallet for a user */
  async getWallet(userId) {
    if (!userId) return null

    let { data } = await supabase
      .from('txp_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!data) {
      const { data: created, error: createErr } = await supabase
        .from('txp_wallets')
        .insert([{ user_id: userId }])
        .select()
        .single()
      if (createErr) throw createErr
      data = created
    }
    return data
  },

  // ── Deduplication ─────────────────────────────────────────

  /**
   * Check if a user already earned points for a specific reason + scope.
   * Scope is built from metadata keys so "event_shared" + event_id = once per event.
   */
  async _alreadyAwarded(userId, reason, scopeKey) {
    const query = supabase
      .from('txp_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reason', reason)
      .eq('type', 'credit')

    if (scopeKey) {
      query.contains('metadata', scopeKey)
    }

    const { count } = await query
    return (count || 0) > 0
  },

  // ── Core Award (internal) ─────────────────────────────────

  async _award(userId, amount, reason, metadata = {}, status = 'available') {
    if (amount <= 0) return null

    const { data: txn, error: txnErr } = await supabase
      .from('txp_transactions')
      .insert([{ user_id: userId, amount, type: 'credit', status, reason, metadata }])
      .select()
      .single()
    if (txnErr) throw txnErr

    const wallet = await this.getWallet(userId)
    const update = {
      lifetime_earned: (wallet.lifetime_earned || 0) + amount,
      updated_at: new Date().toISOString()
    }
    if (status === 'available') {
      update.available = (wallet.available || 0) + amount
    } else {
      update.pending = (wallet.pending || 0) + amount
    }

    const { error: walletErr } = await supabase
      .from('txp_wallets')
      .update(update)
      .eq('user_id', userId)
    if (walletErr) throw walletErr

    return txn
  },

  // ── Action-Specific Award Methods ────────────────────────

  /** Account created: 50 TXP (available, once) */
  async onAccountCreated(userId) {
    if (await this._alreadyAwarded(userId, 'signup_bonus')) return null
    const rule = await this.getRule('signup_bonus')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'signup_bonus')
  },

  /** KYC completed: 100 TXP (available, once) */
  async onKycCompleted(userId) {
    if (await this._alreadyAwarded(userId, 'kyc_completed')) return null
    const rule = await this.getRule('kyc_completed')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'kyc_completed')
  },

  /** Profile completed: 50 TXP (available, once) */
  async onProfileCompleted(userId) {
    if (await this._alreadyAwarded(userId, 'profile_complete')) return null
    const rule = await this.getRule('profile_complete')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'profile_complete')
  },

  /** Event created (draft saved): 200 TXP (available, once per event) */
  async onEventCreated(userId, eventId) {
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'event_created', scope)) return null
    const rule = await this.getRule('event_created')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'event_created', scope)
  },

  /** Event published: 100 TXP (available, once per event) */
  async onEventPublished(userId, eventId) {
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'event_published', scope)) return null
    const rule = await this.getRule('event_published')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'event_published', scope)
  },

  /** Event shared (unique): 10 TXP (available, once per user per event) */
  async onEventShared(userId, eventId) {
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'event_shared', scope)) return null
    const rule = await this.getRule('event_shared')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'event_shared', scope)
  },

  /**
   * Ticket purchased: 1 TXP per 100 naira spent (pending).
   * Released when event is confirmed and no refund issued.
   */
  async onTicketPurchased(userId, ticketId, amountNaira) {
    const rule = await this.getRule('ticket_purchase')
    if (!rule?.enabled) return null
    const points = Math.floor(amountNaira / 100) * rule.points
    if (points <= 0) return null
    return this._award(userId, points, 'ticket_purchase', { ticket_id: ticketId, amount_naira: amountNaira }, 'pending')
  },

  /** Event attended (check-in): 50 TXP (available, once per event) */
  async onEventAttended(userId, eventId) {
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'event_attended', scope)) return null
    const rule = await this.getRule('event_attended')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'event_attended', scope)
  },

  /** Review submitted: 25 TXP (available, once per event) */
  async onReviewSubmitted(userId, eventId) {
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'review_submitted', scope)) return null
    const rule = await this.getRule('review_submitted')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'review_submitted', scope)
  },

  /** Referral registered: 100 TXP (pending) to referrer */
  async onReferralRegistered(referrerId, refereeId) {
    if (referrerId === refereeId) return null

    const { data: ref, error } = await supabase
      .from('txp_referrals')
      .insert([{ referrer_id: referrerId, referee_id: refereeId, status: 'pending' }])
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return null
      throw error
    }

    const rule = await this.getRule('referral_registered')
    if (!rule?.enabled) return ref
    await this._award(referrerId, rule.points, 'referral_registered', { referee_id: refereeId }, 'pending')
    return ref
  },

  /** Referral first purchase: 250 TXP (available) to referrer, releases pending 100 */
  async onReferralFirstPurchase(referrerId, refereeId) {
    const { data: ref } = await supabase
      .from('txp_referrals')
      .select('*')
      .eq('referrer_id', referrerId)
      .eq('referee_id', refereeId)
      .single()

    if (!ref || ref.reward_claimed) return null

    await supabase
      .from('txp_referrals')
      .update({ status: 'completed', reward_claimed: true })
      .eq('id', ref.id)

    const regRule = await this.getRule('referral_registered')
    if (regRule) {
      await this.releasePending(referrerId, regRule.points)
    }

    const rule = await this.getRule('referral_first_purchase')
    if (!rule?.enabled) return ref
    await this._award(referrerId, rule.points, 'referral_first_purchase', { referee_id: refereeId })
    return ref
  },

  // ── Pending → Available Promotion ────────────────────────

  async releasePending(userId, amount) {
    const wallet = await this.getWallet(userId)
    const movable = Math.min(amount, wallet.pending || 0)
    if (movable <= 0) return null

    const { error } = await supabase
      .from('txp_wallets')
      .update({
        pending: (wallet.pending || 0) - movable,
        available: (wallet.available || 0) + movable,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    if (error) throw error
    return movable
  },

  /**
   * Release all pending ticket-purchase points for a given event.
   * Call when the event is confirmed and refund window has passed.
   */
  async releaseEventTicketPoints(eventId) {
    const { data: txns } = await supabase
      .from('txp_transactions')
      .select('user_id, amount')
      .eq('reason', 'ticket_purchase')
      .eq('status', 'pending')
      .contains('metadata', { event_id: eventId })

    if (!txns?.length) return 0

    let released = 0
    for (const txn of txns) {
      await supabase
        .from('txp_transactions')
        .update({ status: 'available' })
        .eq('user_id', txn.user_id)
        .eq('reason', 'ticket_purchase')
        .eq('status', 'pending')
        .contains('metadata', { event_id: eventId })

      const moved = await this.releasePending(txn.user_id, txn.amount)
      released += moved || 0
    }
    return released
  },

  // ── Redeem ────────────────────────────────────────────────

  async redeemPoints(userId, amount, reason = 'redemption', metadata = {}) {
    const wallet = await this.getWallet(userId)
    if ((wallet.available || 0) < amount) return null

    const { data: txn, error: txnErr } = await supabase
      .from('txp_transactions')
      .insert([{ user_id: userId, amount: -amount, type: 'debit', status: 'available', reason, metadata }])
      .select()
      .single()
    if (txnErr) throw txnErr

    const { error: walletErr } = await supabase
      .from('txp_wallets')
      .update({
        available: (wallet.available || 0) - amount,
        lifetime_redeemed: (wallet.lifetime_redeemed || 0) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    if (walletErr) throw walletErr

    return txn
  },

  // ── Transactions / History ────────────────────────────────

  async getHistory(userId, limit = 50) {
    const { data, error } = await supabase
      .from('txp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },

  // ── Rules ─────────────────────────────────────────────────

  async getRules() {
    const { data, error } = await supabase
      .from('txp_rules')
      .select('*')
      .order('action')
    if (error) throw error
    return data || []
  },

  async getRule(action) {
    const { data, error } = await supabase
      .from('txp_rules')
      .select('*')
      .eq('action', action)
      .single()
    if (error) return null
    return data
  },

  async updateRule(action, updates) {
    const { data, error } = await supabase
      .from('txp_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('action', action)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── Referrals ─────────────────────────────────────────────

  async getUserReferrals(userId) {
    const { data, error } = await supabase
      .from('txp_referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ── Helpers ───────────────────────────────────────────────

  reasonLabel(reason) {
    const labels = {
      signup_bonus: 'Sign-up bonus',
      kyc_completed: 'KYC completed',
      profile_complete: 'Profile completed',
      event_created: 'Event created',
      event_published: 'Event published',
      event_shared: 'Event shared',
      ticket_purchase: 'Ticket purchased',
      event_attended: 'Event attended',
      review_submitted: 'Review submitted',
      referral_registered: 'Referral signed up',
      referral_first_purchase: 'Referral first purchase',
      redemption: 'Points redeemed'
    }
    return labels[reason] || reason.replace(/_/g, ' ')
  }
}

export default TxpService
