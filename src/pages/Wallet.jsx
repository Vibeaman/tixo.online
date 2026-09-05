import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Trophy,
  Star,
  Crown,
  Diamond,
  Globe,
  Info,
  Gift,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import TxpService from '../services/TxpService'

// ── Tier config ──────────────────────────────────────────────
const TIERS = [
  { id: 'explorer', label: 'Explorer', icon: Globe, min: 0, max: 499, color: 'text-gray-300', badgeBg: 'bg-gray-700/40 border-gray-600/60' },
  { id: 'insider', label: 'Insider', icon: Star, min: 500, max: 1999, color: 'text-blue-300', badgeBg: 'bg-blue-500/15 border-blue-500/40' },
  { id: 'vip', label: 'VIP', icon: Diamond, min: 2000, max: 4999, color: 'text-purple-300', badgeBg: 'bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.35)]' },
  { id: 'elite', label: 'Elite', icon: Crown, min: 5000, max: Infinity, color: 'text-yellow-300', badgeBg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.35)]' },
]

function getTier(lifetimeEarned) {
  return TIERS.find(t => lifetimeEarned >= t.min && lifetimeEarned <= t.max) || TIERS[0]
}

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function BalanceCard({ icon: Icon, label, value, accent, sub, tooltip, featured }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div
      className={`relative rounded-2xl p-6 border transition-all ${
        featured
          ? 'bg-gray-900/60 border-transparent bg-clip-padding'
          : 'bg-gray-900/50 border-gray-800'
      }`}
      style={featured ? {
        backgroundImage: 'linear-gradient(#0d0d18, #0d0d18), linear-gradient(135deg, #ec4899, #a855f7, #22d3ee)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        border: '1px solid transparent',
      } : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 text-sm font-medium ${accent}`}>
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </div>
        {tooltip && (
          <div className="relative">
            <Info
              className="w-4 h-4 text-gray-500 cursor-help"
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
            />
            {showTip && (
              <div className="absolute right-0 top-6 z-10 w-48 text-xs bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-300 shadow-xl">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`font-bold ${featured ? 'text-4xl' : 'text-3xl'} text-white`}>{value.toLocaleString()}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function TransactionRow({ txn }) {
  const isEarned = txn.amount > 0 && txn.status !== 'pending'
  const isPending = txn.status === 'pending'
  const isSpent = txn.amount < 0

  let Icon = ArrowUpRight
  let colorClass = 'text-green-400'
  if (isPending) {
    Icon = Clock
    colorClass = 'text-yellow-400'
  } else if (isSpent) {
    Icon = ArrowDownRight
    colorClass = 'text-red-400'
  }

  const label = TxpService.reasonLabel(txn.reason)
  const amountLabel = `${txn.amount > 0 ? '+' : ''}${txn.amount.toLocaleString()}`

  return (
    <div className="flex items-center justify-between bg-gray-900/30 hover:bg-gray-800/50 rounded-xl p-4 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-white/5 flex-shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{label}</p>
          <p className="text-gray-500 text-xs">{formatRelativeTime(txn.created_at)}</p>
        </div>
      </div>
      <span className={`text-sm font-bold flex-shrink-0 ${colorClass}`}>{amountLabel} TXP</span>
    </div>
  )
}

export default function Wallet() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState({ available: 0, pending: 0, lifetime_earned: 0, lifetime_redeemed: 0 })
  const [history, setHistory] = useState([])
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [walletData, historyData] = await Promise.all([
          TxpService.getWallet(user.id),
          TxpService.getHistory(user.id, 200),
        ])
        if (!cancelled) {
          setWallet(walletData || { available: 0, pending: 0, lifetime_earned: 0, lifetime_redeemed: 0 })
          setHistory(historyData || [])
        }
      } catch (err) {
        console.error('Failed to load wallet:', err)
        toast.error('Failed to load your wallet')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const lifetimeEarned = wallet.lifetime_earned || 0
  const tier = getTier(lifetimeEarned)
  const TierIcon = tier.icon
  const tierIndex = TIERS.findIndex(t => t.id === tier.id)
  const nextTier = TIERS[tierIndex + 1]
  const progressText = nextTier
    ? `${(nextTier.min - lifetimeEarned).toLocaleString()} TXP to next tier`
    : 'Max tier reached!'

  const visibleHistory = history.slice(0, visibleCount)

  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <Helmet>
        <title>My Wallet | Tixo</title>
      </Helmet>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <WalletIcon className="w-7 h-7 text-pink-400" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">My Wallet</h1>
            </div>
            <p className="text-gray-500 text-sm">Manage your Tixo Points (TXP)</p>
            <Link
              to="/earn"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 mt-2 hover:opacity-80 transition-opacity"
            >
              <Gift className="w-4 h-4 text-pink-400" /> Ways to Earn →
            </Link>
          </div>

          {/* Tier badge */}
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${tier.badgeBg}`}>
            <TierIcon className={`w-6 h-6 ${tier.color}`} />
            <div>
              <p className={`text-sm font-bold ${tier.color}`}>{tier.label} Tier</p>
              <p className="text-gray-400 text-xs">{progressText}</p>
            </div>
          </div>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <BalanceCard
            icon={WalletIcon}
            label="Available Balance"
            value={wallet.available || 0}
            accent="text-white"
            sub="Ready to redeem"
            featured
          />
          <BalanceCard
            icon={Clock}
            label="Pending Points"
            value={wallet.pending || 0}
            accent="text-yellow-400"
            tooltip="Points waiting to be released"
          />
          <BalanceCard
            icon={Trophy}
            label="Lifetime Earned"
            value={lifetimeEarned}
            accent="text-green-400"
          />
          <BalanceCard
            icon={ArrowDownRight}
            label="Lifetime Redeemed"
            value={wallet.lifetime_redeemed || 0}
            accent="text-pink-400"
          />
        </div>

        {/* History */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Points History</h2>
          {history.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-10 text-center">
              <Clock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {visibleHistory.map(txn => (
                  <TransactionRow key={txn.id} txn={txn} />
                ))}
              </div>
              {visibleCount < history.length && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setVisibleCount(c => c + 20)}
                    className="px-6 py-2 rounded-full text-sm font-medium bg-gray-900/50 border border-gray-800 text-gray-300 hover:bg-gray-800/70 transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
