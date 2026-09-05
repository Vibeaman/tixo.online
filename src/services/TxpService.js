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
      .insert([{ referrer_id: referrerId, referee_id: refereeId, status: 'pending', points_awarded: 0 }])
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return null
      throw error
    }

    const rule = await this.getRule('referral_registered')
    if (!rule?.enabled) return ref
    await this._award(referrerId, rule.points, 'referral_registered', { referee_id: refereeId }, 'pending')

    const { data: updated } = await supabase
      .from('txp_referrals')
      .update({ points_awarded: rule.points })
      .eq('id', ref.id)
      .select()
      .single()

    return updated || ref
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

    const regRule = await this.getRule('referral_registered')
    if (regRule) {
      await this.releasePending(referrerId, regRule.points)
    }

    const rule = await this.getRule('referral_first_purchase')
    const bonusPoints = rule?.enabled ? rule.points : 0
    if (bonusPoints > 0) {
      await this._award(referrerId, bonusPoints, 'referral_first_purchase', { referee_id: refereeId })
    }

    const { data: updated } = await supabase
      .from('txp_referrals')
      .update({
        status: 'completed',
        reward_claimed: true,
        points_awarded: (ref.points_awarded || 0) + bonusPoints,
        completed_at: new Date().toISOString()
      })
      .eq('id', ref.id)
      .select()
      .single()

    // Phase 3D: check if this completion pushed the referrer past any campaign milestones
    try {
      await this.checkAndAutoClaimCampaigns(referrerId)
    } catch (err) {
      console.error('checkAndAutoClaimCampaigns failed:', err)
    }

    return updated || ref
  },

  // ── Referral Campaigns (Phase 3D) ─────────────────────────

  /** Fetch all currently active referral campaigns */
  async getActiveCampaigns() {
    const { data, error } = await supabase
      .from('referral_campaigns')
      .select('*')
      .eq('is_active', true)
      .order('milestone_count')
    if (error) throw error
    return data || []
  },

  /** Count a user's completed referrals */
  async _countCompletedReferrals(userId) {
    const { count, error } = await supabase
      .from('txp_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .eq('status', 'completed')
    if (error) throw error
    return count || 0
  },

  /** Check if a user has already claimed a given campaign's bonus */
  async _hasClaimedCampaign(userId, campaignId) {
    const { data, error } = await supabase
      .from('referral_campaign_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
      .maybeSingle()
    if (error) return false
    return !!data
  },

  /**
   * For each active campaign, return the user's progress:
   * campaign info + completedReferrals count + alreadyClaimed boolean
   */
  async getUserCampaignProgress(userId) {
    if (!userId) return []

    const campaigns = await this.getActiveCampaigns()
    if (!campaigns.length) return []

    const completedReferrals = await this._countCompletedReferrals(userId)

    const { data: claims } = await supabase
      .from('referral_campaign_claims')
      .select('campaign_id')
      .eq('user_id', userId)

    const claimedIds = new Set((claims || []).map(c => c.campaign_id))

    return campaigns.map(campaign => ({
      campaign,
      completedReferrals,
      alreadyClaimed: claimedIds.has(campaign.id)
    }))
  },

  /**
   * Claim a campaign's bonus for a user.
   * Verifies eligibility (active campaign, enough completed referrals, not already claimed),
   * then inserts the claim record and awards the bonus points.
   */
  async claimCampaignBonus(userId, campaignId) {
    if (!userId || !campaignId) return { success: false, error: 'Missing user or campaign' }

    const { data: campaign, error: campaignErr } = await supabase
      .from('referral_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('is_active', true)
      .single()

    if (campaignErr || !campaign) {
      return { success: false, error: 'Campaign not found or inactive' }
    }

    const completedReferrals = await this._countCompletedReferrals(userId)
    if (completedReferrals < campaign.milestone_count) {
      return { success: false, error: 'Milestone not yet reached' }
    }

    const alreadyClaimed = await this._hasClaimedCampaign(userId, campaignId)
    if (alreadyClaimed) {
      return { success: false, error: 'Bonus already claimed' }
    }

    const { error: claimErr } = await supabase
      .from('referral_campaign_claims')
      .insert([{ user_id: userId, campaign_id: campaignId, points_awarded: campaign.bonus_points }])

    if (claimErr) {
      if (claimErr.code === '23505') {
        return { success: false, error: 'Bonus already claimed' }
      }
      throw claimErr
    }

    await this._award(userId, campaign.bonus_points, 'referral_campaign_bonus', { campaign_id: campaignId, campaign_name: campaign.name })

    return { success: true, campaign, pointsAwarded: campaign.bonus_points }
  },

  /**
   * Called after onReferralFirstPurchase completes.
   * Checks all active campaigns and auto-claims any the user has newly become eligible for.
   */
  async checkAndAutoClaimCampaigns(userId) {
    if (!userId) return []

    const campaigns = await this.getActiveCampaigns()
    if (!campaigns.length) return []

    const completedReferrals = await this._countCompletedReferrals(userId)
    const claimedResults = []

    for (const campaign of campaigns) {
      if (completedReferrals < campaign.milestone_count) continue

      const alreadyClaimed = await this._hasClaimedCampaign(userId, campaign.id)
      if (alreadyClaimed) continue

      const result = await this.claimCampaignBonus(userId, campaign.id)
      if (result.success) claimedResults.push(result)
    }

    return claimedResults
  },

  /**
   * Called after a ticket purchase is confirmed (e.g. Paystack payment verified).
   * If this buyer was referred and hasn't triggered the first-purchase bonus yet,
   * releases the referrer's pending 100 TXP and awards the 250 TXP bonus.
   */
  async completeReferralOnFirstPurchase(refereeId) {
    if (!refereeId) return null

    const { data: pending } = await supabase
      .from('txp_referrals')
      .select('*')
      .eq('referee_id', refereeId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()

    if (!pending) return null

    return this.onReferralFirstPurchase(pending.referrer_id, refereeId)
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

  // ── Redeem (generic, legacy signature retained for compatibility) ────

  async _redeemGeneric(userId, amount, reason = 'redemption', metadata = {}) {
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

  // ── Phase 5: Pay with TXP at Checkout ─────────────────────

  /** Fetch admin-configurable redemption settings (rate + max %) */
  async getRedemptionSettings() {
    const { data, error } = await supabase
      .from('txp_settings')
      .select('key, value')
      .in('key', ['redemption_rate', 'max_txp_percentage'])
    if (error) throw error

    const map = {}
    ;(data || []).forEach(row => { map[row.key] = row.value })

    return {
      redemptionRate: Number(map.redemption_rate ?? 100),
      maxTxpPercentage: Number(map.max_txp_percentage ?? 100)
    }
  },

  /**
   * Pure calculation of how much TXP can be applied to a given order total.
   * redemptionRate = TXP per ₦100 (e.g. 100 TXP = ₦100 → 1 TXP = ₦1)
   */
  calculateRedemption(totalNaira, availableTxp, settings) {
    const redemptionRate = settings?.redemptionRate || 100
    const maxTxpPercentage = settings?.maxTxpPercentage ?? 100

    const maxTxpNaira = totalNaira * (maxTxpPercentage / 100)
    const txpToNaira = (availableTxp || 0) * (redemptionRate / 100)
    const txpNairaToUse = Math.max(0, Math.min(maxTxpNaira, txpToNaira, totalNaira))
    const txpToDeduct = txpNairaToUse > 0 ? Math.ceil(txpNairaToUse * (100 / redemptionRate)) : 0
    const remainingToPay = Math.max(0, totalNaira - txpNairaToUse)
    const coversFull = remainingToPay <= 0

    return { maxTxpNaira, txpToNaira, txpNairaToUse, txpToDeduct, remainingToPay, coversFull }
  },

  /**
   * Deduct TXP for a ticket purchase (partial or full redemption at checkout).
   * Records a debit transaction + a txp_redemptions row for audit/refund purposes.
   */
  async redeemPoints(userId, txpAmount, nairaEquivalent, originalTotal, remainingPaid, ticketIds = []) {
    if (!userId || !txpAmount || txpAmount <= 0) return null

    const wallet = await this.getWallet(userId)
    if ((wallet.available || 0) < txpAmount) throw new Error('Insufficient TXP balance')

    const metadata = {
      naira_equivalent: nairaEquivalent,
      original_total: originalTotal,
      remaining_paid: remainingPaid,
      ticket_ids: ticketIds || []
    }

    const { data: txn, error: txnErr } = await supabase
      .from('txp_transactions')
      .insert([{ user_id: userId, amount: -txpAmount, type: 'debit', status: 'available', reason: 'ticket_redemption', metadata }])
      .select()
      .single()
    if (txnErr) throw txnErr

    const { error: walletErr } = await supabase
      .from('txp_wallets')
      .update({
        available: (wallet.available || 0) - txpAmount,
        lifetime_redeemed: (wallet.lifetime_redeemed || 0) + txpAmount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    if (walletErr) throw walletErr

    const { data: redemption, error: redemptionErr } = await supabase
      .from('txp_redemptions')
      .insert([{
        user_id: userId,
        ticket_ids: ticketIds || [],
        txp_amount: txpAmount,
        naira_equivalent: nairaEquivalent,
        original_total: originalTotal,
        remaining_paid: remainingPaid,
        status: 'completed'
      }])
      .select()
      .single()
    if (redemptionErr) throw redemptionErr

    return redemption
  },

  /** Attach the final created ticket IDs to a redemption row once tickets exist */
  async attachRedemptionTickets(redemptionId, ticketIds) {
    if (!redemptionId || !ticketIds?.length) return null
    const { error } = await supabase
      .from('txp_redemptions')
      .update({ ticket_ids: ticketIds })
      .eq('id', redemptionId)
    if (error) throw error
    return true
  },

  /**
   * Reverse a TXP redemption (e.g. when a ticket is refunded).
   * Credits the TXP back to the user's wallet and marks the redemption reversed.
   */
  async reverseRedemption(redemptionId) {
    const { data: redemption, error } = await supabase
      .from('txp_redemptions')
      .select('*')
      .eq('id', redemptionId)
      .single()
    if (error) throw error
    if (!redemption || redemption.status === 'reversed') return null

    await this._award(redemption.user_id, redemption.txp_amount, 'redemption_reversed', { redemption_id: redemptionId })

    const { data: updated, error: updateErr } = await supabase
      .from('txp_redemptions')
      .update({ status: 'reversed' })
      .eq('id', redemptionId)
      .select()
      .single()
    if (updateErr) throw updateErr

    return updated
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

  /** Generate a unique 8-char referral code */
  _generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  },

  /** Get or create the user's personal referral code */
  async getOrCreateReferralCode(userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single()

    if (profile?.referral_code) return profile.referral_code

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this._generateReferralCode()
      const { error } = await supabase
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', userId)
      if (!error) return code
      if (error.code !== '23505') throw error
    }
    throw new Error('Failed to generate unique referral code')
  },

  /** Look up a user by their referral code */
  async getUserByReferralCode(code) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('referral_code', code)
      .single()
    if (error) return null
    return data
  },

  async getUserReferrals(userId) {
    const { data, error } = await supabase
      .from('txp_referrals')
      .select('*, referee:profiles!referee_id(full_name, email)')
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
      referral_campaign_bonus: 'Referral campaign bonus',
      redemption: 'Points redeemed',
      ticket_redemption: 'Paid with Tixo Points',
      redemption_reversed: 'Points refunded'
    }
    return labels[reason] || reason.replace(/_/g, ' ')
  }
}

export default TxpService
