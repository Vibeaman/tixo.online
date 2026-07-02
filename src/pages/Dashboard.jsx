import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Ticket, Calendar, User, LogOut, MapPin, Plus, Trash2, Edit3, Video, Globe, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import AuthService from '../services/AuthService'
import EventService from '../services/EventService'
import TicketService from '../services/TicketService'
import UserService from '../services/UserService'

const TABS = [
  { id: 'tickets', label: 'My Tickets', icon: Ticket },
  { id: 'events', label: 'My Events', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: User },
]

function EventTypeBadge({ type }) {
  if (type === 'virtual') return <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Virtual</span>
  if (type === 'hybrid') return <span className="text-[10px] font-bold bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Hybrid</span>
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading, setProfile } = useAuth()
  const [tab, setTab] = useState('tickets')
  const [tickets, setTickets] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return }
    if (!user) return
    async function load() {
      try {
        const [t, e] = await Promise.all([
          TicketService.getByUser(user.id),
          EventService.getByOrganizer(user.id)
        ])
        setTickets(t || [])
        setMyEvents(e || [])
        if (profile) setProfileForm({ full_name: profile.full_name || '', email: profile.email || '' })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user, authLoading, profile])

  async function handleLogout() {
    await AuthService.logout()
    toast.success('Logged out')
    navigate('/')
  }

  async function handleDeleteEvent(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try {
      await EventService.delete(id)
      setMyEvents(ev => ev.filter(e => e.id !== id))
      toast.success('Event deleted')
    } catch (e) { toast.error(e.message) }
  }

  async function handleUpdateProfile() {
    try {
      const updated = await UserService.updateProfile(user.id, { full_name: profileForm.full_name })
      setProfile(updated)
      toast.success('Profile updated!')
    } catch (e) { toast.error(e.message) }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const avatarUrl = await UserService.uploadAvatar(user.id, file)
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
      toast.success('Profile picture updated!')
    } catch (e) {
      toast.error(e.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (authLoading || loading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>

  const avatarUrl = profile?.avatar_url

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header with avatar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-14 h-14 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-400 text-xl font-bold overflow-hidden border-2 border-purple-500/30">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (profile?.full_name || user?.email || 'U')[0].toUpperCase()
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400">Welcome back, {profile?.full_name || user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${tab === t.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Tickets tab */}
        {tab === 'tickets' && (
          <div>
            {tickets.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No tickets yet</p>
                <Link to="/events" className="text-purple-400 hover:text-purple-300 font-medium">Browse Events →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map(t => (
                  <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-purple-500/30 transition cursor-pointer"
                    onClick={() => navigate(`/events/${t.event_id}`)}>
                    <div>
                      <h3 className="text-white font-bold">{t.event_title}</h3>
                      <p className="text-gray-400 text-sm">{t.tier_name} · x{t.quantity}</p>
                      <p className="text-gray-500 text-xs mt-1">{new Date(t.purchased_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-400 font-bold">₦{Number(t.total_price).toLocaleString()}</p>
                      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Confirmed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Events tab */}
        {tab === 'events' && (
          <div>
            <div className="flex justify-end mb-4">
              <Link to="/create" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors">
                <Plus className="w-4 h-4" /> New Event
              </Link>
            </div>
            {myEvents.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">You haven't created any events</p>
                <Link to="/create" className="text-purple-400 hover:text-purple-300 font-medium">Create Your First Event →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myEvents.map(ev => (
                  <div key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => navigate(`/events/${ev.id}`)}>
                      {ev.image && <img src={ev.image} alt="" className="w-16 h-16 rounded-lg object-cover hidden sm:block flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-bold truncate">{ev.title}</h3>
                          <EventTypeBadge type={ev.event_type} />
                        </div>
                        <p className="text-gray-400 text-sm flex items-center gap-1"><Calendar className="w-3 h-3" />{ev.date}{ev.end_date && ev.end_date !== ev.date ? ` – ${ev.end_date}` : ''}</p>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                          {ev.event_type === 'virtual' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {ev.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <button onClick={() => navigate(`/edit-event/${ev.id}`)}
                        className="text-purple-400 hover:text-purple-300 p-2 hover:bg-white/5 rounded-lg transition" title="Edit event">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteEvent(ev.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-white/5 rounded-lg transition" title="Delete event">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-lg">
            <h2 className="text-xl font-bold text-white mb-6">Your Profile</h2>

            {/* Avatar upload */}
            <div className="flex items-center gap-5 mb-8">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="w-20 h-20 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-400 text-2xl font-bold overflow-hidden border-2 border-purple-500/30">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (profile?.full_name || user?.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-white font-semibold">Profile Picture</p>
                <p className="text-gray-500 text-sm">Click to upload · JPG, PNG · Max 2MB</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Full Name</label>
                <input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Email</label>
                <input value={user?.email || ''} disabled className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" />
              </div>
              <button onClick={handleUpdateProfile}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
