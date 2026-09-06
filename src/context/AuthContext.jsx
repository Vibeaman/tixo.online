import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import TicketService from '../services/TicketService'
import TxpService from '../services/TxpService'
import { triggerTxpCelebration } from '../components/TxpCelebration'

const AuthContext = createContext(null)

// Award the one-time 50 TXP welcome bonus and show the coin-shower celebration.
//
// This deliberately runs on the first authenticated session rather than at the
// moment of sign-up: when email confirmation is enabled, supabase.auth.signUp()
// returns a user but NO session, so anything written from the SignUp page hits
// row-level security as an anonymous request and is silently rejected. By the
// time we get here the user is genuinely signed in, so the insert succeeds.
//
// onAccountCreated() is itself idempotent (it checks the ledger for an existing
// signup_bonus credit), so re-running on every sign-in is safe. The localStorage
// marker just avoids the extra round-trip on subsequent logins.
async function grantSignupBonus(u) {
  if (!u?.id) return
  const marker = `tixo_signup_bonus_${u.id}`
  if (localStorage.getItem(marker)) return
  try {
    const txn = await TxpService.onAccountCreated(u.id)
    localStorage.setItem(marker, '1')
    if (txn?.amount > 0) triggerTxpCelebration(txn.amount, 'signup_bonus')
  } catch (err) {
    console.error('Failed to grant signup bonus:', err)
  }
}

// Attribute a pending referral code to this account.
//
// Runs on the first authenticated session rather than at sign-up. With email
// confirmation enabled, supabase.auth.signUp() returns a user but NO session,
// so anything attempted from the SignUp page runs anonymously and is rejected.
//
// All validation (self-referral, duplicate, account age) lives inside the
// register_referral() database function, which is also the only thing allowed
// to write the referrer's rows. Here we just decide whether to keep the code
// around for another attempt.
const TERMINAL_REFERRAL_REASONS = new Set([
  'bad_code', 'self_referral', 'already_referred', 'account_too_old'
])

async function processPendingReferral(u) {
  const refCode = localStorage.getItem('tixo_referral_code')
  if (!refCode || !u?.id) return
  try {
    const result = await TxpService.registerReferralByCode(refCode)
    if (result?.ok || TERMINAL_REFERRAL_REASONS.has(result?.reason)) {
      localStorage.removeItem('tixo_referral_code')
    }
    // Anything else (e.g. not_authenticated) leaves the code in place so the
    // next sign-in can retry instead of losing the credit outright.
  } catch (err) {
    // Transient/network failure: deliberately KEEP the code and retry later.
    console.error('Failed to process referral on sign-in:', err)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
      if (data?.email) {
        TicketService.claimTransferredTickets(userId, data.email).then(claimed => {
          if (claimed.length > 0) console.log(`Claimed ${claimed.length} transferred ticket(s)`)
        }).catch(err => console.error('Failed to claim tickets:', err))
      }
    } catch (e) {
      console.warn('Profile fetch failed:', e.message)
    }
  }

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null
      setUser(u)
      if (u) {
        fetchProfile(u.id)
        // Backfill: existing accounts that signed up before the welcome bonus
        // was wired up still collect their 50 TXP on their next visit, without
        // having to log out and back in first.
        grantSignupBonus(u)
        // Email-confirmation links land the user here already signed in, so
        // this is often the first chance to bank a pending referral code.
        processPendingReferral(u)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user || null
        setUser(u)
        if (!u) {
          setProfile(null)
          return
        }

        // IMPORTANT: never call supabase-js from inside this callback.
        //
        // The auth client invokes listeners while holding its internal Web Locks
        // (navigator.locks) mutex. Any nested Supabase call re-enters that lock
        // and deadlocks it, which stops the background token refresh from ever
        // completing -- the session then dies when the access token expires and
        // the user is thrown out mid-session. Browsers without Web Locks fall
        // back to a no-op lock and never hit this, which is exactly why the bug
        // showed up on desktop but not on mobile.
        //
        // Deferring to a fresh macrotask lets the lock release first.
        setTimeout(() => {
          fetchProfile(u.id)
          if (_event === 'SIGNED_IN') {
            processPendingReferral(u)
            grantSignupBonus(u)
          }
        }, 0)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = { user, profile, loading, setProfile }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
