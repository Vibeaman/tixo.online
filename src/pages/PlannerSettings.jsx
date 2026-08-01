import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Settings, Eye, EyeOff, Shield, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import PlannerService from '../services/PlannerService'

export default function PlannerSettings() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)

  const [accountName, setAccountName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bvn, setBvn] = useState('')
  const [nin, setNin] = useState('')
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  const [showBvn, setShowBvn] = useState(false)
  const [showNin, setShowNin] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }

    async function load() {
      try {
        const profile = await PlannerService.getProfile(user.id)
        if (profile) {
          setHasProfile(true)
          setAccountName(profile.account_name || '')
          setBankName(profile.bank_name || '')
          setAccountNumber(profile.account_number || '')
          setBvn(profile.bvn || '')
          setNin(profile.nin || '')
          setDisclaimerAccepted(!!profile.disclaimer_accepted)
        }
      } catch (e) {
        console.warn('Failed to load planner profile:', e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading, navigate])

  const allFilled = accountName.trim() && bankName.trim() && accountNumber.trim() && bvn.trim() && nin.trim()
  const canSubmit = allFilled && disclaimerAccepted && !saving

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setSaving(true)
    try {
      await PlannerService.saveProfile({
        userId: user.id,
        accountName: accountName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        bvn: bvn.trim(),
        nin: nin.trim(),
        disclaimerAccepted,
      })
      setHasProfile(true)
      toast.success(hasProfile ? 'Settings updated successfully' : 'Settings saved successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-pink-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050510] px-4 py-24">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-block text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E91E8C, #8B5CF6, #22D3EE)' }}
            >
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Planner Settings</h1>
          </div>
          <p className="text-gray-400 text-sm mb-8">
            Set up your bank details to receive payouts from ticket sales
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Bank Account Name</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Bank Name</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="e.g. GTBank"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Account Number</label>
              <input
                type="text"
                required
                maxLength={10}
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit account number"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">BVN</label>
              <div className="relative">
                <input
                  type={showBvn ? 'text' : 'password'}
                  required
                  maxLength={11}
                  value={bvn}
                  onChange={e => setBvn(e.target.value.replace(/\D/g, ''))}
                  placeholder="11-digit BVN"
                  className="w-full px-4 py-2.5 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowBvn(!showBvn)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showBvn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">NIN</label>
              <div className="relative">
                <input
                  type={showNin ? 'text' : 'password'}
                  required
                  maxLength={11}
                  value={nin}
                  onChange={e => setNin(e.target.value.replace(/\D/g, ''))}
                  placeholder="11-digit NIN"
                  className="w-full px-4 py-2.5 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNin(!showNin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showNin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-sm font-semibold text-white">Disclaimer</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line mb-4">
                {`By submitting this form, I confirm that:
• The bank details provided are accurate and belong to me
• I authorize Tixo to use these details for payout processing
• I understand that providing false information may result in account suspension
• I agree to Tixo's Terms of Service and Privacy Policy regarding payment processing`}
              </p>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <span
                  className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors"
                  style={{
                    background: disclaimerAccepted ? 'linear-gradient(135deg, #E91E8C, #8B5CF6, #22D3EE)' : 'transparent',
                    borderColor: disclaimerAccepted ? 'transparent' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {disclaimerAccepted && <Check className="w-3.5 h-3.5 text-white" />}
                </span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={disclaimerAccepted}
                  onChange={e => setDisclaimerAccepted(e.target.checked)}
                />
                <span className="text-sm text-gray-300">I accept the above terms and conditions</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #E91E8C, #8B5CF6, #22D3EE)',
              }}
            >
              {saving ? 'Saving...' : hasProfile ? 'Update Settings' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
