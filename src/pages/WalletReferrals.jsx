import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, Copy, Clock, Trophy, Gift, Target, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import TxpService from '../services/TxpService'
import { showTxpToast } from '../components/TxpToast'

export default function WalletReferrals() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState([])
  const [campaignProgress, setCampaignProgress] = useState([])
  const [claimingCampaignId, setClaimingCampaignId] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [authLoading, user, navigate])

  async function loadAll() {
    if (!user) return
    setLoading(true)
    try {
      const [code, rows, campaigns] = await Promise.all([
        TxpService.getOrCreateReferralCode(user.id).catch(() => ''),
        TxpService.getUserReferrals(user.id).catch(() => []),
        TxpService.getUserCampaignProgress(user.id).catch(() => []),
      ])
      setReferralCode(code || '')
      setReferrals(rows || [])
      setCampaignProgress(campaigns || [])
    } catch (err) {
      console.error('Failed to load TXP referrals:', err)
      toast.error('Failed to load your referrals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleClaimCampaignBonus(campaignId) {
    if (!user) return
    setClaimingCampaignId(campaignId)
    try {
      const result = await TxpService.claimCampaignBonus(user.id, campaignId)
      if (result.success) {
        showTxpToast(result.pointsAwarded, 'referral_campaign_bonus')
        const rows = await TxpService.getUserCampaignProgress(user.id)
        setCampaignProgress(rows || [])
      } else {
        toast.error(result.error || 'Unable to claim bonus')
      }
    } catch (err) {
      console.error('Failed to claim campaign bonus:', err)
      toast.error('Unable to claim bonus')
    } finally {
      setClaimingCampaignId(null)
    }
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
        <title>Refer & Earn TXP | Tixo</title>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <Link to="/wallet" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Wallet
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-pink-400" />
          <h1 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Refer & Earn TXP
          </h1>
        </div>
        <p className="text-gray-400 text-sm md:text-base mb-8">
          Invite friends to Tixo — you earn TXP, they earn TXP too.
        </p>

        {/* Referral link */}
        <div className="mb-8 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Invite Friends, Earn TXP</h3>
              <p className="text-gray-400 text-sm">Share your link and earn 100 TXP per signup + 250 TXP on their first purchase</p>
            </div>
          </div>
          {referralCode ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono truncate">
                {window.location.origin}/ref/{referralCode}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/ref/${referralCode}`)
                  toast.success('Referral link copied!')
                }}
                className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 flex-shrink-0"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Unable to load your referral link. Please try again.</p>
          )}
        </div>

        {/* Referrals list */}
        <div className="mb-8">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-400" /> Your Referrals
          </h3>
          {referrals.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-2xl">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No referrals yet. Share your link to start earning TXP!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map(r => (
                <div key={r.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-white font-semibold text-sm truncate">
                      {r.referee?.full_name || r.referee?.email || 'A new user'}
                    </h4>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-pink-400 font-bold text-sm">+{r.points_awarded || 0} TXP</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      r.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {r.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referral campaigns */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-pink-400" /> Referral Campaigns
          </h3>
          {campaignProgress.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-2xl">
              <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No active campaigns right now. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignProgress.map(({ campaign, completedReferrals, alreadyClaimed }) => {
                const milestone = campaign.milestone_count || 1
                const pct = Math.min(100, Math.round((completedReferrals / milestone) * 100))
                const reached = completedReferrals >= milestone
                const remaining = Math.max(0, milestone - completedReferrals)

                return (
                  <div key={campaign.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-sm">{campaign.name}</h4>
                          {campaign.description && (
                            <p className="text-gray-500 text-xs mt-1">{campaign.description}</p>
                          )}
                        </div>
                      </div>
                      {alreadyClaimed ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                          <Gift className="w-3 h-3" /> Claimed! +{campaign.bonus_points.toLocaleString()} TXP
                        </span>
                      ) : reached ? (
                        <button
                          onClick={() => handleClaimCampaignBonus(campaign.id)}
                          disabled={claimingCampaignId === campaign.id}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white flex items-center gap-1 flex-shrink-0 whitespace-nowrap disabled:opacity-50"
                        >
                          <Gift className="w-3 h-3" /> {claimingCampaignId === campaign.id ? 'Claiming...' : 'Claim Bonus'}
                        </button>
                      ) : null}
                    </div>

                    <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-xs">
                        {completedReferrals} of {milestone} referrals completed
                      </p>
                      {!alreadyClaimed && !reached && (
                        <p className="text-cyan-400 text-xs font-medium">
                          Refer {remaining} more to unlock {campaign.bonus_points.toLocaleString()} TXP bonus!
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
