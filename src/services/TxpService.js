import { supabase } from '../lib/supabase'

// ── Phase 9: Tier definitions ──────────────────────────────
// Lifetime-earned thresholds that determine a user's TXP tier.
const TXP_TIERS = [
  { name: 'Explorer', emoji: '🌍', color: 'text-gray-300', min: 0, max: 999 },
  { name: 'Insider', emoji: '⭐', color: 'text-blue-300', min: 1000, max: 4999 },
  { name: 'VIP', emoji: '💎', color: 'text-purple-300', min: 5000, max: 9999 },
  { name: 'Elite', emoji: '👑', color: 'text-yellow-300', min: 10000, max: Infinity },
]

// Perks unlocked at each tier
const TXP_TIER_PERKS = {
  Explorer: ['Access to basic events'],
  Insider: ['5% bonus TXP on purchases', 'Early access to event announcements'],
  VIP: ['10% bonus TXP on purchases', 'Priority event access', 'Exclusive VIP events'],
  Elite: ['15% bonus TXP on purchases', 'Priority access to all events', 'Exclusive Elite events', 'Personal event recommendations'],
}

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
  /** Public wrapper: has this user ever earned TXP for a given reason? */
  async hasEarnedReason(userId, reason) {
    return this._alreadyAwarded(userId, reason)
  },

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
    if (await this._isWalletFrozen(userId)) return null
    if (await this._alreadyAwarded(userId, 'signup_bonus')) return null
    if (await this._isRateLimited(userId, 'signup_bonus')) {
      await this._flag(userId, 'rate_limit_hit', 'low', 'Daily earning cap reached for signup_bonus', { reason: 'signup_bonus' })
      return null
    }
    const rule = await this.getRule('signup_bonus')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'signup_bonus')
  },

  /** KYC completed: 100 TXP (available, once) */
  async onKycCompleted(userId) {
    if (await this._isWalletFrozen(userId)) return null
    if (await this._alreadyAwarded(userId, 'kyc_completed')) return null
    if (await this._isRateLimited(userId, 'kyc_completed')) {
      await this._flag(userId, 'rate_limit_hit', 'low', 'Daily earning cap reached for kyc_completed', { reason: 'kyc_completed' })
      return null
    }
    const rule = await this.getRule('kyc_completed')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'kyc_completed')
  },

  /** Profile completed: 50 TXP (available, once) */
  async onProfileCompleted(userId) {
    if (await this._isWalletFrozen(userId)) return null
    if (await this._alreadyAwarded(userId, 'profile_complete')) return null
    if (await this._isRateLimited(userId, 'profile_complete')) {
      await this._flag(userId, 'rate_limit_hit', 'low', 'Daily earning cap reached for profile_complete', { reason: 'profile_complete' })
      return null
    }
    const rule = await this.getRule('profile_complete')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'profile_complete')
  },

  /** Event created (draft saved): 200 TXP (available, once per event) */
  async onEventCreated(userId, eventId) {
    if (await this._isWalletFrozen(userId)) return null
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'event_created', scope)) return null
    if (await this._isRateLimited(userId, 'event_created')) {
      await this._flag(userId, 'rate_limit_hit', 'low', 'Daily earning cap reached for event_created', { reason: 'event_created' })
      return null
    }
    const rule = await this.getRule('event_created')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'event_created', scope)
  },

  /** Event published: 100 TXP (available, once per event) */
  async onEventPublished(userId, eventId) {
    if (await this._isWalletFrozen(userId)) return null
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'event_published', scope)) return null
    if (await this._isRateLimited(userId, 'event_published')) {
      await this._flag(userId, 'rate_limit_hit', 'low', 'Daily earning cap reached for event_published', { reason: 'event_published' })
      return null
    }
    const rule = await this.getRule('event_published')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'event_published', scope)
  },

  /** Event shared (unique): 10 TXP (available, once per user per event) */
  async onEventShared(userId, eventId) {
    if (await this._isWalletFrozen(userId)) return null
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'event_shared', scope)) return null
    if (await this._isRateLimited(userId, 'event_shared')) {
      await this._flag(userId, 'rate_limit_hit', 'low', 'Daily earning cap reached for event_shared', { reason: 'event_shared' })
      return null
    }
    const rule = await this.getRule('event_shared')
    if (!rule?.enabled) return null
    const txn = await this._award(userId, rule.points, 'event_shared', scope)

    // Phase 10: flag rapid-share abuse (more than 8 shares registered in 1 hour)
    try {
      const count = await this._countSharesInWindow(userId, 1)
      if (count > 8) {
        await this._flag(userId, 'rapid_shares', 'medium', 'More than 8 event shares in 1 hour', { count })
      }
    } catch (err) {
      console.error('rapid_shares flag check failed:', err)
    }

    return txn
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
    if (await this._isWalletFrozen(userId)) return null
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'event_attended', scope)) return null
    if (await this._isRateLimited(userId, 'event_attended')) {
      await this._flag(userId, 'rate_limit_hit', 'low', 'Daily earning cap reached for event_attended', { reason: 'event_attended' })
      return null
    }
    const rule = await this.getRule('event_attended')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'event_attended', scope)
  },

  /** Review submitted: 25 TXP (available, once per event) */
  async onReviewSubmitted(userId, eventId) {
    if (await this._isWalletFrozen(userId)) return null
    const scope = { event_id: eventId }
    if (await this._alreadyAwarded(userId, 'review_submitted', scope)) return null
    if (await this._isRateLimited(userId, 'review_submitted')) {
      await this._flag(userId, 'rate_limit_hit', 'low', 'Daily earning cap reached for review_submitted', { reason: 'review_submitted' })
      return null
    }
    const rule = await this.getRule('review_submitted')
    if (!rule?.enabled) return null
    return this._award(userId, rule.points, 'review_submitted', scope)
  },

  /** Referral registered: 100 TXP (pending) to referrer */
  async onReferralRegistered(referrerId, refereeId) {
    if (referrerId === refereeId) return null
    if (await this._isWalletFrozen(referrerId)) return null

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

    if (await this._isRateLimited(referrerId, 'referral_registered')) {
      await this._flag(referrerId, 'rate_limit_hit', 'low', 'Daily earning cap reached for referral_registered', { reason: 'referral_registered' })
      return null
    }

    await this._award(referrerId, rule.points, 'referral_registered', { referee_id: refereeId }, 'pending')

    const { data: updated } = await supabase
      .from('txp_referrals')
      .update({ points_awarded: rule.points })
      .eq('id', ref.id)
      .select()
      .single()

    // Phase 10: flag mass-referral abuse (more than 5 referrals registered in 24h)
    try {
      const count = await this._countReferralsInWindow(referrerId, 24)
      if (count > 5) {
        await this._flag(referrerId, 'mass_referrals', 'medium', 'More than 5 referrals registered in 24 hours', { count })
      }
    } catch (err) {
      console.error('mass_referrals flag check failed:', err)
    }

    return updated || ref
  },

  /** Referral first purchase: 250 TXP (available) to referrer, releases pending 100 */
  async onReferralFirstPurchase(referrerId, refereeId) {
    if (await this._isWalletFrozen(referrerId)) return null
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
    if (await this._isWalletFrozen(userId)) return { success: false, error: 'Wallet is frozen' }

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

  /**
   * Attribute the signed-in user's account to whoever owns `code`.
   *
   * This MUST go through the register_referral() SECURITY DEFINER function.
   * The rows involved (txp_referrals, txp_transactions, txp_wallets) all belong
   * to the *referrer*, and row-level security rightly stops the referee's
   * browser from writing another user's rows -- which is exactly why the old
   * client-side path failed silently on every referral.
   *
   * Returns { ok, reason? }. `ok: false` with a terminal reason means the code
   * should be discarded; a thrown error means "try again later".
   */
  async registerReferralByCode(code) {
    const { data, error } = await supabase.rpc('register_referral', { p_code: code })
    if (error) throw error
    return data || { ok: false, reason: 'unknown' }
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
    // NOTE: txp_referrals.referee_id references auth.users(id), not
    // public.profiles, so PostgREST cannot auto-embed profiles via a
    // `profiles!referee_id` foreign-key join (it errors: "could not find
    // a relationship"). Fetch referrals and profiles separately and merge.
    const { data, error } = await supabase
      .from('txp_referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error

    const referrals = data || []
    if (referrals.length === 0) return referrals

    const refereeIds = [...new Set(referrals.map(r => r.referee_id).filter(Boolean))]
    let profilesById = {}
    if (refereeIds.length > 0) {
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', refereeIds)
      if (!profilesErr) {
        profilesById = Object.fromEntries((profiles || []).map(p => [p.id, p]))
      }
    }

    return referrals.map(r => ({
      ...r,
      referee: profilesById[r.referee_id]
        ? { full_name: profilesById[r.referee_id].full_name, email: profilesById[r.referee_id].email }
        : null,
    }))
  },

  // ── Admin: Rules ──────────────────────────────────────────

  /** Fetch every txp_rule (admin view — includes disabled rules) */
  async getAllRules() {
    const { data, error } = await supabase
      .from('txp_rules')
      .select('*')
      .order('action')
    if (error) throw error
    return data || []
  },

  /** Update a txp_rule by its row id (admin) */
  async updateRuleById(id, updates) {
    const { data, error } = await supabase
      .from('txp_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── Admin: Settings ───────────────────────────────────────

  /** Fetch every txp_setting row (admin view) */
  async getAllSettings() {
    const { data, error } = await supabase
      .from('txp_settings')
      .select('*')
      .order('key')
    if (error) throw error
    return data || []
  },

  /** Upsert a single setting by key */
  async upsertSetting(key, value, description) {
    const payload = { key, value: String(value), updated_at: new Date().toISOString() }
    if (description !== undefined) payload.description = description

    const { data, error } = await supabase
      .from('txp_settings')
      .upsert([payload], { onConflict: 'key' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── Admin: User Wallets ───────────────────────────────────

  /** Search profiles by name/email and attach their TXP wallet balances */
  async searchUsers(query) {
    let profileQuery = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    const q = (query || '').trim()
    if (q) {
      profileQuery = profileQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
    }

    const { data: profiles, error } = await profileQuery
    if (error) throw error
    if (!profiles?.length) return []

    const ids = profiles.map(p => p.id)
    const { data: wallets } = await supabase
      .from('txp_wallets')
      .select('*')
      .in('user_id', ids)

    const walletByUser = {}
    ;(wallets || []).forEach(w => { walletByUser[w.user_id] = w })

    return profiles.map(p => ({
      ...p,
      wallet: walletByUser[p.id] || { available: 0, pending: 0, lifetime_earned: 0, lifetime_redeemed: 0 }
    }))
  },

  /** Fetch a user's transaction ledger (admin view) */
  async getUserTransactions(userId, limit = 50) {
    const { data, error } = await supabase
      .from('txp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },

  /** Admin: manually award TXP to a user (available immediately) */
  async adminAward(userId, amount, reason) {
    const amt = Math.abs(Number(amount) || 0)
    if (!userId || amt <= 0) throw new Error('Invalid user or amount')
    return this._award(userId, amt, 'admin_award', { note: reason || '' }, 'available')
  },

  /** Admin: manually deduct TXP from a user's available balance */
  async adminDeduct(userId, amount, reason) {
    const amt = Math.abs(Number(amount) || 0)
    if (!userId || amt <= 0) throw new Error('Invalid user or amount')

    const wallet = await this.getWallet(userId)

    const { data: txn, error: txnErr } = await supabase
      .from('txp_transactions')
      .insert([{
        user_id: userId,
        amount: -amt,
        type: 'debit',
        status: 'available',
        reason: 'admin_deduct',
        metadata: { note: reason || '' }
      }])
      .select()
      .single()
    if (txnErr) throw txnErr

    const { error: walletErr } = await supabase
      .from('txp_wallets')
      .update({
        available: (wallet.available || 0) - amt,
        lifetime_redeemed: (wallet.lifetime_redeemed || 0) + amt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    if (walletErr) throw walletErr

    return txn
  },

  // ── Admin: Referral Campaigns ─────────────────────────────

  /** Fetch every referral campaign (active + inactive) */
  async getAllCampaigns() {
    const { data, error } = await supabase
      .from('referral_campaigns')
      .select('*')
      .order('milestone_count')
    if (error) throw error
    return data || []
  },

  async createCampaign(data) {
    const { data: created, error } = await supabase
      .from('referral_campaigns')
      .insert([data])
      .select()
      .single()
    if (error) throw error
    return created
  },

  async updateCampaign(id, data) {
    const { data: updated, error } = await supabase
      .from('referral_campaigns')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated
  },

  async deleteCampaign(id) {
    const { error } = await supabase
      .from('referral_campaigns')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  },

  // ── Phase 11: Partner Campaigns ───────────────────────────

  /** Generate a random webhook secret token for a new partner campaign */
  _generateWebhookSecret() {
    const bytes = new Uint8Array(24)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes)
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
    }
    return 'whsec_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  },

  /**
   * Fetch active partner campaigns currently within their start/end window,
   * for public display (e.g. Ways to Earn). Never selects webhook_secret.
   */
  async getActivePartnerCampaigns() {
    const { data, error } = await supabase
      .from('txp_campaigns')
      .select('id, name, description, reward_amount, trigger_action, partner_name, start_date, end_date, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error

    const now = new Date()
    return (data || []).filter(c => {
      const startOk = !c.start_date || new Date(c.start_date) <= now
      const endOk = !c.end_date || new Date(c.end_date) >= now
      return startOk && endOk
    })
  },

  /** Admin: fetch every partner campaign (active + inactive, includes webhook_secret) */
  async getAllPartnerCampaigns() {
    const { data, error } = await supabase
      .from('txp_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  /** Admin: create a partner campaign, auto-generating a webhook_secret if one isn't supplied */
  async createPartnerCampaign(data) {
    const payload = { ...data }
    if (!payload.webhook_secret) payload.webhook_secret = this._generateWebhookSecret()

    const { data: created, error } = await supabase
      .from('txp_campaigns')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    return created
  },

  /** Admin: update a partner campaign's fields (name, dates, reward, is_active, etc.) */
  async updatePartnerCampaign(id, data) {
    const { data: updated, error } = await supabase
      .from('txp_campaigns')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated
  },

  /** Admin: rotate a campaign's webhook_secret (e.g. if it leaked) */
  async regeneratePartnerCampaignSecret(id) {
    return this.updatePartnerCampaign(id, { webhook_secret: this._generateWebhookSecret() })
  },

  /** Webhook: look up a campaign by its webhook_secret (used to authenticate partner calls) */
  async getCampaignByWebhookSecret(secret) {
    if (!secret) return null
    const { data, error } = await supabase
      .from('txp_campaigns')
      .select('*')
      .eq('webhook_secret', secret)
      .maybeSingle()
    if (error) return null
    return data
  },

  /**
   * Webhook: resolve a partner's user_identifier (email or Tixo user UUID) to a profile.
   * Mirrors the lookup style of getUserByReferralCode -- a simple profiles query,
   * no separate auth.users access needed since profiles carries id + email.
   */
  async findUserByIdentifier(identifier) {
    if (!identifier) return null
    const value = String(identifier).trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

    const query = supabase.from('profiles').select('id, full_name, email')
    const { data, error } = isUuid
      ? await query.eq('id', value).maybeSingle()
      : await query.ilike('email', value).maybeSingle()

    if (error) return null
    return data
  },

  /**
   * Webhook: award a campaign's reward_amount TXP to a user, recording a
   * txp_campaign_claims row for idempotency. If a claim already exists for
   * this (campaign_id, external_reference) pair, returns alreadyClaimed:true
   * without awarding again. Reuses the same _award() ledger primitive every
   * other earning method in this file uses, so this stays consistent with
   * the rest of the wallet/ledger system rather than mutating balances directly.
   */
  async awardPartnerCampaignClaim(campaign, userId, externalReference = null) {
    if (!campaign?.id || !userId) throw new Error('Missing campaign or user')

    if (externalReference) {
      const { data: existing } = await supabase
        .from('txp_campaign_claims')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('external_reference', externalReference)
        .maybeSingle()
      if (existing) return { alreadyClaimed: true, claim: existing }
    }

    const { data: claim, error: claimErr } = await supabase
      .from('txp_campaign_claims')
      .insert([{
        campaign_id: campaign.id,
        user_id: userId,
        external_reference: externalReference || null,
        awarded_txp: campaign.reward_amount,
      }])
      .select()
      .single()

    if (claimErr) {
      if (claimErr.code === '23505') {
        // Unique violation on (campaign_id, user_id) or (campaign_id, external_reference) --
        // someone already claimed this; treat as an idempotent success.
        const { data: existing } = await supabase
          .from('txp_campaign_claims')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('user_id', userId)
          .maybeSingle()
        return { alreadyClaimed: true, claim: existing || null }
      }
      throw claimErr
    }

    await this._award(userId, campaign.reward_amount, 'partner_campaign', {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      partner_name: campaign.partner_name,
      external_reference: externalReference || null,
    }, 'available')

    return { alreadyClaimed: false, claim }
  },

  // ── Phase 14: Reshare / Social Tasks ──────────────────────
  // Simple admin-managed tasks (Follow on IG, Follow on X, etc).
  // Self-reported completion, once per user per task. Awarded through
  // the same _award() ledger primitive so it shows up in wallet history
  // like every other earning action.

  /** Public: active tasks the given user has NOT yet completed */
  async getAvailableSocialTasks(userId) {
    const { data: tasks, error } = await supabase
      .from('txp_social_tasks')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    if (!tasks?.length) return []

    if (!userId) return tasks

    const { data: completions } = await supabase
      .from('txp_social_task_completions')
      .select('task_id')
      .eq('user_id', userId)

    const doneIds = new Set((completions || []).map(c => c.task_id))
    return tasks.filter(t => !doneIds.has(t.id))
  },

  /** Public: tasks this user has already completed (for a "history" list) */
  async getCompletedSocialTasks(userId) {
    if (!userId) return []
    const { data, error } = await supabase
      .from('txp_social_task_completions')
      .select('*, task:txp_social_tasks(title, platform, reward_amount)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  /**
   * Mark a social task as done for a user: records the completion row and
   * awards TXP. Idempotent -- a unique (task_id, user_id) constraint means
   * a duplicate click is treated as already-claimed rather than erroring.
   */
  async completeSocialTask(userId, taskId) {
    if (!userId || !taskId) return { success: false, error: 'Missing user or task' }
    if (await this._isWalletFrozen(userId)) return { success: false, error: 'Wallet is frozen' }

    const { data: task, error: taskErr } = await supabase
      .from('txp_social_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('is_active', true)
      .single()
    if (taskErr || !task) return { success: false, error: 'Task not found or no longer active' }

    const { data: completion, error: completionErr } = await supabase
      .from('txp_social_task_completions')
      .insert([{ task_id: taskId, user_id: userId, awarded_txp: task.reward_amount }])
      .select()
      .single()

    if (completionErr) {
      if (completionErr.code === '23505') {
        return { success: false, alreadyCompleted: true, error: 'Already completed' }
      }
      throw completionErr
    }

    await this._award(userId, task.reward_amount, 'social_task', {
      task_id: task.id,
      task_title: task.title,
      platform: task.platform,
    }, 'available')

    return { success: true, completion, task }
  },

  /** Admin: fetch every social task (active + inactive) */
  async getAllSocialTasks() {
    const { data, error } = await supabase
      .from('txp_social_tasks')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  /** Admin: create a new social task */
  async createSocialTask(data) {
    const { data: created, error } = await supabase
      .from('txp_social_tasks')
      .insert([data])
      .select()
      .single()
    if (error) throw error
    return created
  },

  /** Admin: update a social task's fields */
  async updateSocialTask(id, data) {
    const { data: updated, error } = await supabase
      .from('txp_social_tasks')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated
  },

  /** Admin: delete a social task (completions cascade-delete with it) */
  async deleteSocialTask(id) {
    const { error } = await supabase.from('txp_social_tasks').delete().eq('id', id)
    if (error) throw error
  },

  /** Admin: how many users completed a given task, and who */
  async getSocialTaskCompletions(taskId) {
    const { data, error } = await supabase
      .from('txp_social_task_completions')
      .select('*, profile:profiles(full_name, email)')
      .eq('task_id', taskId)
      .order('completed_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ── Phase 9: Tiers & Leaderboard ──────────────────────────

  /**
   * Given a user's lifetime_earned TXP, return their current tier info
   * plus progress toward the next tier.
   */
  getTierInfo(lifetimeEarned) {
    const earned = Number(lifetimeEarned) || 0
    const tierIndex = TXP_TIERS.findIndex(t => earned >= t.min && earned <= t.max)
    const tier = TXP_TIERS[tierIndex === -1 ? 0 : tierIndex]
    const nextTier = TXP_TIERS[(tierIndex === -1 ? 0 : tierIndex) + 1] || null

    return {
      name: tier.name,
      emoji: tier.emoji,
      color: tier.color,
      minPoints: tier.min,
      maxPoints: tier.max,
      nextTierName: nextTier ? nextTier.name : null,
      nextTierMin: nextTier ? nextTier.min : null,
      pointsToNext: nextTier ? Math.max(0, nextTier.min - earned) : 0,
      progressPercent: nextTier
        ? Math.min(100, Math.max(0, ((earned - tier.min) / (nextTier.min - tier.min)) * 100))
        : 100,
    }
  },

  /** All tiers in ascending order (for rendering tier ladders) */
  getAllTiers() {
    return TXP_TIERS.map(t => ({ ...t, perks: TXP_TIER_PERKS[t.name] || [] }))
  },

  /** Perks unlocked for a given tier name */
  getTierPerks(tierName) {
    return TXP_TIER_PERKS[tierName] || []
  },

  /** Start-of-month ISO timestamp (UTC) used to scope the monthly leaderboard */
  _startOfMonthISO() {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  },

  /** Next month's 1st, used for the "leaderboard resets on" note */
  getLeaderboardResetDate() {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  },

  /**
   * Build the ranked leaderboard for a period.
   * period: 'monthly' (current calendar month, credit txns) | 'all_time' (lifetime_earned)
   */
  async getLeaderboard(period = 'monthly', limit = 50) {
    // Per-row RLS only lets a user read their own wallet/transaction rows,
    // so ranking must go through a security-definer function that safely
    // aggregates totals across all users server-side.
    const { data: rows, error } = await supabase
      .rpc('get_txp_leaderboard', { p_period: period === 'all_time' ? 'all_time' : 'monthly' })
    if (error) throw error

    const ranked = (rows || [])
      .map(r => ({ userId: r.user_id, points: Number(r.points) || 0, lifetimeEarned: Number(r.lifetime_earned) || 0 }))
      .slice(0, limit)

    if (!ranked.length) return []

    const ids = ranked.map(r => r.userId)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids)

    const profileById = {}
    ;(profiles || []).forEach(p => { profileById[p.id] = p })

    return ranked.map((r, idx) => {
      const profile = profileById[r.userId] || {}
      return {
        rank: idx + 1,
        userId: r.userId,
        points: r.points,
        fullName: profile.full_name || 'Anonymous',
        avatarUrl: profile.avatar_url || null,
        tier: this.getTierInfo(r.lifetimeEarned),
      }
    })
  },

  /**
   * Get a user's rank + gap to the next position for a given period.
   * Computes the full ranked set (uncapped) so the rank is accurate even
   * if the user falls outside the top `limit` shown on the leaderboard.
   */
  async getUserRank(userId, period = 'monthly') {
    if (!userId) return null

    const fullBoard = await this.getLeaderboard(period, 10000)
    const idx = fullBoard.findIndex(r => r.userId === userId)

    if (idx === -1) {
      return { rank: null, points: 0, totalRanked: fullBoard.length, gapToNext: null, nextRankUser: null }
    }

    const entry = fullBoard[idx]
    const above = idx > 0 ? fullBoard[idx - 1] : null

    return {
      rank: entry.rank,
      points: entry.points,
      totalRanked: fullBoard.length,
      gapToNext: above ? above.points - entry.points : 0,
      nextRankUser: above ? { fullName: above.fullName, rank: above.rank } : null,
    }
  },

  // ── Phase 10: Anti-Fraud & Rate Limiting ──────────────────

  /** Sum of TXP credited to a user for a given reason so far today (UTC calendar day) */
  async _todaysEarnedForReason(userId, reason) {
    const now = new Date()
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()

    const { data, error } = await supabase
      .from('txp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('reason', reason)
      .eq('type', 'credit')
      .gte('created_at', startOfDay)
    if (error) throw error

    return (data || []).reduce((sum, t) => sum + (t.amount || 0), 0)
  },

  /**
   * Check whether a user has already hit the daily_cap configured on a rule
   * for a given reason. Rules with a null/0 daily_cap are treated as unlimited.
   */
  async _isRateLimited(userId, reason) {
    const rule = await this.getRule(reason)
    if (!rule?.daily_cap) return false

    const todaysEarned = await this._todaysEarnedForReason(userId, reason)
    return todaysEarned >= rule.daily_cap
  },

  /** Lightweight check used at the top of earning methods to skip frozen wallets */
  async _isWalletFrozen(userId) {
    const wallet = await this.getWallet(userId)
    return !!wallet?.is_frozen
  },

  // ── Fraud Flag Detection & Management ─────────────────────

  /**
   * Insert a fraud flag row. Never throws -- a failure to record a flag
   * should never block the underlying award/earning flow.
   */
  async _flag(userId, flagType, severity, reason, metadata = {}) {
    try {
      const { error } = await supabase
        .from('txp_fraud_flags')
        .insert([{ user_id: userId, flag_type: flagType, severity, reason, metadata }])
      if (error) console.error('Failed to insert fraud flag:', error)
    } catch (err) {
      console.error('Failed to insert fraud flag:', err)
    }
  },

  /** Count referrals a user has registered as referrer in the last N hours */
  async _countReferralsInWindow(userId, hours) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const { count, error } = await supabase
      .from('txp_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .gte('created_at', since)
    if (error) throw error
    return count || 0
  },

  /** Count 'event_shared' credit transactions for a user in the last N hours */
  async _countSharesInWindow(userId, hours) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const { count, error } = await supabase
      .from('txp_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reason', 'event_shared')
      .eq('type', 'credit')
      .gte('created_at', since)
    if (error) throw error
    return count || 0
  },

  /** Admin: fetch fraud flags (optionally filtered by status) enriched with profile info */
  async getFraudFlags(status = 'open', limit = 100) {
    let query = supabase
      .from('txp_fraud_flags')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: flags, error } = await query
    if (error) throw error
    if (!flags?.length) return []

    const ids = [...new Set(flags.map(f => f.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ids)

    const profileById = {}
    ;(profiles || []).forEach(p => { profileById[p.id] = p })

    return flags.map(f => ({ ...f, profile: profileById[f.user_id] || null }))
  },

  /** Admin: resolve or dismiss a fraud flag, recording who did it and why */
  async resolveFraudFlag(flagId, status, note, actor) {
    const { data: flag, error: fetchErr } = await supabase
      .from('txp_fraud_flags')
      .select('*')
      .eq('id', flagId)
      .single()
    if (fetchErr) throw fetchErr

    const { data: updated, error } = await supabase
      .from('txp_fraud_flags')
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: actor || 'admin',
        resolution_note: note || null
      })
      .eq('id', flagId)
      .select()
      .single()
    if (error) throw error

    await this._logAudit('resolve_fraud_flag', flag?.user_id || null, { flag_id: flagId, status, note }, actor)

    return updated
  },

  // ── Freeze / Unfreeze Accounts ────────────────────────────

  /** Admin: freeze a user's wallet, blocking all further TXP earning */
  async adminFreezeWallet(userId, reason, actor) {
    const { error } = await supabase
      .from('txp_wallets')
      .update({
        is_frozen: true,
        frozen_reason: reason || null,
        frozen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    if (error) throw error

    await this._logAudit('freeze_wallet', userId, { reason, actor }, actor)

    return true
  },

  /** Admin: unfreeze a user's wallet */
  async adminUnfreezeWallet(userId, actor) {
    const { error } = await supabase
      .from('txp_wallets')
      .update({
        is_frozen: false,
        frozen_reason: null,
        frozen_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    if (error) throw error

    await this._logAudit('unfreeze_wallet', userId, { actor }, actor)

    return true
  },

  // ── Audit Log ──────────────────────────────────────────────

  /** Internal: insert a txp_audit_log row */
  async _logAudit(action, targetUserId, metadata = {}, actor = 'admin') {
    const { error } = await supabase
      .from('txp_audit_log')
      .insert([{ actor: actor || 'admin', action, target_user_id: targetUserId || null, metadata }])
    if (error) throw error
  },

  /** Admin: fetch audit log entries, optionally scoped to one user */
  async getAuditLog(targetUserId = null, limit = 100) {
    let query = supabase
      .from('txp_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  /**
   * Admin: full investigation view for a single user -- combines their TXP
   * ledger, every audit-log entry recorded against them, and any fraud flags
   * raised on their account (any status).
   */
  async getFullUserAuditTrail(userId, limit = 100) {
    const [transactions, auditLog, fraudFlagsResult] = await Promise.all([
      this.getUserTransactions(userId, limit),
      this.getAuditLog(userId, limit),
      supabase
        .from('txp_fraud_flags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ])

    if (fraudFlagsResult.error) throw fraudFlagsResult.error

    return {
      transactions: transactions || [],
      auditLog: auditLog || [],
      fraudFlags: fraudFlagsResult.data || []
    }
  },

  // ── Refund Handling ────────────────────────────────────────

  /**
   * Reverse any pending/available TXP earned directly from a ticket purchase
   * (reason = 'ticket_purchase') when that ticket is refunded.
   */
  async reverseTicketPurchasePoints(ticketId, actor = 'admin') {
    const { data: txns, error } = await supabase
      .from('txp_transactions')
      .select('*')
      .eq('reason', 'ticket_purchase')
      .contains('metadata', { ticket_id: ticketId })
    if (error) throw error

    const toReverse = (txns || []).filter(t => t.status !== 'reversed')
    if (!toReverse.length) return { reversed: 0 }

    let reversedCount = 0

    for (const txn of toReverse) {
      const wallet = await this.getWallet(txn.user_id)
      let shortfall = 0

      if (txn.status === 'pending') {
        const newPending = Math.max(0, (wallet.pending || 0) - txn.amount)
        const actualDeduction = (wallet.pending || 0) - newPending
        shortfall = txn.amount - actualDeduction

        const { error: walletErr } = await supabase
          .from('txp_wallets')
          .update({ pending: newPending, updated_at: new Date().toISOString() })
          .eq('user_id', txn.user_id)
        if (walletErr) throw walletErr
      } else {
        const newAvailable = Math.max(0, (wallet.available || 0) - txn.amount)
        const actualDeduction = (wallet.available || 0) - newAvailable
        shortfall = txn.amount - actualDeduction

        const { error: walletErr } = await supabase
          .from('txp_wallets')
          .update({ available: newAvailable, updated_at: new Date().toISOString() })
          .eq('user_id', txn.user_id)
        if (walletErr) throw walletErr
      }

      const { error: txnErr } = await supabase
        .from('txp_transactions')
        .update({ status: 'reversed' })
        .eq('id', txn.id)
      if (txnErr) throw txnErr

      await this._logAudit('reverse_ticket_points', txn.user_id, {
        ticket_id: ticketId,
        amount_reversed: txn.amount,
        ...(shortfall > 0 ? { shortfall } : {})
      }, actor)

      reversedCount++
    }

    return { reversed: reversedCount }
  },

  /**
   * Reverse any completed TXP redemption that paid for a now-refunded ticket.
   */
  async reverseRedemptionByTicket(ticketId, actor = 'admin') {
    const { data: redemptions, error } = await supabase
      .from('txp_redemptions')
      .select('*')
      .eq('status', 'completed')
      .contains('ticket_ids', [ticketId])
    if (error) throw error

    if (!redemptions?.length) return { reversed: 0 }

    let reversedCount = 0
    for (const redemption of redemptions) {
      const result = await this.reverseRedemption(redemption.id)
      if (result) {
        await this._logAudit('reverse_redemption', redemption.user_id, {
          ticket_id: ticketId,
          redemption_id: redemption.id
        }, actor)
        reversedCount++
      }
    }

    return { reversed: reversedCount }
  },

  /**
   * Orchestrator called when an admin refunds a ticket: reverses both the
   * direct ticket-purchase TXP earn and any TXP redemption used to pay for it.
   * Each step is isolated so a failure in one doesn't block the other.
   */
  async refundTicketPoints(ticketId, actor = 'admin') {
    let pointsReversed = false
    let redemptionReversed = false

    try {
      const result = await this.reverseTicketPurchasePoints(ticketId, actor)
      pointsReversed = (result?.reversed || 0) > 0
    } catch (err) {
      console.error('reverseTicketPurchasePoints failed:', err)
    }

    try {
      const result = await this.reverseRedemptionByTicket(ticketId, actor)
      redemptionReversed = (result?.reversed || 0) > 0
    } catch (err) {
      console.error('reverseRedemptionByTicket failed:', err)
    }

    return { pointsReversed, redemptionReversed }
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
      partner_campaign: 'Partner campaign reward',
      social_task: 'Reshare / social task',
      redemption: 'Points redeemed',
      ticket_redemption: 'Paid with Tixo Points',
      redemption_reversed: 'Points refunded',
      admin_award: 'Awarded by admin',
      admin_deduct: 'Deducted by admin',
      legacy_appreciation_bonus: 'Thank-you bonus 🎉'
    }
    return labels[reason] || reason.replace(/_/g, ' ')
  }
}

export default TxpService
