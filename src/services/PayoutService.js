/**
 * PayoutService — Handles organizer payout setup (bank accounts + Paystack subaccounts)
 */

import { supabase } from '../lib/supabase'

const PayoutService = {
  /** Fetch list of Nigerian banks */
  async listBanks() {
    const res = await fetch('/api/list-banks')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch banks')
    return data.banks
  },

  /** Resolve account number to get account holder name */
  async resolveAccount(accountNumber, bankCode) {
    const res = await fetch('/api/resolve-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not resolve account')
    return data
  },

  /** Create or update Paystack subaccount */
  async createSubaccount({ userId, businessName, bankCode, bankName, accountNumber, accountName }) {
    const res = await fetch('/api/create-subaccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        business_name: businessName,
        bank_code: bankCode,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to set up payouts')
    return data
  },

  /** Get organizer's payout profile from Supabase (owner-only, full bank details) */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('payout_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data || null
  },

  /** Get organizer's subaccount code (for payment splitting) — reads the safe public view */
  async getSubaccountCode(organizerId) {
    const { data, error } = await supabase
      .from('organizer_subaccounts')
      .select('subaccount_code')
      .eq('user_id', organizerId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data?.subaccount_code || null
  }
}

export default PayoutService
