import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import {
  Ticket,
  Trophy,
  Users,
  Target,
  CalendarCheck,
  Wallet as WalletIcon,
  Copy,
  CheckCircle2,
  Gift,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import TxpService from '../services/TxpService'

// ── Earning action definitions ───────────────────────────────
// Points/descriptions are pulled live from txp_rules where possible;
// these are the fallback labels shown while rules are loading or if a
// rule can't be fetched.
const ACTION_META = {
  ticket_purchase: {
    icon: Ticket,
    title: 'Purchase a ticket',
    fallbackPoints: '1 TXP per ₦100 spent',
    description: 'Earn points every time you buy an event ticket (points released after the event is confirmed).',
    cta: { label: 'Browse Events', to: '/events' },
  },
  event_attended: {
    icon: CalendarCheck,
    title: 'Attend an event',
    fallbackPoints: '50 TXP per event',
    description: 'Get points every time you check in and attend an event.',
    cta: { label: 'Browse Events', to: '/events' },
  },
  referral_registered: {
    icon: Users,
    title: 'Refer a friend (signup)',
    fallbackPoints: '100 TXP (pending)',
    description: 'Earn pending points when someone signs up using your referral link.',
    cta: null, // handled by referral widget below
  },
  referral_first_purchase: {
    icon: Gift,
    title: "Referral's first purchase",
    fallbackPoints: '250 TXP',
    description: 'Get a bonus when your referral buys their first ticket.',
    cta: { label: 'View Progress', to: '/dashboard?tab=referrals' },
  },
  referral_campaign_bonus: {
    icon: Trophy,
    title: 'Campaign milestones',
    fallbackPoints: 'Varies',
    description: 'Hit referral milestones for bonus rewards.',
    cta: { label: 'View Progress', to: '/dashboard?tab=referrals' },
  },
}

const ACTION_ORDER = [
  'ticket_purchase',
  'event_attended',
  'referral_registered',
  'referral_first_purchase',
  'referral_campaign_bonus',
]

function formatRulePoints(action, rule) {
  if (!rule || rule.points == null) return ACTION_META[action]?.fallbackPoints || 'Varies'
  switch (action) {
    case 'ticket_purchase':
      return `${rule.points} TXP per ₦100 spent`
    case 'event_attended':
      return `${rule.points.toLocaleString()} TXP per event`
    case 'referral_registered':
      return `${rule.points.toLocaleString()} TXP (pending)`
    case 'referral_first_purchase':
      return `${rule.points.toLocaleString()} TXP`
    default:
      return `${rule.points.toLocaleString()} TXP`
  }
}

function ActionCard({ action, rule, completed, children }) {
  const meta = ACTION_META[action]
  if (!meta) return null
  const Icon = meta.icon
  const pointsLabel = formatRulePoints(action, rule)

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-white font-bold text-base">{meta.title}</h3>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white">
            {pointsLabel}
          </span>
        </div>
        <p className="text-gray-400 text-sm">{rule?.description || meta.description}</p>
      </div>

      <div className="flex-shrink-0 sm:ml-4">
        {completed ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </span>
        ) : children ? (
          children
        ) : meta.cta ? (
          <Link
            to={meta.cta.to}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full px-4 py-2 transition-transform hover:-translate-y-0.5"
          >
            {meta.cta.label} →
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export default function WaysToEarn() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [rules, setRules] = useState({})
  const [completion, setCompletion] = useState({})
  const [referralCode, setReferralCode] = useState('')
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [walletData, rulesData, referrals, code] = await Promise.all([
          TxpService.getWallet(user.id),
          TxpService.getRules(),
          TxpService.getUserReferrals(user.id),
          TxpService.getOrCreateReferralCode(user.id).catch(() => ''),
        ])

        const [ticketDone, attendedDone, referralPurchaseDone] = await Promise.all([
          TxpService.hasEarnedReason(user.id, 'ticket_purchase'),
          TxpService.hasEarnedReason(user.id, 'event_attended'),
          TxpService.hasEarnedReason(user.id, 'referral_first_purchase'),
        ])

        if (cancelled) return

        const ruleMap = {}
        ;(rulesData || []).forEach(r => { ruleMap[r.action] = r })

        setWallet(walletData)
        setRules(ruleMap)
        setReferralCode(code || '')
        setReferralCount((referrals || []).length)
        setCompletion({
          ticket_purchase: ticketDone,
          event_attended: attendedDone,
          referral_first_purchase: referralPurchaseDone,
        })
      } catch (err) {
        console.error('Failed to load Ways to Earn data:', err)
        toast.error('Failed to load earning opportunities')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const referralLink = referralCode ? `${window.location.origin}/ref/${referralCode}` : ''

  function copyReferralLink() {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  const shareText = "Join me on Tixo and start earning Tixo Points! Sign up with my link:"

  function shareWhatsApp() {
    if (!referralLink) return
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function shareTwitter() {
    if (!referralLink) return
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <Helmet>
        <title>Ways to Earn TXP | Tixo</title>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <h1 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Ways to Earn TXP
              </h1>
            </div>
            <p className="text-gray-400 text-sm md:text-base">
              Complete actions to earn Tixo Points and unlock rewards
            </p>
          </div>

          <Link
            to="/wallet"
            className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-3 hover:bg-gray-800/60 transition-colors flex-shrink-0"
          >
            <WalletIcon className="w-5 h-5 text-pink-400" />
            <div>
              <p className="text-gray-500 text-xs">Current Balance</p>
              <p className="text-white font-bold text-lg">{(wallet?.available || 0).toLocaleString()} TXP</p>
            </div>
          </Link>
        </div>

        {/* Earning actions */}
        <div className="space-y-4 mb-12">
          {ACTION_ORDER.map(action => {
            if (action === 'referral_registered') {
              return (
                <ActionCard key={action} action={action} rule={rules[action]} completed={false}>
                  <a
                    href="#referral-widget"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full px-4 py-2 transition-transform hover:-translate-y-0.5"
                  >
                    Get Your Link ↓
                  </a>
                </ActionCard>
              )
            }
            if (action === 'referral_campaign_bonus') {
              return (
                <ActionCard key={action} action={action} rule={rules[action]} completed={false} />
              )
            }
            return (
              <ActionCard
                key={action}
                action={action}
                rule={rules[action]}
                completed={!!completion[action]}
              />
            )
          })}
        </div>

        {/* Referral Widget */}
        <div id="referral-widget" className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 sm:p-8 scroll-mt-24">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Share Your Referral Link</h2>
              <p className="text-gray-400 text-sm">{referralCount} friend{referralCount === 1 ? '' : 's'} referred</p>
            </div>
          </div>

          {referralLink ? (
            <>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-5">
                <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono truncate">
                  {referralLink}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center gap-2 bg-green-600/15 border border-green-600/40 text-green-400 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-600/25 transition-colors"
                >
                  Share on WhatsApp
                </button>
                <button
                  onClick={shareTwitter}
                  className="flex items-center gap-2 bg-cyan-600/15 border border-cyan-600/40 text-cyan-400 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-cyan-600/25 transition-colors"
                >
                  Share on X / Twitter
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm mt-4">Unable to load your referral link. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  )
}
