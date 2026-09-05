import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import TicketService from '../services/TicketService'
import TxpService from '../services/TxpService'

const AuthContext = createContext(null)

// Google (and any other OAuth) sign-ups redirect straight back into the app,
// bypassing the SignUp page's manual processReferral() call. Attribute the
// referral here instead, but only for genuinely new accounts -- guard by
// checking the auth user was created moments ago, so an existing user who
// merely clicked someone else's referral link before logging back in is
// never mistakenly attributed as a fresh referral.
async function processReferralIfNewSignup(u) {
  const refCode = localStorage.getItem('tixo_referral_code')
  if (!refCode || !u?.id) return
  try {
    const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0
    const isFreshAccount = createdAt > 0 && (Date.now() - createdAt) < 2 * 60 * 1000
    if (!isFreshAccount) return
    const referrer = await TxpService.getUserByReferralCode(refCode)
    if (referrer?.id && referrer.id !== u.id) {
      await TxpService.onReferralRegistered(referrer.id, u.id)
    }
  } catch (err) {
    console.error('Failed to process referral on sign-in:', err)
  } finally {
    localStorage.removeItem('tixo_referral_code')
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
      if (u) fetchProfile(u.id)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user || null
        setUser(u)
        if (u) {
          fetchProfile(u.id)
          if (_event === 'SIGNED_IN') processReferralIfNewSignup(u)
        } else {
          setProfile(null)
        }
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
