import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Ticket, Calendar, User, LogOut, MapPin, Plus, Trash2, Edit3, Video, Globe, Camera, Share2, TrendingUp, DollarSign, Eye, MousePointer, Users, ExternalLink, BarChart3, PieChart, Activity, ArrowUpRight, CheckCircle2, ScanLine, X, Clock, Download, Bell, Settings, Mail, Megaphone, ChevronDown, Info, Check, Send, Search, Phone, Copy, Filter } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import AuthService from '../services/AuthService'
import EventService from '../services/EventService'
import TicketService from '../services/TicketService'
import UserService from '../services/UserService'
import ReferralService from '../services/ReferralService'
import NotificationService from '../services/NotificationService'
import PayoutService from '../services/PayoutService'

const BASE_TABS = [
  { id: 'tickets', label: 'My Tickets', icon: Ticket },
  { id: 'events', label: 'My Events', icon: Calendar },
  { id: 'checkin', label: 'Check-in', icon: ScanLine },
  { id: 'attendees', label: 'Attendees', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'payouts', label: 'Payouts', icon: DollarSign },
  { id: 'referrals', label: 'Referrals', icon: Share2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
]

function EventTypeBadge({ type }) {
  if (type === 'virtual') return <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Virtual</span>
  if (type === 'hybrid') return <span className="text-[10px] font-bold bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Hybrid</span>
  return null
}

function StatCard({ icon: Icon, label, value, color = 'text-pink-400', sub }) {
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
function BarChart({ data, labelKey, valueKey, color = 'bg-pink-500' }) {
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
      // Attendee name
      if (ticket.attendee_name) {
        ctx.fillStyle = '#c084fc'
        ctx.font = 'bold 16px sans-serif'
        ctx.fillText(ticket.attendee_name, canvas.width / 2, img.height + pad * 2 + 78)
        ctx.fillStyle = '#9ca3af'
        ctx.font = '14px sans-serif'
        ctx.fillText(ticket.tier_name || '', canvas.width / 2, img.height + pad * 2 + 98)
      } else {
        ctx.fillText(ticket.tier_name ? `${ticket.tier_name}${ticket.quantity > 1 ? ` · x${ticket.quantity}` : ''}` : '', canvas.width / 2, img.height + pad * 2 + 80)
      }
      ctx.fillText('Tixo Events', canvas.width / 2, img.height + pad * 2 + 105)
      // Download
      const link = document.createElement('a')
      link.download = `tixo-ticket-${ticket.check_in_code || 'qr'}.png`
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
        {ticket.attendee_name && (
          <p className="text-pink-400 text-sm text-center font-semibold mb-1">🎫 {ticket.attendee_name}</p>
        )}
        <p className="text-gray-400 text-sm text-center mb-6">{ticket.tier_name}{ticket.quantity > 1 ? ` · x${ticket.quantity}` : ''}</p>
        <div className="flex justify-center mb-4" ref={qrRef}>
          <div className="bg-white rounded-xl p-4">
            <QRCodeSVG value={ticket.check_in_code || ticket.id} size={200} level="H" />
          </div>
        </div>
        <p className="text-center text-pink-400 font-mono font-bold text-lg tracking-wider mb-2">{ticket.check_in_code || '—'}</p>
        <button onClick={handleDownload}
          className="w-full mt-2 mb-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
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

  // Transfer modal state
  const [transferTicket, setTransferTicket] = useState(null)
  const [transferEmail, setTransferEmail] = useState('')
  const [transferName, setTransferName] = useState('')
  const [transferring, setTransferring] = useState(false)

  // Ticket sub-filter: all | upcoming | attended | missed
  const [ticketFilter, setTicketFilter] = useState('all')

  // Check-in stats state
  const [checkInStats, setCheckInStats] = useState([])
  const [loadingCheckIn, setLoadingCheckIn] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [approvingTickets, setApprovingTickets] = useState({})

  // Attendees tab state
  const [selectedAttendeeEvent, setSelectedAttendeeEvent] = useState(null)
  const [eventAttendees, setEventAttendees] = useState([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [attendeeFilterTier, setAttendeeFilterTier] = useState('')
  const [attendeeFilterPayment, setAttendeeFilterPayment] = useState('')
  const [attendeeFilterCheckin, setAttendeeFilterCheckin] = useState('')

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

  // Notification state
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    ticket_confirmations: true,
    event_reminders: true,
    reminder_timing: '24',
    new_ticket_sold: true,
    daily_summary: false,
    marketing_updates: false,
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Payout state
  const [payoutProfile, setPayoutProfile] = useState(null)
  const [loadingPayout, setLoadingPayout] = useState(false)
  const [banks, setBanks] = useState([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [payoutForm, setPayoutForm] = useState({ bank_code: '', bank_name: '', account_number: '' })
  const [resolvedAccount, setResolvedAccount] = useState(null)
  const [resolvingAccount, setResolvingAccount] = useState(false)
  const [savingPayout, setSavingPayout] = useState(false)

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
    if ((tab === 'analytics' || tab === 'payouts') && user) loadAnalyticsData()
  }, [tab, user])

  // Load check-in stats
  useEffect(() => {
    if (tab === 'checkin' && user) loadCheckInStats()
  }, [tab, user])

  // Load attendees when event selected
  useEffect(() => {
    if (selectedAttendeeEvent && tab === 'attendees') {
      loadEventAttendees(selectedAttendeeEvent)
    }
  }, [selectedAttendeeEvent, tab])

  async function loadEventAttendees(eventId) {
    setLoadingAttendees(true)
    try {
      const data = await TicketService.getEventAttendees(eventId)
      setEventAttendees(data)
    } catch (err) {
      console.error('Failed to load attendees:', err)
      toast.error('Failed to load attendees')
      setEventAttendees([])
    } finally {
      setLoadingAttendees(false)
    }
  }

  function exportAttendeesCSV(attendees, eventTitle) {
    const headers = ['Name', 'Email', 'Phone', 'Ticket Type', 'Ticket Code', 'Purchase Date', 'Payment Status', 'Amount', 'Check-in Status', 'Check-in Time']
    const rows = attendees.map(t => [
      t.attendee_name || t.profiles?.full_name || t.guest_name || 'Anonymous',
      t.profiles?.email || t.guest_email || '',
      t.registration_data?.phone || t.registration_data?.Phone || '',
      t.tier_name || '',
      t.check_in_code || '',
      t.purchased_at ? new Date(t.purchased_at).toLocaleString() : '',
      t.payment_status || '',
      t.total_price || 0,
      t.checked_in ? 'Checked In' : 'Not Checked In',
      t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${eventTitle || 'attendees'}-attendees.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Load notification data
  useEffect(() => {
    if (tab === 'notifications' && user) loadNotificationData()
  }, [tab, user])

  // Load payout data
  useEffect(() => {
    if (tab === 'payouts' && user) loadPayoutData()
  }, [tab, user])

  async function loadPayoutData() {
    setLoadingPayout(true)
    try {
      const [profile, bankList] = await Promise.all([
        PayoutService.getProfile(user.id),
        banks.length > 0 ? Promise.resolve(banks) : PayoutService.listBanks()
      ])
      setPayoutProfile(profile)
      if (bankList && bankList.length > 0) setBanks(bankList)
      if (profile) {
        setPayoutForm({
          bank_code: profile.bank_code || '',
          bank_name: profile.bank_name || '',
          account_number: profile.account_number || ''
        })
        setResolvedAccount({ account_name: profile.account_name })
      }
    } catch (e) { console.error('Load payout data error:', e) }
    finally { setLoadingPayout(false) }
  }

  async function handleResolveAccount() {
    if (!payoutForm.account_number || payoutForm.account_number.length < 10 || !payoutForm.bank_code) {
      toast.error('Enter a valid 10-digit account number and select a bank')
      return
    }
    setResolvingAccount(true)
    setResolvedAccount(null)
    try {
      const result = await PayoutService.resolveAccount(payoutForm.account_number, payoutForm.bank_code)
      setResolvedAccount(result)
      toast.success(`Account: ${result.account_name}`)
    } catch (e) { toast.error(e.message || 'Could not verify account') }
    finally { setResolvingAccount(false) }
  }

  async function handleSavePayout() {
    if (!resolvedAccount?.account_name) {
      toast.error('Please verify your account number first')
      return
    }
    setSavingPayout(true)
    try {
      await PayoutService.createSubaccount({
        userId: user.id,
        businessName: profile?.full_name || resolvedAccount.account_name,
        bankCode: payoutForm.bank_code,
        bankName: payoutForm.bank_name,
        accountNumber: payoutForm.account_number,
        accountName: resolvedAccount.account_name
      })
      toast.success('Payout profile saved! You\'ll receive 95% of ticket sales automatically 🎉')
      await loadPayoutData()
    } catch (e) { toast.error(e.message || 'Failed to save payout settings') }
    finally { setSavingPayout(false) }
  }

  async function loadCheckInStats() {
    setLoadingCheckIn(true)
    try {
      const stats = await TicketService.getCheckInStats(user.id)
      setCheckInStats(stats || [])

      // Load pending approvals for private virtual events
      const privateEvents = myEvents.filter(e => e.virtual_access === 'private')
      if (privateEvents.length > 0) {
        const allPending = []
        for (const ev of privateEvents) {
          const attendees = await TicketService.getEventAttendees(ev.id)
          const pending = attendees.filter(a => a.approved === false).map(a => ({ ...a, eventTitle: ev.title, eventId: ev.id, virtualLink: ev.virtual_link }))
          allPending.push(...pending)
        }
        setPendingApprovals(allPending)
      }
    } catch (e) { console.error(e) }
    finally { setLoadingCheckIn(false) }
  }

  async function handleApproveTicket(ticketId) {
    setApprovingTickets(prev => ({ ...prev, [ticketId]: true }))
    try {
      await TicketService.setApproved(ticketId, true)
      setPendingApprovals(prev => prev.filter(t => t.id !== ticketId))
      toast.success('Attendee approved! They can now access the meeting link.')
    } catch (e) {
      toast.error(e.message || 'Failed to approve')
    } finally {
      setApprovingTickets(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  async function handleBulkApprove() {
    const ids = pendingApprovals.map(t => t.id)
    if (ids.length === 0) return
    try {
      await TicketService.bulkApprove(ids)
      setPendingApprovals([])
      toast.success(`${ids.length} attendee${ids.length > 1 ? 's' : ''} approved!`)
    } catch (e) {
      toast.error(e.message || 'Failed to approve')
    }
  }

  async function loadNotificationData() {
    setLoadingNotifications(true)
    try {
      const [notifs, prefs] = await Promise.all([
        NotificationService.getNotifications(user.id).catch(() => []),
        NotificationService.getPreferences(user.id).catch(() => null),
      ])
      setNotifications(notifs || [])
      if (prefs) setNotifPrefs(p => ({ ...p, ...prefs }))
    } catch (e) { console.error('Failed to load notifications:', e) }
    finally { setLoadingNotifications(false) }
  }

  async function handleMarkAllRead() {
    try {
      await NotificationService.markAllRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch (e) { console.error(e) }
  }

  async function handleUpdateNotifPrefs(key, value) {
    const updated = { ...notifPrefs, [key]: value }
    setNotifPrefs(updated)
    setSavingPrefs(true)
    try {
      await NotificationService.updatePreferences(user.id, updated)
    } catch (e) { console.error('Failed to save preferences:', e) }
    finally { setSavingPrefs(false) }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  function getNotifIcon(type) {
    if (type === 'ticket_confirmation') return Ticket
    if (type === 'event_reminder') return Clock
    if (type === 'new_ticket_sold') return DollarSign
    return Bell
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

  if (authLoading || loading) return <div className="min-h-screen bg-[#050510] flex items-center justify-center"><div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>

  const avatarUrl = profile?.avatar_url

  // Filter tabs: only show check-in tab if user has events (is an organizer); attendees always visible
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

  // ─── Ticket categorization ───
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingTickets = tickets.filter(t => {
    const eventDate = t.events?.date ? new Date(t.events.date + 'T23:59:59') : null
    return eventDate && eventDate >= today && !t.checked_in
  })

  const attendedTickets = tickets.filter(t => {
    if (t.checked_in) return true
    const eventDate = t.events?.date ? new Date(t.events.date + 'T23:59:59') : null
    const isPast = eventDate && eventDate < today
    const noCheckinRequired = t.events?.require_checkin === false
    return isPast && noCheckinRequired
  })

  const missedTickets = tickets.filter(t => {
    const eventDate = t.events?.date ? new Date(t.events.date + 'T23:59:59') : null
    const isPast = eventDate && eventDate < today
    const requiresCheckin = t.events?.require_checkin !== false
    return isPast && !t.checked_in && requiresCheckin
  })

  const filteredTickets =
    ticketFilter === 'upcoming' ? upcomingTickets :
    ticketFilter === 'attended' ? attendedTickets :
    ticketFilter === 'missed' ? missedTickets :
    tickets

  const ticketSubTabs = [
    { id: 'all', label: 'All Tickets', count: tickets.length, color: 'text-pink-400' },
    { id: 'upcoming', label: 'Upcoming', count: upcomingTickets.length, color: 'text-blue-400' },
    { id: 'attended', label: 'Attended', count: attendedTickets.length, color: 'text-green-400' },
    { id: 'missed', label: 'Missed', count: missedTickets.length, color: 'text-red-400' },
  ]

  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* QR Modal */}
        {qrTicket && <QRModal ticket={qrTicket} onClose={() => setQrTicket(null)} />}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-pink-400 text-xl font-bold overflow-hidden border-2 border-white/15">
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
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${tab === t.id ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
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
                <Link to="/events" className="text-pink-400 hover:text-pink-300 font-medium">Browse Events →</Link>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard icon={Ticket} label="Total Tickets" value={tickets.length} />
                  <StatCard icon={Calendar} label="Upcoming" value={upcomingTickets.length} color="text-blue-400" />
                  <StatCard icon={CheckCircle2} label="Attended" value={attendedTickets.length} color="text-green-400" />
                  <StatCard icon={X} label="Missed" value={missedTickets.length} color="text-red-400" />
                </div>

                {/* Sub-filter tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                  {ticketSubTabs.map(st => (
                    <button key={st.id} onClick={() => setTicketFilter(st.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${ticketFilter === st.id ? 'bg-white/10 text-white border border-white/20' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300 border border-transparent'}`}>
                      {st.label}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ticketFilter === st.id ? 'bg-white/10 text-pink-300' : 'bg-white/5 text-gray-600'}`}>{st.count}</span>
                    </button>
                  ))}
                </div>

                {/* Ticket list */}
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                    {ticketFilter === 'upcoming' && <>
                      <Calendar className="w-10 h-10 text-blue-500/40 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No upcoming events</p>
                      <Link to="/events" className="text-pink-400 hover:text-pink-300 text-sm font-medium mt-2 inline-block">Browse Events →</Link>
                    </>}
                    {ticketFilter === 'attended' && <>
                      <CheckCircle2 className="w-10 h-10 text-green-500/40 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No events attended yet</p>
                      <p className="text-gray-600 text-xs mt-1">Once you check in at an event, it'll show up here</p>
                    </>}
                    {ticketFilter === 'missed' && <>
                      <Clock className="w-10 h-10 text-red-500/40 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No missed events — great track record! 🎉</p>
                    </>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map(t => {
                      const eventDate = t.events?.date ? new Date(t.events.date + 'T23:59:59') : null
                      const isPast = eventDate && eventDate < today
                      const noCheckinRequired = t.events?.require_checkin === false
                      const autoAttended = isPast && !t.checked_in && noCheckinRequired
                      const isMissed = isPast && !t.checked_in && !noCheckinRequired
                      const isAttended = t.checked_in || autoAttended

                      return (
                        <div key={t.id} className={`bg-white/5 border rounded-xl p-5 flex items-center justify-between transition ${isMissed ? 'border-red-500/20 opacity-70' : isAttended ? 'border-green-500/20' : 'border-white/10 hover:border-white/15'}`}>
                          <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => navigate(`/events/${t.event_id}`)}>
                            {/* Event image thumbnail */}
                            {t.events?.image && (
                              <img src={t.events.image} alt="" className={`w-14 h-14 rounded-lg object-cover hidden sm:block flex-shrink-0 ${isMissed ? 'opacity-50 grayscale' : ''}`} />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-white font-bold">{t.event_title}</h3>
                                {t.is_rsvp && <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">RSVP</span>}
                                {t.attendance_mode === 'virtual' && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Virtual</span>}
                                {/* Status badge */}
                                {isAttended ? (
                                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Attended
                                  </span>
                                ) : isMissed ? (
                                  <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <X className="w-2.5 h-2.5" /> Missed
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> Upcoming
                                  </span>
                                )}
                              </div>
                              {t.attendee_name && (
                                <p className="text-pink-400 text-sm font-medium">🎫 {t.attendee_name}</p>
                              )}
                              <p className="text-gray-400 text-sm">{t.tier_name}{t.quantity > 1 ? ` · x${t.quantity}` : ''}</p>
                              <div className="flex items-center gap-3 mt-1">
                                {t.events?.date && (
                                  <p className="text-gray-500 text-xs flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(t.events.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                )}
                                {t.events?.location && (
                                  <p className="text-gray-500 text-xs flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">{t.events.location}</span>
                                  </p>
                                )}
                              </div>
                              {isAttended && t.checked_in_at && (
                                <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Checked in {new Date(t.checked_in_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                            {/* Transfer button */}
                            {!isPast && !t.transfer_status && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setTransferTicket(t) }}
                                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg px-3 py-2 text-xs font-bold transition-colors flex items-center gap-1"
                                title="Transfer ticket"
                              >
                                <Send className="w-3.5 h-3.5" /> Transfer
                              </button>
                            )}
                            {t.transfer_status === 'transferred' && (
                              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Transferred</span>
                            )}
                            {/* QR Code thumbnail */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setQrTicket(t) }}
                              className={`bg-white rounded-lg p-1.5 hover:scale-105 transition-transform cursor-pointer flex-shrink-0 ${isMissed ? 'opacity-40' : ''}`}
                              title="View QR code"
                            >
                              <QRCodeSVG value={t.check_in_code || t.id} size={48} level="M" />
                            </button>
                            <div className="text-right">
                              {t.is_rsvp || Number(t.total_price) === 0 ? (
                                <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Free</span>
                              ) : (
                                <p className="text-pink-400 font-bold">₦{Number(t.total_price).toLocaleString()}</p>
                              )}
                              {isAttended ? (
                                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Attended ✓</span>
                              ) : isMissed ? (
                                <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Missed</span>
                              ) : (
                                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">Confirmed</span>
                              )}
                            </div>
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

        {/* ============ MY EVENTS TAB ============ */}
        {tab === 'events' && (
          <div>
            <div className="flex justify-end mb-4">
              <Link to="/create" className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors">
                <Plus className="w-4 h-4" /> New Event
              </Link>
            </div>
            {myEvents.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">You haven't created any events</p>
                <Link to="/create" className="text-pink-400 hover:text-pink-300 font-medium">Create Your First Event →</Link>
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
                        className="text-pink-400 hover:text-pink-300 p-2 hover:bg-white/5 rounded-lg transition" title="Edit event">
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
              <div className="text-center py-16"><div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                {/* Scanner link */}
                <div className="bg-white/5 border border-white/15 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <ScanLine className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">QR Code Scanner</h3>
                      <p className="text-gray-400 text-sm">Scan attendee tickets to check them in</p>
                    </div>
                  </div>
                  <Link to="/scan" className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors whitespace-nowrap">
                    <ScanLine className="w-4 h-4" /> Open Scanner
                  </Link>
                </div>

                {/* ═══ PENDING APPROVALS (Private Virtual Events) ═══ */}
                {pendingApprovals.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">Pending Approvals</h3>
                          <p className="text-amber-400/70 text-xs">{pendingApprovals.length} attendee{pendingApprovals.length !== 1 ? 's' : ''} waiting for access to private virtual events</p>
                        </div>
                      </div>
                      <button onClick={handleBulkApprove}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                        <Check className="w-4 h-4" /> Approve All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {pendingApprovals.map(ticket => (
                        <div key={ticket.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium text-sm">
                              {ticket.attendee_name || ticket.profiles?.full_name || ticket.guest_name || 'Anonymous'}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {ticket.profiles?.email || ticket.guest_email || ''} · {ticket.eventTitle} · {ticket.tier_name}
                            </p>
                          </div>
                          <button
                            onClick={() => handleApproveTicket(ticket.id)}
                            disabled={approvingTickets[ticket.id]}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                          >
                            {approvingTickets[ticket.id] ? 'Approving...' : <><Check className="w-4 h-4" /> Approve</>}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <StatCard icon={Users} label="Total Attendees" value={totalTicketsAll} color="text-pink-400" />
                  <StatCard icon={CheckCircle2} label="Checked In" value={totalCheckedIn} color="text-green-400" />
                  <StatCard icon={Clock} label="Not Checked In" value={totalTicketsAll - totalCheckedIn} color="text-amber-400" />
                </div>

                {/* Per-event check-in stats */}
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-400" /> Check-in by Event
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
                        <div key={stat.event_id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/15 transition">
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
                                className="text-pink-400 hover:text-pink-300 p-2 hover:bg-white/5 rounded-lg transition"
                                title="Scan for this event">
                                <ScanLine className="w-5 h-5" />
                              </Link>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-pink-500' : 'bg-amber-500'}`}
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

        {/* ============ ATTENDEES TAB ============ */}
        {tab === 'attendees' && (() => {
          if (myEvents.length === 0) {
            return (
              <div className="bg-gray-800/50 rounded-2xl p-10 text-center border border-gray-700/50">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Create events to see your attendees</p>
                <a href="/create" className="text-pink-400 hover:text-pink-300 mt-2 inline-block">Create Event →</a>
              </div>
            )
          }
          const selectedEvent = myEvents.find(e => e.id === selectedAttendeeEvent)
          const searchLower = attendeeSearch.toLowerCase()
          const filteredAttendees = eventAttendees.filter(t => {
            if (attendeeSearch) {
              const name = (t.attendee_name || t.profiles?.full_name || t.guest_name || '').toLowerCase()
              const email = (t.profiles?.email || t.guest_email || '').toLowerCase()
              const code = (t.check_in_code || '').toLowerCase()
              if (!name.includes(searchLower) && !email.includes(searchLower) && !code.includes(searchLower)) return false
            }
            if (attendeeFilterTier && t.tier_name !== attendeeFilterTier) return false
            if (attendeeFilterPayment && t.payment_status !== attendeeFilterPayment) return false
            if (attendeeFilterCheckin === 'checked' && !t.checked_in) return false
            if (attendeeFilterCheckin === 'not_checked' && t.checked_in) return false
            return true
          })
          const checkedInCount = eventAttendees.filter(t => t.checked_in).length
          const notCheckedInCount = eventAttendees.length - checkedInCount
          const totalRevenue = eventAttendees.reduce((sum, t) => sum + (t.total_price || t.paid_amount || 0), 0)
          const uniqueTiers = [...new Set(eventAttendees.map(t => t.tier_name).filter(Boolean))]
          const uniquePaymentStatuses = [...new Set(eventAttendees.map(t => t.payment_status).filter(Boolean))]

          return (
          <div>
            {/* Event selector */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Select Event</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedAttendeeEvent(ev.id); setAttendeeSearch(''); setAttendeeFilterTier(''); setAttendeeFilterPayment(''); setAttendeeFilterCheckin('') }}
                    className={`text-left p-4 rounded-xl border transition-all ${selectedAttendeeEvent === ev.id ? 'bg-pink-500/20 border-pink-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    <p className="text-white font-medium truncate">{ev.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{ev.date ? new Date(ev.date).toLocaleDateString() : 'No date'}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedAttendeeEvent && (
              loadingAttendees ? (
                <div className="text-center py-16"><div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">Total Attendees</p>
                      <p className="text-2xl font-bold text-white mt-1">{eventAttendees.length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">Checked In</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">{checkedInCount}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">Not Checked In</p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">{notCheckedInCount}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">Revenue</p>
                      <p className="text-2xl font-bold text-white mt-1">₦{totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Search & Filter Bar */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name, email, or ticket code..."
                          value={attendeeSearch}
                          onChange={e => setAttendeeSearch(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
                        />
                      </div>
                      <select
                        value={attendeeFilterTier}
                        onChange={e => setAttendeeFilterTier(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50 appearance-none"
                      >
                        <option value="" className="bg-[#050510]">All Tiers</option>
                        {uniqueTiers.map(t => <option key={t} value={t} className="bg-[#050510]">{t}</option>)}
                      </select>
                      <select
                        value={attendeeFilterPayment}
                        onChange={e => setAttendeeFilterPayment(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50 appearance-none"
                      >
                        <option value="" className="bg-[#050510]">All Payments</option>
                        {uniquePaymentStatuses.map(s => <option key={s} value={s} className="bg-[#050510]">{s}</option>)}
                      </select>
                      <select
                        value={attendeeFilterCheckin}
                        onChange={e => setAttendeeFilterCheckin(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50 appearance-none"
                      >
                        <option value="" className="bg-[#050510]">All Check-in</option>
                        <option value="checked" className="bg-[#050510]">Checked In</option>
                        <option value="not_checked" className="bg-[#050510]">Not Checked In</option>
                      </select>
                      <button
                        onClick={() => exportAttendeesCSV(filteredAttendees, selectedEvent?.title)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">{filteredAttendees.length} of {eventAttendees.length} attendees</p>
                  </div>

                  {/* Attendee Table - Desktop */}
                  <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Name</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Email</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Phone</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Ticket Type</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Code</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Date</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Payment</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Amount</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Check-in</th>
                            <th className="text-left text-gray-400 font-medium px-4 py-3">Check-in Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAttendees.length === 0 ? (
                            <tr><td colSpan={10} className="text-center text-gray-500 py-8">No one has registered for this event yet</td></tr>
                          ) : filteredAttendees.map(t => (
                            <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-white font-medium">{t.attendee_name || t.profiles?.full_name || t.guest_name || 'Anonymous'}</td>
                              <td className="px-4 py-3 text-gray-400">{t.profiles?.email || t.guest_email || '—'}</td>
                              <td className="px-4 py-3 text-gray-400">{t.registration_data?.phone || t.registration_data?.Phone || '—'}</td>
                              <td className="px-4 py-3"><span className="bg-white/10 text-gray-300 px-2 py-0.5 rounded text-xs">{t.tier_name || '—'}</span></td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => { navigator.clipboard.writeText(t.check_in_code || ''); toast.success('Code copied!') }}
                                  className="font-mono text-xs bg-white/10 text-pink-400 px-2 py-1 rounded hover:bg-white/20 transition-colors"
                                  title="Click to copy"
                                >
                                  {t.check_in_code || '—'}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{t.purchased_at ? new Date(t.purchased_at).toLocaleDateString() : '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  t.payment_status === 'free' || t.payment_status === 'paid' || t.payment_status === 'success' ? 'bg-green-500/20 text-green-400' :
                                  t.payment_status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                  t.payment_status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400'
                                }`}>{t.payment_status || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-300">₦{(t.total_price || t.paid_amount || 0).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.checked_in ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {t.checked_in ? 'Checked In' : 'Not Checked In'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Attendee Cards - Mobile */}
                  <div className="md:hidden space-y-3">
                    {filteredAttendees.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 bg-white/5 border border-white/10 rounded-xl">No one has registered for this event yet</div>
                    ) : filteredAttendees.map(t => (
                      <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white font-medium">{t.attendee_name || t.profiles?.full_name || t.guest_name || 'Anonymous'}</p>
                            <p className="text-gray-400 text-xs">{t.profiles?.email || t.guest_email || '—'}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.checked_in ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {t.checked_in ? 'Checked In' : 'Not Checked In'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <span className="text-gray-300 ml-1">{t.registration_data?.phone || t.registration_data?.Phone || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Tier:</span>
                            <span className="text-gray-300 ml-1">{t.tier_name || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Code:</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(t.check_in_code || ''); toast.success('Code copied!') }}
                              className="font-mono text-pink-400 ml-1 hover:underline"
                            >
                              {t.check_in_code || '—'}
                            </button>
                          </div>
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <span className="text-gray-300 ml-1">{t.purchased_at ? new Date(t.purchased_at).toLocaleDateString() : '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Payment:</span>
                            <span className={`ml-1 font-medium ${
                              t.payment_status === 'free' || t.payment_status === 'paid' || t.payment_status === 'success' ? 'text-green-400' :
                              t.payment_status === 'pending' ? 'text-amber-400' :
                              t.payment_status === 'failed' ? 'text-red-400' : 'text-gray-400'
                            }`}>{t.payment_status || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <span className="text-gray-300 ml-1">₦{(t.total_price || t.paid_amount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        {t.checked_in_at && (
                          <p className="text-gray-500 text-xs">Checked in: {new Date(t.checked_in_at).toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )
            )}

            {!selectedAttendeeEvent && (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-white font-semibold text-lg mb-1">Select an Event</h3>
                <p className="text-gray-400">Choose an event above to view its attendees</p>
              </div>
            )}
          </div>
          )
        })()}

        {/* ============ ANALYTICS TAB ============ */}
        {tab === 'analytics' && (
          <div>
            {loadingAnalytics ? (
              <div className="text-center py-16"><div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : myEvents.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Create events to see your analytics</p>
                <Link to="/create" className="text-pink-400 hover:text-pink-300 font-medium">Create Event →</Link>
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
                      <MapPin className="w-4 h-4 text-pink-400" />
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
                    <Ticket className="w-5 h-5 text-pink-400" /> Tickets Sold by Event
                  </h3>
                  <BarChart data={ticketsByEvent} labelKey="label" valueKey="value" color="bg-pink-500" />
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

                {/* Enhanced Analytics: Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    icon={TrendingUp}
                    label="Conversion Rate"
                    value={(() => {
                      const totalViews = salesSummary.reduce((sum, s) => sum + Number(s.total_views || 0), 0)
                      return totalViews > 0 ? `${((totalTicketsSold / totalViews) * 100).toFixed(1)}%` : '—'
                    })()}
                    color="text-purple-400"
                    sub="Tickets sold / event views"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Check-in Rate"
                    value={totalTicketsSold > 0 ? `${Math.round((checkInStats.reduce((sum, s) => sum + Number(s.checked_in_count || 0), 0) / totalTicketsSold) * 100)}%` : '—'}
                    color="text-green-400"
                    sub="Checked in / tickets sold"
                  />
                  <StatCard
                    icon={ArrowUpRight}
                    label="Revenue Growth"
                    value={(() => {
                      const now = new Date()
                      const thisMonth = dailySales.filter(d => {
                        const dd = new Date(d.sale_date)
                        return dd.getMonth() === now.getMonth() && dd.getFullYear() === now.getFullYear()
                      }).reduce((s, d) => s + Number(d.revenue || 0), 0)
                      const lastMonth = dailySales.filter(d => {
                        const dd = new Date(d.sale_date)
                        const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1
                        const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
                        return dd.getMonth() === lm && dd.getFullYear() === ly
                      }).reduce((s, d) => s + Number(d.revenue || 0), 0)
                      if (lastMonth === 0 && thisMonth === 0) return '—'
                      if (lastMonth === 0) return '+100%'
                      const pct = ((thisMonth - lastMonth) / lastMonth * 100).toFixed(0)
                      return `${Number(pct) >= 0 ? '+' : ''}${pct}%`
                    })()}
                    color="text-blue-400"
                    sub="This month vs last month"
                  />
                  <StatCard
                    icon={Activity}
                    label="Avg Revenue/Event"
                    value={myEvents.length > 0 ? `₦${Math.round(totalRevenue / myEvents.length).toLocaleString()}` : '—'}
                    color="text-amber-400"
                    sub={`Across ${myEvents.length} events`}
                  />
                </div>

                {/* Top Performing Events */}
                {salesSummary.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" /> Top Performing Events
                    </h3>
                    <div className="space-y-3">
                      {[...salesSummary]
                        .sort((a, b) => Number(b.total_revenue) - Number(a.total_revenue))
                        .slice(0, 5)
                        .map((s, idx) => {
                          const rev = Number(s.total_revenue || 0)
                          const qty = Number(s.total_quantity || 0)
                          const maxRev = Number(salesSummary.reduce((m, x) => Math.max(m, Number(x.total_revenue || 0)), 0)) || 1
                          return (
                            <div key={s.event_id} className="flex items-center gap-4 group">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                                idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                                idx === 2 ? 'bg-amber-600/20 text-amber-500' :
                                'bg-white/5 text-gray-500'
                              }`}>#{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-white text-sm font-semibold truncate group-hover:text-pink-400 transition-colors">{s.event_title}</h4>
                                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                    <span className="text-gray-500 text-xs">{qty} tickets</span>
                                    <span className="text-green-400 font-bold text-sm">₦{rev.toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all" style={{ width: `${Math.max((rev / maxRev) * 100, 3)}%` }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Per-event detail cards */}
                <div className="mb-6">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-pink-400" /> Event Breakdown
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {salesSummary.map(s => (
                      <div key={s.event_id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/15 transition cursor-pointer"
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
        {/* ============ PAYOUTS TAB ============ */}
        {tab === 'payouts' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Payout Settings</h2>
              <p className="text-gray-500 text-sm">Set up your bank account to receive ticket sales revenue automatically. You keep <span className="text-pink-400 font-bold">95%</span> — Tixo takes a 5% platform fee.</p>
            </div>

            {loadingPayout ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Current payout status */}
                {payoutProfile?.is_verified && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-green-400 font-bold text-sm">Payouts Active</p>
                        <p className="text-gray-400 text-xs">Funds settle to your bank automatically</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-gray-500 text-xs mb-1">Bank</p>
                        <p className="text-white text-sm font-semibold">{payoutProfile.bank_name}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-gray-500 text-xs mb-1">Account</p>
                        <p className="text-white text-sm font-semibold">
                          ••••{payoutProfile.account_number?.slice(-4)}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 col-span-2">
                        <p className="text-gray-500 text-xs mb-1">Account Name</p>
                        <p className="text-white text-sm font-semibold">{payoutProfile.account_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Revenue summary from existing analytics */}
                {salesSummary.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-pink-400" /> Revenue Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        icon={DollarSign}
                        label="Total Revenue"
                        value={`₦${salesSummary.reduce((s, e) => s + Number(e.total_revenue || 0), 0).toLocaleString()}`}
                        color="text-green-400"
                      />
                      <StatCard
                        icon={Ticket}
                        label="Your Share (95%)"
                        value={`₦${Math.round(salesSummary.reduce((s, e) => s + Number(e.total_revenue || 0), 0) * 0.95).toLocaleString()}`}
                        color="text-pink-400"
                      />
                    </div>
                  </div>
                )}

                {/* Bank account form */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4">
                    {payoutProfile?.is_verified ? '✏️ Update Bank Account' : '🏦 Add Your Bank Account'}
                  </h3>
                  <div className="space-y-4">
                    {/* Bank selector */}
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Bank</label>
                      <select
                        value={payoutForm.bank_code}
                        onChange={e => {
                          const bank = banks.find(b => b.code === e.target.value)
                          setPayoutForm(f => ({
                            ...f,
                            bank_code: e.target.value,
                            bank_name: bank?.name || ''
                          }))
                          setResolvedAccount(null)
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 appearance-none"
                      >
                        <option value="" className="bg-[#12121a]">Select your bank...</option>
                        {banks.map(b => (
                          <option key={b.code} value={b.code} className="bg-[#12121a]">{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Account number */}
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Account Number</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={10}
                          value={payoutForm.account_number}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setPayoutForm(f => ({ ...f, account_number: val }))
                            setResolvedAccount(null)
                          }}
                          placeholder="0123456789"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 font-mono tracking-wider"
                        />
                        <button
                          onClick={handleResolveAccount}
                          disabled={resolvingAccount || payoutForm.account_number.length < 10 || !payoutForm.bank_code}
                          className="px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {resolvingAccount ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" /> Verify
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Resolved account name */}
                    {resolvedAccount && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-green-400 text-sm font-bold">{resolvedAccount.account_name}</p>
                          <p className="text-gray-400 text-xs">Account verified ✓</p>
                        </div>
                      </div>
                    )}

                    {/* Save button */}
                    <button
                      onClick={handleSavePayout}
                      disabled={savingPayout || !resolvedAccount?.account_name}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingPayout ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <DollarSign className="w-5 h-5" />
                          {payoutProfile?.is_verified ? 'Update Payout Account' : 'Activate Payouts'}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info box */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                  <h4 className="text-purple-300 font-bold text-sm mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" /> How Payouts Work
                  </h4>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span>
                      When someone buys a ticket, payment is <span className="text-white font-semibold">automatically split</span> — 95% goes straight to your bank.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span>
                      Paystack settles funds to your account within <span className="text-white font-semibold">24 hours</span> (T+1).
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span>
                      Tixo's 5% platform fee covers payment processing, hosting, and support.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span>
                      Free events and RSVPs have <span className="text-white font-semibold">no fees</span>.
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============ REFERRALS TAB ============ */}
        {tab === 'referrals' && (
          <div>
            {loadingReferrals ? (
              <div className="text-center py-16"><div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
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
                      <BarChart3 className="w-5 h-5 text-pink-400" /> Your Reshare Events
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
                              className="text-pink-400 hover:text-pink-300 text-sm font-medium flex items-center gap-1">
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
                    <Share2 className="w-5 h-5 text-pink-400" /> Your Referral Links
                  </h3>
                  {referralLinks.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                      <Share2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No referral links yet</p>
                      <p className="text-gray-500 text-sm mb-4">Browse events with Reshare enabled and start earning!</p>
                      <Link to="/events" className="text-pink-400 hover:text-pink-300 font-medium">Browse Events →</Link>
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
                                className="text-pink-400 hover:text-pink-300 p-2 hover:bg-white/5 rounded-lg transition">
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

        {/* ============ NOTIFICATIONS TAB ============ */}
        {tab === 'notifications' && (
          <div>
            {loadingNotifications ? (
              <div className="text-center py-16"><div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                {/* Notification List */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <Bell className="w-5 h-5 text-pink-400" /> Notifications
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="text-[10px] font-bold bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">
                          {notifications.filter(n => !n.read).length} new
                        </span>
                      )}
                    </h3>
                    {notifications.some(n => !n.read) && (
                      <button onClick={handleMarkAllRead}
                        className="text-pink-400 hover:text-pink-300 text-sm font-medium flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                      <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No notifications yet</p>
                      <p className="text-gray-600 text-sm">You'll see ticket confirmations, event reminders, and more here</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                      {notifications.map(n => {
                        const IconComp = getNotifIcon(n.type)
                        return (
                          <div key={n.id}
                            className={`bg-white/5 border rounded-xl p-4 flex items-start gap-4 hover:bg-white/[0.07] transition-all cursor-default backdrop-blur-sm ${
                              !n.read ? 'border-l-2 border-l-pink-500 border-t-white/10 border-r-white/10 border-b-white/10' : 'border-white/10'
                            }`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              n.type === 'ticket_confirmation' ? 'bg-pink-500/15' :
                              n.type === 'event_reminder' ? 'bg-blue-500/15' :
                              n.type === 'new_ticket_sold' ? 'bg-green-500/15' : 'bg-white/10'
                            }`}>
                              <IconComp className={`w-4 h-4 ${
                                n.type === 'ticket_confirmation' ? 'text-pink-400' :
                                n.type === 'event_reminder' ? 'text-blue-400' :
                                n.type === 'new_ticket_sold' ? 'text-green-400' : 'text-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-semibold truncate ${!n.read ? 'text-white' : 'text-gray-300'}`}>{n.title}</h4>
                                {!n.read && <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />}
                              </div>
                              <p className="text-gray-400 text-sm mt-0.5">{n.message}</p>
                              <p className="text-gray-600 text-xs mt-1.5">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Notification Preferences */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5 text-pink-400" /> Notification Preferences
                    </h3>
                    {savingPrefs && <span className="text-gray-500 text-xs">Saving...</span>}
                  </div>

                  <div className="space-y-5">
                    {/* Ticket Confirmations */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center">
                          <Ticket className="w-4 h-4 text-pink-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Ticket Confirmations</p>
                          <p className="text-gray-500 text-xs">Get notified when you purchase a ticket</p>
                        </div>
                      </div>
                      <button onClick={() => handleUpdateNotifPrefs('ticket_confirmations', !notifPrefs.ticket_confirmations)}
                        className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center ${
                          notifPrefs.ticket_confirmations ? 'bg-gradient-to-r from-pink-500 to-purple-500 justify-end' : 'bg-white/10 justify-start'
                        }`}>
                        <span className={`w-5 h-5 rounded-full bg-white shadow-sm mx-0.5 transition-transform`} />
                      </button>
                    </div>

                    {/* Event Reminders */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Event Reminders</p>
                          <p className="text-gray-500 text-xs">Reminders before events you have tickets for</p>
                        </div>
                      </div>
                      <button onClick={() => handleUpdateNotifPrefs('event_reminders', !notifPrefs.event_reminders)}
                        className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center ${
                          notifPrefs.event_reminders ? 'bg-gradient-to-r from-pink-500 to-purple-500 justify-end' : 'bg-white/10 justify-start'
                        }`}>
                        <span className={`w-5 h-5 rounded-full bg-white shadow-sm mx-0.5 transition-transform`} />
                      </button>
                    </div>

                    {/* Reminder Timing */}
                    {notifPrefs.event_reminders && (
                      <div className="flex items-center justify-between pl-11">
                        <div>
                          <p className="text-gray-300 text-sm font-medium">Remind me before event</p>
                        </div>
                        <div className="relative">
                          <select
                            value={notifPrefs.reminder_timing}
                            onChange={e => handleUpdateNotifPrefs('reminder_timing', e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white pr-8 focus:outline-none focus:border-white/20 cursor-pointer">
                            <option value="1">1 hour</option>
                            <option value="3">3 hours</option>
                            <option value="12">12 hours</option>
                            <option value="24">24 hours</option>
                            <option value="48">48 hours</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {/* New Ticket Sold */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">New Ticket Sold</p>
                          <p className="text-gray-500 text-xs">Alert when someone buys a ticket to your event</p>
                        </div>
                      </div>
                      <button onClick={() => handleUpdateNotifPrefs('new_ticket_sold', !notifPrefs.new_ticket_sold)}
                        className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center ${
                          notifPrefs.new_ticket_sold ? 'bg-gradient-to-r from-pink-500 to-purple-500 justify-end' : 'bg-white/10 justify-start'
                        }`}>
                        <span className={`w-5 h-5 rounded-full bg-white shadow-sm mx-0.5 transition-transform`} />
                      </button>
                    </div>

                    {/* Daily Summary */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Daily Summary</p>
                          <p className="text-gray-500 text-xs">Receive a daily digest of activity on your events</p>
                        </div>
                      </div>
                      <button onClick={() => handleUpdateNotifPrefs('daily_summary', !notifPrefs.daily_summary)}
                        className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center ${
                          notifPrefs.daily_summary ? 'bg-gradient-to-r from-pink-500 to-purple-500 justify-end' : 'bg-white/10 justify-start'
                        }`}>
                        <span className={`w-5 h-5 rounded-full bg-white shadow-sm mx-0.5 transition-transform`} />
                      </button>
                    </div>

                    {/* Marketing Updates */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                          <Megaphone className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Marketing Updates</p>
                          <p className="text-gray-500 text-xs">Tips, features, and promotions from Tixo</p>
                        </div>
                      </div>
                      <button onClick={() => handleUpdateNotifPrefs('marketing_updates', !notifPrefs.marketing_updates)}
                        className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center ${
                          notifPrefs.marketing_updates ? 'bg-gradient-to-r from-pink-500 to-purple-500 justify-end' : 'bg-white/10 justify-start'
                        }`}>
                        <span className={`w-5 h-5 rounded-full bg-white shadow-sm mx-0.5 transition-transform`} />
                      </button>
                    </div>
                  </div>
                </div>
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
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-pink-400 text-2xl font-bold overflow-hidden border-2 border-white/15">
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Email</label>
                <input value={user?.email || ''} disabled className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" />
              </div>
              <button onClick={handleUpdateProfile}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ============ TRANSFER MODAL ============ */}
        {transferTicket && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => { if (!transferring) { setTransferTicket(null); setTransferEmail(''); setTransferName('') } }}>
            <div style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 800 }}>🎁 Transfer Ticket</h3>
                <button onClick={() => { setTransferTicket(null); setTransferEmail(''); setTransferName('') }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ margin: 0, color: 'white', fontWeight: 700 }}>{transferTicket.event_title}</p>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{transferTicket.tier_name} · x{transferTicket.quantity}</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Recipient's Name</label>
                <input value={transferName} onChange={e => setTransferName(e.target.value)} placeholder="Enter their name"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Recipient's Email</label>
                <input value={transferEmail} onChange={e => setTransferEmail(e.target.value)} placeholder="email@example.com" type="email"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 20 }}>⚠️ This action cannot be undone. The ticket will be transferred to the recipient and they'll receive an email with the check-in details.</p>
              <button
                onClick={async () => {
                  if (!transferEmail.trim()) { toast.error('Enter recipient email'); return }
                  if (!transferName.trim()) { toast.error('Enter recipient name'); return }
                  setTransferring(true)
                  try {
                    const updated = await TicketService.transferTicket(transferTicket.id, transferEmail.trim(), transferName.trim())
                    // Send email notification
                    try {
                      await fetch('/api/send-transfer-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          to: transferEmail.trim(),
                          recipientName: transferName.trim(),
                          senderName: profile?.full_name || user?.email,
                          eventTitle: transferTicket.event_title,
                          eventDate: transferTicket.events?.date,
                          eventTime: transferTicket.events?.time,
                          eventLocation: transferTicket.events?.location,
                          tierName: transferTicket.tier_name,
                          checkInCode: transferTicket.check_in_code
                        })
                      })
                    } catch (emailErr) { console.warn('Transfer email failed:', emailErr) }
                    toast.success(`Ticket transferred to ${transferName.trim()}!`)
                    setTransferTicket(null); setTransferEmail(''); setTransferName('')
                    // Refresh tickets
                    const refreshed = await TicketService.getByUser(user.id)
                    setTickets(refreshed)
                  } catch (err) {
                    toast.error('Transfer failed: ' + err.message)
                  } finally { setTransferring(false) }
                }}
                disabled={transferring}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: transferring ? 'not-allowed' : 'pointer',
                  background: transferring ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                {transferring ? <><div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Transferring...</> : <><Send size={16} /> Transfer Ticket</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
