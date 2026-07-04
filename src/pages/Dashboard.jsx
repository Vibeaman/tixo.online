import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Ticket, Calendar, User, LogOut, MapPin, Plus, Trash2, Edit3, Video, Globe, Camera, Share2, TrendingUp, DollarSign, Eye, MousePointer, Users, ExternalLink, BarChart3, PieChart, Activity, ArrowUpRight, CheckCircle2, ScanLine, X, Clock, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import AuthService from '../services/AuthService'
import EventService from '../services/EventService'
import TicketService from '../services/TicketService'
import UserService from '../services/UserService'
import ReferralService from '../services/ReferralService'

const BASE_TABS = [
  { id: 'tickets', label: 'My Tickets', icon: Ticket },
  { id: 'events', label: 'My Events', icon: Calendar },
  { id: 'checkin', label: 'Check-in', icon: ScanLine },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'referrals', label: 'Referrals', icon: Share2 },
  { id: 'profile', label: 'Profile', icon: User },
]

function EventTypeBadge({ type }) {
  if (type === 'virtual') return <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Virtual</span>
  if (type === 'hybrid') return <span className="text-[10px] font-bold bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Hybrid</span>
  return null
}

function StatCard({ icon: Icon, label, value, color = 'text-purple-400', sub }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-gray-500 text-xs">{label}</span>
      </div>
      <p className="text-white font-bold text-xl">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// Simple bar chart component
function BarChart({ data, labelKey, valueKey, color = 'bg-purple-500' }) {
  if (!data || data.length === 0) return <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
  const maxVal = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0
        const pct = (val / maxVal) * 100
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-20 truncate flex-shrink-0">{d[labelKey]}</span>
            <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
              <div className={`${color} h-full rounded-full flex items-center justify-end pr-2 transition-all`}
                style={{ width: `${Math.max(pct, 8)}%` }}>
                <span className="text-white text-[10px] font-bold">{typeof val === 'number' && val >= 1000 ? `₦${(val/1000).toFixed(1)}k` : val.toLocaleString?.() || val}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// QR Code Modal overlay
function QRModal({ ticket, onClose }) {
  if (!ticket) return null
  const qrRef = useRef(null)

  function handleDownload() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      // Add padding and event info to the ticket image
      const pad = 40, infoH = 120
      canvas.width = img.width + pad * 2
      canvas.height = img.height + pad * 2 + infoH
      // Background
      ctx.fillStyle = '#12121a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // QR white background
      ctx.fillStyle = '#ffffff'
      ctx.roundRect(pad - 12, pad - 12, img.width + 24, img.height + 24, 12)
      ctx.fill()
      ctx.drawImage(img, pad, pad)
      // Event title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(ticket.event_title || 'Event Ticket', canvas.width / 2, img.height + pad * 2 + 20)
      // Tier + code
      ctx.fillStyle = '#a78bfa'
      ctx.font = 'bold 22px monospace'
      ctx.fillText(ticket.check_in_code || '', canvas.width / 2, img.height + pad * 2 + 55)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px sans-serif'
      ctx.fillText(ticket.tier_name ? `${ticket.tier_name} · x${ticket.quantity}` : '', canvas.width / 2, img.height + pad * 2 + 80)
      ctx.fillText('Planam Events', canvas.width / 2, img.height + pad * 2 + 105)
      // Download
      const link = document.createElement('a')
      link.download = `planam-ticket-${ticket.check_in_code || 'qr'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-white font-bold text-lg mb-1 text-center">{ticket.event_title}</h3>
        <p className="text-gray-400 text-sm text-center mb-6">{ticket.tier_name} · x{ticket.quantity}</p>
        <div className="flex justify-center mb-4" ref={qrRef}>
          <div className="bg-white rounded-xl p-4">
            <QRCodeSVG value={ticket.check_in_code || ticket.id} size={200} level="H" />
          </div>
        </div>
        <p className="text-center text-purple-400 font-mono font-bold text-lg tracking-wider mb-2">{ticket.check_in_code || '—'}</p>
        <button onClick={handleDownload}
          className="w-full mt-2 mb-3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Download className="w-5 h-5" /> Download Ticket QR
        </button>
        {ticket.checked_in ? (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-green-400 bg-green-500/20 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Checked In
            </span>
            {ticket.checked_in_at && (
              <span className="text-gray-500 text-xs">{new Date(ticket.checked_in_at).toLocaleString()}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center mt-2">
            <span className="text-amber-400 bg-amber-500/20 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Pending
            </span>
          </div>
        )}
      </div>
    </div>
  )
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

  // QR modal state
  const [qrTicket, setQrTicket] = useState(null)

  // Check-in stats state
  const [checkInStats, setCheckInStats] = useState([])
  const [loadingCheckIn, setLoadingCheckIn] = useState(false)

  // Publishing state
  const [publishingId, setPublishingId] = useState(null)

  // Referral state
  const [referralLinks, setReferralLinks] = useState([])
  const [commissions, setCommissions] = useState([])
  const [loadingReferrals, setLoadingReferrals] = useState(false)
  const [selectedEventStats, setSelectedEventStats] = useState(null)
  const [loadingEventStats, setLoadingEventStats] = useState(false)

  // Analytics state
  const [salesSummary, setSalesSummary] = useState([])
  const [dailySales, setDailySales] = useState([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

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

  // Load referral data
  useEffect(() => {
    if (tab === 'referrals' && user) loadReferralData()
  }, [tab, user])

  // Load analytics data
  useEffect(() => {
    if (tab === 'analytics' && user) loadAnalyticsData()
  }, [tab, user])

  // Load check-in stats
  useEffect(() => {
    if (tab === 'checkin' && user) loadCheckInStats()
  }, [tab, user])

  async function loadCheckInStats() {
    setLoadingCheckIn(true)
    try {
      const stats = await TicketService.getCheckInStats(user.id)
      setCheckInStats(stats || [])
    } catch (e) { console.error(e) }
    finally { setLoadingCheckIn(false) }
  }

  async function loadReferralData() {
    setLoadingReferrals(true)
    try {
      const [links, comms] = await Promise.all([
        ReferralService.getUserLinks(user.id),
        ReferralService.getUserCommissions(user.id)
      ])
      setReferralLinks(links || [])
      setCommissions(comms || [])
    } catch (e) { console.error(e) }
    finally { setLoadingReferrals(false) }
  }

  async function loadAnalyticsData() {
    setLoadingAnalytics(true)
    try {
      const [summary, daily] = await Promise.all([
        TicketService.getOrganizerSummary(user.id),
        TicketService.getDailySales(user.id)
      ])
      setSalesSummary(summary || [])
      setDailySales(daily || [])
    } catch (e) { console.error(e) }
    finally { setLoadingAnalytics(false) }
  }

  async function loadEventReferralStats(eventId) {
    setLoadingEventStats(true)
    try {
      const stats = await ReferralService.getEventReferralStats(eventId)
      setSelectedEventStats({ eventId, ...stats })
    } catch (e) { toast.error('Failed to load stats') }
    finally { setLoadingEventStats(false) }
  }

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

  async function handlePublishEvent(id) {
    setPublishingId(id)
    try {
      const updated = await EventService.publish(id)
      setMyEvents(evs => evs.map(ev => ev.id === id ? { ...ev, ...updated, status: 'published' } : ev))
      toast.success('Event published successfully!')
    } catch (e) { toast.error(e.message || 'Failed to publish event') }
    finally { setPublishingId(null) }
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
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setUploadingAvatar(true)
    try {
      const avatarUrl = await UserService.uploadAvatar(user.id, file)
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
      toast.success('Profile picture updated!')
    } catch (e) {
      toast.error(e.message || 'Failed to upload avatar')
    } finally { setUploadingAvatar(false) }
  }

  if (authLoading || loading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>

  const avatarUrl = profile?.avatar_url

  // Filter tabs: only show check-in tab if user has events (is an organizer)
  const TABS = BASE_TABS.filter(t => t.id !== 'checkin' || myEvents.length > 0)

  // Separate draft and published events
  const draftEvents = myEvents.filter(ev => ev.status === 'draft')
  const publishedEvents = myEvents.filter(ev => ev.status !== 'draft')

  // Referral stats
  const totalClicks = referralLinks.reduce((sum, l) => sum + (l.clicks || 0), 0)
  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
  const confirmedEarnings = commissions.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
  const pendingEarnings = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
  const reshareEvents = myEvents.filter(e => e.reshare_enabled)

  // Analytics stats
  const totalRevenue = salesSummary.reduce((sum, s) => sum + Number(s.total_revenue || 0), 0)
  const totalTicketsSold = salesSummary.reduce((sum, s) => sum + Number(s.total_quantity || 0), 0)
  const totalRsvps = salesSummary.reduce((sum, s) => sum + Number(s.total_rsvps || 0), 0)
  const totalVirtualAttendees = salesSummary.reduce((sum, s) => sum + Number(s.virtual_attendees || 0), 0)
  const totalInPersonAttendees = salesSummary.reduce((sum, s) => sum + Number(s.inperson_attendees || 0), 0)

  // For bar charts
  const revenueByEvent = salesSummary
    .filter(s => Number(s.total_revenue) > 0)
    .sort((a, b) => Number(b.total_revenue) - Number(a.total_revenue))
    .slice(0, 8)
    .map(s => ({ label: s.event_title?.substring(0, 20) || 'Event', value: Number(s.total_revenue) }))

  const ticketsByEvent = salesSummary
    .filter(s => Number(s.total_quantity) > 0)
    .sort((a, b) => Number(b.total_quantity) - Number(a.total_quantity))
    .slice(0, 8)
    .map(s => ({ label: s.event_title?.substring(0, 20) || 'Event', value: Number(s.total_quantity) }))

  const recentDailySales = dailySales.slice(-14).map(d => ({
    label: new Date(d.sale_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    value: Number(d.revenue)
  }))

  // Check-in totals
  const totalCheckedIn = checkInStats.reduce((sum, s) => sum + Number(s.checked_in_count || 0), 0)
  const totalTicketsAll = checkInStats.reduce((sum, s) => sum + Number(s.total_tickets || 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* QR Modal */}
        {qrTicket && <QRModal ticket={qrTicket} onClose={() => setQrTicket(null)} />}

        {/* Header */}
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
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
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

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${tab === t.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* ============ TICKETS TAB ============ */}
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
                  <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-purple-500/30 transition">
                    <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => navigate(`/events/${t.event_id}`)}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-bold">{t.event_title}</h3>
                          {t.is_rsvp && <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">RSVP</span>}
                          {t.attendance_mode === 'virtual' && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Virtual</span>}
                          {/* Check-in status badge */}
                          {t.checked_in ? (
                            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Checked In
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> Pending
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{t.tier_name} · x{t.quantity}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(t.purchased_at).toLocaleDateString()}
                          {t.checked_in && t.checked_in_at && (
                            <span className="text-green-500 ml-2">· Checked in {new Date(t.checked_in_at).toLocaleString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      {/* QR Code thumbnail */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setQrTicket(t) }}
                        className="bg-white rounded-lg p-1.5 hover:scale-105 transition-transform cursor-pointer flex-shrink-0"
                        title="View QR code"
                      >
                        <QRCodeSVG value={t.check_in_code || t.id} size={48} level="M" />
                      </button>
                      <div className="text-right">
                        {t.is_rsvp ? (
                          <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Free</span>
                        ) : (
                          <p className="text-purple-400 font-bold">₦{Number(t.total_price).toLocaleString()}</p>
                        )}
                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Confirmed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ MY EVENTS TAB ============ */}
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
                {/* Drafts Section */}
                {draftEvents.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider">Drafts</h3>
                      <div className="flex-1 h-px bg-amber-500/20" />
                      <span className="text-amber-400/60 text-xs">{draftEvents.length} draft{draftEvents.length !== 1 ? 's' : ''}</span>
                    </div>
                    {draftEvents.map(ev => (
                      <div key={ev.id} className="bg-white/5 border border-amber-500/20 rounded-xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => navigate(`/events/${ev.id}`)}>
                          {ev.image && <img src={ev.image} alt="" className="w-16 h-16 rounded-lg object-cover hidden sm:block flex-shrink-0 opacity-60" />}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-white font-bold truncate">{ev.title}</h3>
                              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Draft</span>
                              <EventTypeBadge type={ev.event_type} />
                              {ev.reshare_enabled && (
                                <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Share2 className="w-2.5 h-2.5" /> Reshare
                                </span>
                              )}
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
                            className="text-amber-400 hover:text-amber-300 px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition flex items-center gap-1.5"
                            title="Continue editing">
                            <Edit3 className="w-3.5 h-3.5" /> Continue Editing
                          </button>
                          <button onClick={() => handlePublishEvent(ev.id)}
                            disabled={publishingId === ev.id}
                            className="text-green-400 hover:text-green-300 px-3 py-1.5 text-xs font-medium bg-green-500/10 hover:bg-green-500/20 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                            title="Publish event">
                            {publishingId === ev.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Publish
                          </button>
                          <button onClick={() => handleDeleteEvent(ev.id)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-white/5 rounded-lg transition" title="Delete event">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Published / Active Events */}
                {publishedEvents.length > 0 && draftEvents.length > 0 && (
                  <div className="flex items-center gap-3 mt-6 mb-2">
                    <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider">Published</h3>
                    <div className="flex-1 h-px bg-green-500/20" />
                    <span className="text-green-400/60 text-xs">{publishedEvents.length} event{publishedEvents.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {publishedEvents.map(ev => (
                  <div key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => navigate(`/events/${ev.id}`)}>
                      {ev.image && <img src={ev.image} alt="" className="w-16 h-16 rounded-lg object-cover hidden sm:block flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-bold truncate">{ev.title}</h3>
                          <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Published</span>
                          <EventTypeBadge type={ev.event_type} />
                          {ev.reshare_enabled && (
                            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Share2 className="w-2.5 h-2.5" /> Reshare
                            </span>
                          )}
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

        {/* ============ CHECK-IN TAB ============ */}
        {tab === 'checkin' && (
          <div>
            {loadingCheckIn ? (
              <div className="text-center py-16"><div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                {/* Scanner link */}
                <div className="bg-purple-600/10 border border-purple-500/30 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                      <ScanLine className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">QR Code Scanner</h3>
                      <p className="text-gray-400 text-sm">Scan attendee tickets to check them in</p>
                    </div>
                  </div>
                  <Link to="/scan" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors whitespace-nowrap">
                    <ScanLine className="w-4 h-4" /> Open Scanner
                  </Link>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <StatCard icon={Users} label="Total Attendees" value={totalTicketsAll} color="text-purple-400" />
                  <StatCard icon={CheckCircle2} label="Checked In" value={totalCheckedIn} color="text-green-400" />
                  <StatCard icon={Clock} label="Not Checked In" value={totalTicketsAll - totalCheckedIn} color="text-amber-400" />
                </div>

                {/* Per-event check-in stats */}
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" /> Check-in by Event
                </h3>

                {checkInStats.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                    <ScanLine className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No ticket data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {checkInStats.map(stat => {
                      const total = Number(stat.total_tickets) || 0
                      const checked = Number(stat.checked_in_count) || 0
                      const pct = total > 0 ? Math.round((checked / total) * 100) : 0
                      return (
                        <div key={stat.event_id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {stat.event_image && <img src={stat.event_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                              <div className="min-w-0">
                                <h4 className="text-white font-bold text-sm truncate">{stat.event_title}</h4>
                                <p className="text-gray-500 text-xs">{stat.event_date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                              <div className="text-right">
                                <p className="text-white font-bold text-lg">{pct}%</p>
                                <p className="text-gray-500 text-[10px]">{checked}/{total} checked in</p>
                              </div>
                              <Link to={`/scan?event=${stat.event_id}`}
                                className="text-purple-400 hover:text-purple-300 p-2 hover:bg-white/5 rounded-lg transition"
                                title="Scan for this event">
                                <ScanLine className="w-5 h-5" />
                              </Link>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-purple-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.max(pct, 1)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-green-400 text-xs">{checked} checked in</span>
                            <span className="text-amber-400 text-xs">{stat.not_checked_in_count || (total - checked)} remaining</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============ ANALYTICS TAB ============ */}
        {tab === 'analytics' && (
          <div>
            {loadingAnalytics ? (
              <div className="text-center py-16"><div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : myEvents.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Create events to see your analytics</p>
                <Link to="/create" className="text-purple-400 hover:text-purple-300 font-medium">Create Event →</Link>
              </div>
            ) : (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon={DollarSign} label="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} color="text-green-400" />
                  <StatCard icon={Ticket} label="Tickets Sold" value={totalTicketsSold} />
                  <StatCard icon={Users} label="RSVPs" value={totalRsvps} color="text-green-400" />
                  <StatCard icon={Calendar} label="Total Events" value={myEvents.length} color="text-blue-400" />
                </div>

                {/* Attendance breakdown */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400 text-sm">In-Person Attendees</span>
                    </div>
                    <p className="text-white font-bold text-3xl">{totalInPersonAttendees}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400 text-sm">Virtual Attendees</span>
                    </div>
                    <p className="text-white font-bold text-3xl">{totalVirtualAttendees}</p>
                  </div>
                </div>

                {/* Revenue by Event */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                  <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" /> Revenue by Event
                  </h3>
                  <BarChart data={revenueByEvent} labelKey="label" valueKey="value" color="bg-green-500" />
                </div>

                {/* Tickets by Event */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                  <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-purple-400" /> Tickets Sold by Event
                  </h3>
                  <BarChart data={ticketsByEvent} labelKey="label" valueKey="value" color="bg-purple-500" />
                </div>

                {/* Daily Sales Trend */}
                {recentDailySales.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-400" /> Daily Revenue (Last 14 Days)
                    </h3>
                    <BarChart data={recentDailySales} labelKey="label" valueKey="value" color="bg-blue-500" />
                  </div>
                )}

                {/* Per-event detail cards */}
                <div className="mb-6">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-400" /> Event Breakdown
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {salesSummary.map(s => (
                      <div key={s.event_id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition cursor-pointer"
                        onClick={() => navigate(`/events/${s.event_id}`)}>
                        <div className="flex items-center gap-3 mb-4">
                          {s.event_image && <img src={s.event_image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                          <div className="min-w-0">
                            <h4 className="text-white font-bold truncate">{s.event_title}</h4>
                            <p className="text-gray-500 text-xs">{s.event_date}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-gray-500 text-[10px]">Revenue</p>
                            <p className="text-green-400 font-bold">₦{Number(s.total_revenue).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px]">Tickets</p>
                            <p className="text-white font-bold">{s.total_quantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px]">RSVPs</p>
                            <p className="text-white font-bold">{s.total_rsvps}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============ REFERRALS TAB ============ */}
        {tab === 'referrals' && (
          <div>
            {loadingReferrals ? (
              <div className="text-center py-16"><div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon={Share2} label="Links Generated" value={referralLinks.length} />
                  <StatCard icon={MousePointer} label="Total Clicks" value={totalClicks} />
                  <StatCard icon={Ticket} label="Tickets Sold" value={commissions.length} color="text-green-400" />
                  <StatCard icon={DollarSign} label="Total Earned" value={`₦${totalEarned.toLocaleString()}`} color="text-green-400" />
                </div>

                {commissions.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                      <p className="text-gray-400 text-sm mb-1">Confirmed Earnings</p>
                      <p className="text-green-400 font-bold text-2xl">₦{confirmedEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
                      <p className="text-gray-400 text-sm mb-1">Pending Earnings</p>
                      <p className="text-yellow-400 font-bold text-2xl">₦{pendingEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {reshareEvents.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" /> Your Reshare Events
                    </h3>
                    <div className="space-y-3">
                      {reshareEvents.map(ev => (
                        <div key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {ev.image && <img src={ev.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                              <div>
                                <h4 className="text-white font-semibold text-sm">{ev.title}</h4>
                                <p className="text-gray-500 text-xs">{ev.date}</p>
                              </div>
                            </div>
                            <button onClick={() => loadEventReferralStats(ev.id)} disabled={loadingEventStats}
                              className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> View Stats
                            </button>
                          </div>
                          {selectedEventStats?.eventId === ev.id && (
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3 pt-3 border-t border-white/5">
                              <div className="text-center">
                                <p className="text-gray-500 text-[10px]">Promoters</p>
                                <p className="text-white font-bold">{selectedEventStats.totalPromoters}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-500 text-[10px]">Clicks</p>
                                <p className="text-white font-bold">{selectedEventStats.totalClicks}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-500 text-[10px]">Sales</p>
                                <p className="text-white font-bold">{selectedEventStats.totalSales}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-500 text-[10px]">Revenue</p>
                                <p className="text-green-400 font-bold text-sm">₦{selectedEventStats.totalRevenue.toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-500 text-[10px]">Commissions</p>
                                <p className="text-yellow-400 font-bold text-sm">₦{selectedEventStats.totalCommissions.toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-500 text-[10px]">Net Revenue</p>
                                <p className="text-white font-bold text-sm">₦{selectedEventStats.netRevenue.toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-purple-400" /> Your Referral Links
                  </h3>
                  {referralLinks.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                      <Share2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No referral links yet</p>
                      <p className="text-gray-500 text-sm mb-4">Browse events with Reshare enabled and start earning!</p>
                      <Link to="/events" className="text-purple-400 hover:text-purple-300 font-medium">Browse Events →</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referralLinks.map(link => (
                        <div key={link.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              {link.events?.image && <img src={link.events.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                              <div className="min-w-0">
                                <h4 className="text-white font-semibold text-sm truncate">{link.events?.title || 'Event'}</h4>
                                <p className="text-gray-500 text-xs">Code: {link.referral_code}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm flex-shrink-0">
                              <div className="text-center">
                                <p className="text-gray-500 text-[10px]">Clicks</p>
                                <p className="text-white font-bold">{link.clicks || 0}</p>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/events/${link.event_id}?ref=${link.referral_code}`)
                                  toast.success('Link copied!')
                                }}
                                className="text-purple-400 hover:text-purple-300 p-2 hover:bg-white/5 rounded-lg transition">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {commissions.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" /> Commission History
                    </h3>
                    <div className="space-y-2">
                      {commissions.map(c => (
                        <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold text-sm">{c.events?.title || 'Event'}</h4>
                            <p className="text-gray-500 text-xs">Ticket: ₦{Number(c.ticket_amount).toLocaleString()} · {new Date(c.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">+₦{Number(c.commission_amount).toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              c.status === 'confirmed' ? 'text-green-400 bg-green-400/10' :
                              c.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10' :
                              c.status === 'paid' ? 'text-blue-400 bg-blue-400/10' :
                              'text-red-400 bg-red-400/10'
                            }`}>{c.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============ PROFILE TAB ============ */}
        {tab === 'profile' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-lg">
            <h2 className="text-xl font-bold text-white mb-6">Your Profile</h2>
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
