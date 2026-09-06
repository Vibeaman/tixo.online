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
    // IMPORTANT: don't ALSO call supabase.auth.getSession() here.
    //
    // supabase-js already fires onAuthStateChange with an 'INITIAL_SESSION'
    // event as soon as it finishes checking localStorage / parsing an OAuth
    // redirect in the URL -- that's the single source of truth for "is anyone
    // logged in". Calling getSession() separately races that internal check:
    // getSession() resolves fast and (finding nothing yet) briefly reports a
    // null session right as the OAuth redirect is still being processed. Both
    // calls also compete for the client's internal Web Locks mutex, which is
    // exactly what caused the login-flash-then-logout bug on desktop --
    // mobile browsers silently no-op that lock, so they never showed it.
    //
    // Relying only on onAuthStateChange removes the race entirely.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user || null
        setUser(u)
        if (!u) {
          setProfile(null)
          setLoading(false)
          return
        }

        // IMPORTANT: never call supabase-js synchronously from inside this
        // callback -- it runs while the client holds its internal lock, and a
        // nested call re-enters it. Defer to a fresh macrotask so the lock is
        // released first.
        setTimeout(() => {
          fetchProfile(u.id)
          if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
            // Backfill: existing accounts that signed up (or emailed a
            // confirmation link) before the welcome bonus / referral hookup
            // still get credited on their first visit here.
            grantSignupBonus(u)
            processPendingReferral(u)
          }
          setLoading(false)
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
