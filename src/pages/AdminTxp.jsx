import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, ArrowLeft, Settings, Sliders, Users, Gift, Search, Loader2,
  Plus, Trash2, Edit3, X, Check, Coins, Minus, ChevronDown, ChevronUp,
  Lock, Save, AlertTriangle, Flag, Snowflake, Unlock, History,
} from 'lucide-react'
import toast from 'react-hot-toast'
import TxpService from '../services/TxpService'

const ADMIN_PASSCODE = 'peak'
const ADMIN_SESSION_KEY = 'tixo_admin_unlocked'

function PasscodeGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (code.trim().toLowerCase() === ADMIN_PASSCODE) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
      onUnlock()
    } else {
      setError('Incorrect passcode')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510] px-4">
      <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-pink-400" />
          </div>
        </div>
        <h1 className="text-white font-bold text-lg text-center mb-1">Admin Access</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Enter the passcode to continue</p>
        <input
          type="password"
          maxLength={4}
          value={code}
          onChange={e => { setCode(e.target.value); setError('') }}
          placeholder="Passcode"
          autoFocus
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-center tracking-widest focus:outline-none focus:border-pink-500/50 mb-3"
        />
        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-bold py-2 rounded-lg transition-opacity hover:opacity-90"
        >
          Unlock
        </button>
      </form>
    </div>
  )
}

const ADMIN_ACTOR_KEY = 'tixo_admin_actor_name'

const TABS = [
  { id: 'rules', label: 'Point Rules', icon: Sliders },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'wallets', label: 'User Wallets', icon: Users },
  { id: 'campaigns', label: 'Campaigns', icon: Gift },
  { id: 'fraud', label: 'Fraud & Audit', icon: AlertTriangle },
]

function GradientButton({ children, onClick, disabled, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}

// ── Tab 1: Point Rules ───────────────────────────────────────

function RuleCard({ rule, onSave }) {
  const [points, setPoints] = useState(rule.points ?? 0)
  const [enabled, setEnabled] = useState(!!rule.enabled)
  const [description, setDescription] = useState(rule.description || '')
  const [saving, setSaving] = useState(false)

  const dirty = points !== (rule.points ?? 0) || enabled !== !!rule.enabled || description !== (rule.description || '')

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(rule.id, { points: Number(points) || 0, enabled, description })
      toast.success(`"${rule.action}" rule updated`)
    } catch (err) {
      toast.error(err.message || 'Failed to update rule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-white font-semibold text-sm">{rule.action.replace(/_/g, ' ')}</p>
          <p className="text-gray-500 text-xs mt-0.5">{rule.action}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <span className="text-xs text-gray-400">{enabled ? 'Enabled' : 'Disabled'}</span>
          <button
            type="button"
            onClick={() => setEnabled(v => !v)}
            className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-gradient-to-r from-pink-500 to-cyan-500' : 'bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
          </button>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide">Points</label>
          <input
            type="number"
            value={points}
            onChange={e => setPoints(e.target.value)}
            className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <GradientButton onClick={handleSave} disabled={!dirty || saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </GradientButton>
      </div>
    </div>
  )
}

function RulesTab() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await TxpService.getAllRules()
      setRules(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load rules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSaveRule(id, updates) {
    const updated = await TxpService.updateRuleById(id, updates)
    setRules(prev => prev.map(r => (r.id === id ? updated : r)))
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">Configure how many TXP each user action awards. Disable a rule to stop awarding points for that action without deleting it.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {rules.map(rule => (
          <RuleCard key={rule.id} rule={rule} onSave={handleSaveRule} />
        ))}
        {rules.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8 md:col-span-2">No rules found</p>
        )}
      </div>
    </div>
  )
}

// ── Tab 2: Settings ──────────────────────────────────────────

function SettingsTab() {
  const [form, setForm] = useState({
    redemption_rate: '100',
    max_txp_percentage: '100',
    max_daily_points: '0',
    points_expiration_days: '0',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const rows = await TxpService.getAllSettings()
        const map = {}
        rows.forEach(r => { map[r.key] = r.value })
        setForm(prev => ({ ...prev, ...map }))
      } catch (err) {
        toast.error(err.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.all([
        TxpService.upsertSetting('redemption_rate', form.redemption_rate, 'TXP per ₦100 (100 TXP = ₦100)'),
        TxpService.upsertSetting('max_txp_percentage', form.max_txp_percentage, 'Max percentage of ticket price payable with TXP (0-100)'),
        TxpService.upsertSetting('max_daily_points', form.max_daily_points, 'Max TXP a user can earn per day (0 = unlimited)'),
        TxpService.upsertSetting('points_expiration_days', form.points_expiration_days, 'Days until earned TXP expires (0 = never expire)'),
      ])
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-6">
        <div>
          <label className="text-sm font-semibold text-white">Redemption Rate</label>
          <p className="text-gray-500 text-xs mb-2">How many TXP equal ₦100 at checkout</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={form.redemption_rate}
              onChange={e => update('redemption_rate', e.target.value)}
              className="w-32 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
            />
            <span className="text-gray-400 text-sm">TXP = ₦100</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-white">Max % Payable With TXP</label>
          <p className="text-gray-500 text-xs mb-2">Cap on how much of a ticket total can be paid using points</p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={form.max_txp_percentage}
              onChange={e => update('max_txp_percentage', e.target.value)}
              className="flex-1 accent-pink-500"
            />
            <span className="text-white font-bold text-sm w-14 text-right">{form.max_txp_percentage}%</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-white">Max Points Per User Per Day</label>
          <p className="text-gray-500 text-xs mb-2">0 = unlimited</p>
          <input
            type="number"
            min={0}
            value={form.max_daily_points}
            onChange={e => update('max_daily_points', e.target.value)}
            className="w-40 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-white">Points Expiration (days)</label>
          <p className="text-gray-500 text-xs mb-2">0 = points never expire</p>
          <input
            type="number"
            min={0}
            value={form.points_expiration_days}
            onChange={e => update('points_expiration_days', e.target.value)}
            className="w-40 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>

        <div className="flex justify-end pt-2">
          <GradientButton onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </GradientButton>
        </div>
      </div>
    </div>
  )
}

// ── Tab 3: User Wallets ──────────────────────────────────────

function AwardDeductModal({ mode, user, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isAward = mode === 'award'

  async function handleConfirm() {
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      if (isAward) {
        await TxpService.adminAward(user.id, amt, reason)
      } else {
        await TxpService.adminDeduct(user.id, amt, reason)
      }
      toast.success(`${isAward ? 'Awarded' : 'Deducted'} ${amt.toLocaleString()} TXP ${isAward ? 'to' : 'from'} ${user.full_name || user.email}`)
      onDone()
    } catch (err) {
      toast.error(err.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900/95 border border-gray-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            {isAward ? <Plus className="w-4 h-4 text-green-400" /> : <Minus className="w-4 h-4 text-red-400" />}
            {isAward ? 'Award' : 'Deduct'} TXP
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-gray-400 text-sm mb-4">{user.full_name || 'Unnamed'} — {user.email}</p>

        <label className="text-[11px] text-gray-500 uppercase tracking-wide">Amount</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="e.g. 100"
          autoFocus
          className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50 mb-3"
        />

        <label className="text-[11px] text-gray-500 uppercase tracking-wide">Reason</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Customer support goodwill credit"
          rows={2}
          className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50 mb-4 resize-none"
        />

        <div className="flex gap-2 justify-end">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <GradientButton onClick={handleConfirm} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Confirm
          </GradientButton>
        </div>
      </div>
    </div>
  )
}

function tierForBalance(lifetimeEarned) {
  const n = Number(lifetimeEarned) || 0
  if (n >= 5000) return { label: 'Elite', cls: 'bg-yellow-500/20 text-yellow-400' }
  if (n >= 2000) return { label: 'VIP', cls: 'bg-purple-500/20 text-purple-400' }
  if (n >= 500) return { label: 'Insider', cls: 'bg-blue-500/20 text-blue-400' }
  return { label: 'Explorer', cls: 'bg-gray-700/40 text-gray-300' }
}

function UserLedger({ userId }) {
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    TxpService.getUserTransactions(userId, 50)
      .then(data => { if (active) setTxns(data) })
      .catch(err => toast.error(err.message || 'Failed to load ledger'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId])

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-pink-500 animate-spin" /></div>

  if (!txns.length) return <p className="text-gray-500 text-sm text-center py-6">No transactions yet</p>

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {txns.map(t => (
        <div key={t.id} className="flex items-center justify-between text-xs border-b border-gray-800 pb-2">
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{TxpService.reasonLabel(t.reason)}</p>
            <p className="text-gray-500">{new Date(t.created_at).toLocaleString()} · {t.status}</p>
          </div>
          <p className={`font-bold flex-shrink-0 ml-2 ${t.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}

function WalletsTab() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [modal, setModal] = useState(null) // { mode: 'award'|'deduct', user }

  const load = useCallback(async (q) => {
    setLoading(true)
    try {
      const data = await TxpService.searchUsers(q)
      setUsers(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load('') }, [load])

  useEffect(() => {
    const timeout = setTimeout(() => load(query), 300)
    return () => clearTimeout(timeout)
  }, [query, load])

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {users.map(u => {
            const tier = tierForBalance(u.wallet?.lifetime_earned)
            const expanded = expandedId === u.id
            return (
              <div key={u.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4 flex flex-wrap items-center gap-4 justify-between">
                  <button
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    onClick={() => setExpandedId(expanded ? null : u.id)}
                  >
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{u.full_name || 'Unnamed'}</p>
                      <p className="text-gray-500 text-xs truncate">{u.email}</p>
                    </div>
                  </button>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${tier.cls}`}>{tier.label}</span>

                  <div className="text-right">
                    <p className="text-white font-bold text-sm flex items-center gap-1 justify-end">
                      <Coins className="w-3.5 h-3.5 text-yellow-400" /> {(u.wallet?.available || 0).toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-[11px]">{(u.wallet?.pending || 0).toLocaleString()} pending</p>
                  </div>

                  <div className="flex gap-2">
                    <SecondaryButton onClick={() => setModal({ mode: 'award', user: u })}>
                      <Plus className="w-3.5 h-3.5" /> Award
                    </SecondaryButton>
                    <SecondaryButton onClick={() => setModal({ mode: 'deduct', user: u })}>
                      <Minus className="w-3.5 h-3.5" /> Deduct
                    </SecondaryButton>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-gray-800 p-4">
                    <UserLedger userId={u.id} />
                  </div>
                )}
              </div>
            )
          })}
          {users.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-12">No users found</p>
          )}
        </div>
      )}

      {modal && (
        <AwardDeductModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(query) }}
        />
      )}
    </div>
  )
}

// ── Tab 4: Campaigns ─────────────────────────────────────────

function CampaignForm({ initial, onCancel, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [milestoneCount, setMilestoneCount] = useState(initial?.milestone_count ?? 5)
  const [bonusPoints, setBonusPoints] = useState(initial?.bonus_points ?? 500)
  const [isActive, setIsActive] = useState(initial ? !!initial.is_active : true)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Campaign name is required')
      return
    }
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        milestone_count: Number(milestoneCount) || 0,
        bonus_points: Number(bonusPoints) || 0,
        is_active: isActive,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide">Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide">Milestone (referrals)</label>
          <input
            type="number"
            min={1}
            value={milestoneCount}
            onChange={e => setMilestoneCount(e.target.value)}
            className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wide">Bonus Points</label>
          <input
            type="number"
            min={1}
            value={bonusPoints}
            onChange={e => setBonusPoints(e.target.value)}
            className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <button
          type="button"
          onClick={() => setIsActive(v => !v)}
          className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-gradient-to-r from-pink-500 to-cyan-500' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'left-5' : 'left-0.5'}`} />
        </button>
        <span className="text-sm text-gray-300">{isActive ? 'Active' : 'Inactive'}</span>
      </label>

      <div className="flex gap-2 justify-end pt-1">
        <SecondaryButton onClick={onCancel} disabled={saving}>Cancel</SecondaryButton>
        <GradientButton type="submit" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </GradientButton>
      </div>
    </form>
  )
}

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await TxpService.getAllCampaigns()
      setCampaigns(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(data) {
    try {
      await TxpService.createCampaign(data)
      toast.success('Campaign created')
      setCreating(false)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to create campaign')
    }
  }

  async function handleUpdate(id, data) {
    try {
      await TxpService.updateCampaign(id, data)
      toast.success('Campaign updated')
      setEditingId(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to update campaign')
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await TxpService.deleteCampaign(id)
      toast.success('Campaign deleted')
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to delete campaign')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!creating && (
          <GradientButton onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> New Campaign
          </GradientButton>
        )}
      </div>

      {creating && (
        <CampaignForm onCancel={() => setCreating(false)} onSave={handleCreate} />
      )}

      <div className="space-y-3">
        {campaigns.map(c => (
          editingId === c.id ? (
            <CampaignForm
              key={c.id}
              initial={c}
              onCancel={() => setEditingId(null)}
              onSave={(data) => handleUpdate(c.id, data)}
            />
          ) : (
            <div key={c.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm">{c.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/40 text-gray-400'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {c.description && <p className="text-gray-500 text-xs mt-1">{c.description}</p>}
                <p className="text-gray-400 text-xs mt-2">
                  {c.milestone_count} referrals → <span className="text-pink-400 font-bold">{Number(c.bonus_points).toLocaleString()} TXP</span>
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <SecondaryButton onClick={() => setEditingId(c.id)}><Edit3 className="w-3.5 h-3.5" /></SecondaryButton>
                <SecondaryButton onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}>
                  {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </SecondaryButton>
              </div>
            </div>
          )
        ))}
        {campaigns.length === 0 && !creating && (
          <p className="text-gray-500 text-sm text-center py-12">No campaigns yet — create one above</p>
        )}
      </div>
    </div>
  )
}

// ── Tab 5: Fraud & Audit (Phase 10) ─────────────────────────

function SeverityBadge({ severity }) {
  const cls = {
    low: 'bg-gray-700/40 text-gray-300',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  }[severity] || 'bg-gray-700/40 text-gray-300'
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cls}`}>{severity}</span>
}

function useActorName() {
  const [actorName, setActorName] = useState(() => localStorage.getItem(ADMIN_ACTOR_KEY) || 'admin')
  function update(name) {
    setActorName(name)
    localStorage.setItem(ADMIN_ACTOR_KEY, name || 'admin')
  }
  return [actorName, update]
}

function FraudFlagRow({ flag, actorName, onResolved }) {
  const [noteMode, setNoteMode] = useState(null) // 'resolved' | 'dismissed' | null
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(status) {
    setSubmitting(true)
    try {
      await TxpService.resolveFraudFlag(flag.id, status, note, actorName || 'admin')
      toast.success(`Flag ${status}`)
      onResolved()
    } catch (err) {
      toast.error(err.message || 'Failed to update flag')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-semibold text-sm">{flag.profile?.full_name || 'Unnamed'}</p>
            <span className="text-gray-500 text-xs">{flag.profile?.email}</span>
            <SeverityBadge severity={flag.severity} />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-500/20 text-purple-300">
              {flag.flag_type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1.5">{flag.reason}</p>
          <p className="text-gray-600 text-[11px] mt-1">{new Date(flag.created_at).toLocaleString()}</p>
        </div>

        {!noteMode && (
          <div className="flex gap-2 flex-shrink-0">
            <SecondaryButton onClick={() => setNoteMode('resolved')}><Check className="w-3.5 h-3.5" /> Resolve</SecondaryButton>
            <SecondaryButton onClick={() => setNoteMode('dismissed')}><X className="w-3.5 h-3.5" /> Dismiss</SecondaryButton>
          </div>
        )}
      </div>

      {noteMode && (
        <div className="mt-3 border-t border-gray-800 pt-3 flex flex-col sm:flex-row gap-2">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note..."
            autoFocus
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
          />
          <div className="flex gap-2 flex-shrink-0">
            <SecondaryButton onClick={() => { setNoteMode(null); setNote('') }} disabled={submitting}>Cancel</SecondaryButton>
            <GradientButton onClick={() => handleSubmit(noteMode)} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirm {noteMode === 'resolved' ? 'Resolve' : 'Dismiss'}
            </GradientButton>
          </div>
        </div>
      )}
    </div>
  )
}

function FraudFlagsPanel({ actorName }) {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await TxpService.getFraudFlags('open')
      setFlags(data)
    } catch (err) {
      toast.error(err.message || 'Failed to load fraud flags')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /></div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-pink-400" />
        <h2 className="text-white font-bold text-sm">Open Fraud Flags</h2>
      </div>
      {flags.map(flag => (
        <FraudFlagRow key={flag.id} flag={flag} actorName={actorName} onResolved={load} />
      ))}
      {flags.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">No open fraud flags 🎉</p>
      )}
    </div>
  )
}

function FreezeModal({ user, onClose, onDone, actorName }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await TxpService.adminFreezeWallet(user.id, reason, actorName || 'admin')
      toast.success(`Froze ${user.full_name || user.email}'s wallet`)
      onDone()
    } catch (err) {
      toast.error(err.message || 'Failed to freeze wallet')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900/95 border border-gray-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-cyan-400" /> Freeze Wallet
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-gray-400 text-sm mb-4">{user.full_name || 'Unnamed'} — {user.email}</p>

        <label className="text-[11px] text-gray-500 uppercase tracking-wide">Reason</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Suspected mass-referral abuse"
          rows={2}
          autoFocus
          className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50 mb-4 resize-none"
        />

        <div className="flex gap-2 justify-end">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <GradientButton onClick={handleConfirm} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Confirm Freeze
          </GradientButton>
        </div>
      </div>
    </div>
  )
}

function AuditTrailPanel({ userId }) {
  const [trail, setTrail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    TxpService.getFullUserAuditTrail(userId, 50)
      .then(data => { if (active) setTrail(data) })
      .catch(err => toast.error(err.message || 'Failed to load audit trail'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId])

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-pink-500 animate-spin" /></div>
  }
  if (!trail) return null

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">Transactions</p>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {trail.transactions.map(t => (
            <div key={t.id} className="text-xs border-b border-gray-800 pb-2">
              <p className="text-white font-semibold">{TxpService.reasonLabel(t.reason)}</p>
              <p className="text-gray-500">{new Date(t.created_at).toLocaleString()} · {t.status}</p>
              <p className={`font-bold ${t.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>{t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString()}</p>
            </div>
          ))}
          {trail.transactions.length === 0 && <p className="text-gray-600 text-xs">No transactions</p>}
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">Audit Log</p>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {trail.auditLog.map(a => (
            <div key={a.id} className="text-xs border-b border-gray-800 pb-2">
              <p className="text-white font-semibold">{a.action.replace(/_/g, ' ')}</p>
              <p className="text-gray-500">{new Date(a.created_at).toLocaleString()} · by {a.actor || 'unknown'}</p>
            </div>
          ))}
          {trail.auditLog.length === 0 && <p className="text-gray-600 text-xs">No audit entries</p>}
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">Fraud Flags</p>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {trail.fraudFlags.map(f => (
            <div key={f.id} className="text-xs border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold">{f.flag_type.replace(/_/g, ' ')}</p>
                <SeverityBadge severity={f.severity} />
              </div>
              <p className="text-gray-500">{f.reason}</p>
              <p className="text-gray-600">{new Date(f.created_at).toLocaleString()} · {f.status}</p>
            </div>
          ))}
          {trail.fraudFlags.length === 0 && <p className="text-gray-600 text-xs">No fraud flags</p>}
        </div>
      </div>
    </div>
  )
}

function UserInvestigationPanel({ actorName }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [freezeModalUser, setFreezeModalUser] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async (q) => {
    if (!q.trim()) { setUsers([]); return }
    setLoading(true)
    try {
      const data = await TxpService.searchUsers(q)
      setUsers(data)
    } catch (err) {
      toast.error(err.message || 'Failed to search users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => load(query), 300)
    return () => clearTimeout(timeout)
  }, [query, load])

  async function refreshSelected() {
    if (!selected) return
    const data = await TxpService.searchUsers(selected.full_name || selected.email || '')
    const match = data.find(u => u.id === selected.id)
    if (match) setSelected(match)
  }

  async function handleUnfreeze(user) {
    setBusyId(user.id)
    try {
      await TxpService.adminUnfreezeWallet(user.id, actorName || 'admin')
      toast.success(`Unfroze ${user.full_name || user.email}'s wallet`)
      await refreshSelected()
    } catch (err) {
      toast.error(err.message || 'Failed to unfreeze wallet')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-pink-400" />
        <h2 className="text-white font-bold text-sm">User Investigation</h2>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
        />
      </div>

      {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-pink-500 animate-spin" /></div>}

      {!selected && users.length > 0 && (
        <div className="space-y-2">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className="w-full text-left bg-gray-900/50 border border-gray-800 rounded-xl p-3 hover:border-pink-500/40 transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{u.full_name || 'Unnamed'}</p>
                <p className="text-gray-500 text-xs truncate">{u.email}</p>
              </div>
              {u.wallet?.is_frozen && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-cyan-500/20 text-cyan-300 flex items-center gap-1 flex-shrink-0">
                  <Snowflake className="w-3 h-3" /> Frozen
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-white font-bold text-sm">{selected.full_name || 'Unnamed'}</p>
              <p className="text-gray-500 text-xs">{selected.email}</p>
            </div>
            <SecondaryButton onClick={() => setSelected(null)}>Back to search</SecondaryButton>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/40 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-[11px] uppercase">Available</p>
              <p className="text-white font-bold">{(selected.wallet?.available || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-[11px] uppercase">Pending</p>
              <p className="text-white font-bold">{(selected.wallet?.pending || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-[11px] uppercase">Lifetime</p>
              <p className="text-white font-bold">{(selected.wallet?.lifetime_earned || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-800 pt-4">
            <div>
              {selected.wallet?.is_frozen ? (
                <p className="text-cyan-300 text-xs flex items-center gap-1.5">
                  <Snowflake className="w-3.5 h-3.5" /> Frozen{selected.wallet.frozen_reason ? `: ${selected.wallet.frozen_reason}` : ''}
                </p>
              ) : (
                <p className="text-gray-500 text-xs">Wallet is active</p>
              )}
            </div>
            {selected.wallet?.is_frozen ? (
              <SecondaryButton onClick={() => handleUnfreeze(selected)} disabled={busyId === selected.id}>
                {busyId === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                Unfreeze
              </SecondaryButton>
            ) : (
              <SecondaryButton onClick={() => setFreezeModalUser(selected)}>
                <Snowflake className="w-3.5 h-3.5" /> Freeze
              </SecondaryButton>
            )}
          </div>

          <div className="border-t border-gray-800 pt-4">
            <AuditTrailPanel userId={selected.id} />
          </div>
        </div>
      )}

      {freezeModalUser && (
        <FreezeModal
          user={freezeModalUser}
          actorName={actorName}
          onClose={() => setFreezeModalUser(null)}
          onDone={async () => { setFreezeModalUser(null); await refreshSelected() }}
        />
      )}
    </div>
  )
}

function FraudAuditTab() {
  const [actorName, setActorName] = useActorName()

  return (
    <div className="space-y-8">
      <div className="max-w-sm">
        <label className="text-[11px] text-gray-500 uppercase tracking-wide">Your name (for audit log)</label>
        <input
          value={actorName}
          onChange={e => setActorName(e.target.value)}
          placeholder="admin"
          className="mt-1 w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
        />
      </div>

      <FraudFlagsPanel actorName={actorName} />

      <div className="border-t border-gray-800 pt-6">
        <UserInvestigationPanel actorName={actorName} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function AdminTxp() {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1')
  const [tab, setTab] = useState('rules')

  if (!isAdmin) {
    return <PasscodeGate onUnlock={() => setIsAdmin(true)} />
  }

  return (
    <div className="min-h-screen bg-[#050510]">
      <div className="sticky top-0 z-30 bg-[#050510]/90 backdrop-blur border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-400 hover:text-white flex-shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
            <Shield className="w-5 h-5 text-pink-500" />
            <h1 className="text-white font-extrabold text-lg tracking-wide">TXP Admin</h1>
          </div>
          <Link to="/" className="text-gray-500 hover:text-white text-sm">Back to site</Link>
        </div>

        <div className="max-w-6xl mx-auto mt-4 flex gap-1 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 text-white border border-pink-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {tab === 'rules' && <RulesTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'wallets' && <WalletsTab />}
        {tab === 'campaigns' && <CampaignsTab />}
        {tab === 'fraud' && <FraudAuditTab />}
      </div>
    </div>
  )
}
