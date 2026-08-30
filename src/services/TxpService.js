import { supabase } from '../lib/supabase'

const TxpService = {
  // ── Wallet ────────────────────────────────────────────────

  /** Get (or auto-create) the TXP wallet for a user */
  async getWallet(userId) {
    if (!userId) return null

    let { data, error } = await supabase
      .from('txp_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Auto-create on first access
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

  // ── Points ────────────────────────────────────────────────

  /**
   * Award points to a user.
   * @param {string}  userId
   * @param {string}  reason   - must match a txp_rules.action key
   * @param {object}  [metadata] - extra context (event_id, ticket_id, etc.)
   * @param {'available'|'pending'} [status='available']
   */
  async awardPoints(userId, reason, metadata = {}, status = 'available') {
    // Look up how many points this action is worth
    const rule = await this.getRule(reason)
    if (!rule || !rule.enabled) return null

    const amount = rule.points

    // Record the transaction
    const { data: txn, error: txnErr } = await supabase
      .from('txp_transactions')
      .insert([{
        user_id: userId,
        amount,
        type: 'credit',
        status,
        reason,
        metadata
      }])
      .select()
      .single()
    if (txnErr) throw txnErr

    // Update wallet totals
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

  /**
   * Debit (redeem) points from a user's available balance.
   * Returns the transaction or null if insufficient balance.
   */
  async redeemPoints(userId, amount, reason = 'redemption', metadata = {}) {
    const wallet = await this.getWallet(userId)
    if ((wallet.available || 0) < amount) return null // insufficient

    const { data: txn, error: txnErr } = await supabase
      .from('txp_transactions')
      .insert([{
        user_id: userId,
        amount: -amount,
        type: 'debit',
        status: 'available',
        reason,
        metadata
      }])
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

  /** Move pending points to available (e.g. after event completes) */
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

  // ── Transactions / History ────────────────────────────────

  /** Get point history for a user, newest first */
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

  /** Get all TXP rules */
  async getRules() {
    const { data, error } = await supabase
      .from('txp_rules')
      .select('*')
      .order('action')
    if (error) throw error
    return data || []
  },

  /** Get a single rule by action key */
  async getRule(action) {
    const { data, error } = await supabase
      .from('txp_rules')
      .select('*')
      .eq('action', action)
      .single()
    if (error) return null
    return data
  },

  /** Admin: update point value or enabled flag for a rule */
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

  /** Record a new referral (called at sign-up if a ref code is present) */
  async recordReferral(referrerId, refereeId) {
    if (referrerId === refereeId) return null

    const { data, error } = await supabase
      .from('txp_referrals')
      .insert([{ referrer_id: referrerId, referee_id: refereeId, status: 'pending' }])
      .select()
      .single()
    if (error) {
      // Duplicate pair is fine -- just return null
      if (error.code === '23505') return null
      throw error
    }
    return data
  },

  /** Complete a referral and award points to the referrer */
  async completeReferral(referrerId, refereeId) {
    const { data: ref, error: refErr } = await supabase
      .from('txp_referrals')
      .update({ status: 'completed', reward_claimed: true })
      .eq('referrer_id', referrerId)
      .eq('referee_id', refereeId)
      .eq('status', 'pending')
      .select()
      .single()
    if (refErr) return null

    // Award referral reward points
    await this.awardPoints(referrerId, 'referral_reward', { referee_id: refereeId })
    return ref
  },

  /** Get all referrals made by a user */
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

  /** Human-friendly label for a reason code */
  reasonLabel(reason) {
    const labels = {
      signup_bonus: 'Sign-up bonus',
      profile_complete: 'Profile completed',
      ticket_purchase: 'Ticket purchased',
      event_created: 'Event published',
      referral_reward: 'Referral reward',
      check_in: 'Event check-in',
      redemption: 'Points redeemed'
    }
    return labels[reason] || reason.replace(/_/g, ' ')
  }
}

export default TxpService
