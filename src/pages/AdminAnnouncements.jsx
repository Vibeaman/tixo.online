import React, { useCallback, useEffect, useState } from 'react'
import {
  Megaphone, Plus, Trash2, Edit3, X, Save, Loader2,
  CheckCircle2, AlertTriangle, AlertOctagon, Power,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import AnnouncementService from '../services/AnnouncementService'

const LEVELS = [
  { id: 'info', label: 'Info', icon: Megaphone, cls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'success', label: 'Success', icon: CheckCircle2, cls: 'text-green-400 bg-green-500/10 border-green-500/30' },
  { id: 'warning', label: 'Warning', icon: AlertTriangle, cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  { id: 'critical', label: 'Critical', icon: AlertOctagon, cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
]

function LevelBadge({ level }) {
  const l = LEVELS.find(x => x.id === level) || LEVELS[0]
  const Icon = l.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${l.cls}`}>
      <Icon className="w-3 h-3" />
      {l.label}
    </span>
  )
}

function AnnouncementForm({ initial, onCancel, onSaved }) {
  const [message, setMessage] = useState(initial?.message || '')
  const [level, setLevel] = useState(initial?.level || 'info')
  const [linkUrl, setLinkUrl] = useState(initial?.link_url || '')
  const [linkLabel, setLinkLabel] = useState(initial?.link_label || '')
  const [endsAt, setEndsAt] = useState(initial?.ends_at ? initial.ends_at.slice(0, 16) : '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!message.trim()) {
      toast.error('Message is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        message: message.trim(),
        level,
        linkUrl: linkUrl.trim(),
        linkLabel: linkLabel.trim(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      }
      if (initial) {
        await AnnouncementService.update(initial.id, payload)
        toast.success('Announcement updated')
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        await AnnouncementService.create({ ...payload, createdBy: user?.id })
        toast.success('Announcement posted — live on the site now')
      }
      onSaved()
    } catch (e) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div>
        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          placeholder="e.g. Scheduled maintenance tonight from 11pm–1am WAT. Ticket purchases may be briefly unavailable."
          className="w-full mt-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500/50"
        />
      </div>

      <div>
        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2 block">Type</label>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map(l => {
            const Icon = l.icon
            const active = level === l.id
            return (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  active ? l.cls : 'text-gray-500 bg-gray-800/50 border-gray-700 hover:text-gray-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {l.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Link URL (optional)</label>
          <input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://... or /events"
            className="w-full mt-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Link Label (optional)</label>
          <input
            value={linkLabel}
            onChange={e => setLinkLabel(e.target.value)}
            placeholder="Learn more"
            className="w-full mt-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500/50"
          />
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Auto-expire at (optional)</label>
        <input
          type="datetime-local"
          value={endsAt}
          onChange={e => setEndsAt(e.target.value)}
          className="w-full mt-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500/50"
        />
        <p className="text-gray-600 text-xs mt-1">Leave blank to keep it live until you deactivate or delete it.</p>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initial ? 'Save changes' : 'Post announcement'}
        </button>
      </div>
    </div>
  )
}

export function AdminAnnouncementsPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    return AnnouncementService.getAll()
      .then(setItems)
      .catch(e => toast.error(e.message || 'Failed to load announcements'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(item) {
    try {
      await AnnouncementService.update(item.id, { isActive: !item.is_active })
      toast.success(item.is_active ? 'Announcement deactivated' : 'Announcement activated')
      load()
    } catch (e) {
      toast.error(e.message || 'Failed to update')
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Delete this announcement permanently?')) return
    try {
      await AnnouncementService.remove(item.id)
      toast.success('Announcement deleted')
      load()
    } catch (e) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-pink-400" />
            Announcements
          </h2>
          <p className="text-gray-500 text-sm">Post a banner that shows across every page for all visitors.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      {showForm && (
        <AnnouncementForm
          initial={editing}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); load() }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const expired = item.ends_at && new Date(item.ends_at) < new Date()
            const live = item.is_active && !expired
            return (
              <div key={item.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <LevelBadge level={item.level} />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        live ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        {live ? 'Live' : expired ? 'Expired' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium">{item.message}</p>
                    {item.link_url && (
                      <p className="text-gray-500 text-xs mt-1">Link: {item.link_url} {item.link_label ? `("${item.link_label}")` : ''}</p>
                    )}
                    <p className="text-gray-600 text-xs mt-1">
                      Posted {new Date(item.created_at).toLocaleString()}
                      {item.ends_at ? ` · Expires ${new Date(item.ends_at).toLocaleString()}` : ' · No expiry'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(item)}
                      title={item.is_active ? 'Deactivate' : 'Activate'}
                      className={`p-2 rounded-lg hover:bg-white/5 ${item.is_active ? 'text-green-400' : 'text-gray-500'}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditing(item); setShowForm(true) }}
                      title="Edit"
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      title="Delete"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminAnnouncementsPanel
