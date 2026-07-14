import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { MapPin, Calendar, Clock, Ticket, Share2, Heart, ArrowLeft, Minus, Plus, ShoppingCart, Video, Globe, ExternalLink, Users, MessageCircle, Send, Trash2, Copy, Check, TrendingUp, DollarSign, Monitor, MapPinned, CheckCircle2, X, ChevronUp, ArrowRight, Eye, Download, Zap, User } from 'lucide-react'
import toast from 'react-hot-toast'
import EventService from '../services/EventService'
import TicketService from '../services/TicketService'
import CommentService from '../services/CommentService'
import PhotoGallery from '../components/PhotoGallery'
import ReferralService from '../services/ReferralService'
import PaystackService from '../services/PaystackService'
import PayoutService from '../services/PayoutService'
import { useAuth } from '../context/AuthContext'
import ShareButton from '../components/ShareButton'

/* --- Helpers --- */
function formatDate(dateStr) {
  if (!dateStr) return { month: '', day: '', full: '', weekday: '' }
  const d = new Date(dateStr + 'T00:00:00')
  return {
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    full: d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    weekday: d.toLocaleDateString('en', { weekday: 'long' })
  }
}
function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
}
function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

/* --- Countdown Component --- */
function Countdown({ date, time }) {
  const [tl, setTl] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const target = new Date(`${date}T${time || '00:00:00'}`)
    const update = () => {
      const diff = target - Date.now()
      if (diff <= 0) { setExpired(true); return }
      setTl({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      })
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [date, time])

  if (expired) return (
    <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.05))', borderBottom: '1px solid rgba(239,68,68,0.15)', padding: '14px 24px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <Clock size={16} style={{ color: '#ef4444' }} />
      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ef4444', letterSpacing: '0.06em' }}>EVENT ENDED</span>
    </div>
  )

  const pad = n => String(n).padStart(2, '0')

  return (
    <div style={{ background: 'var(--purple)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em' }}>
      <span style={{ color: 'rgba(255,255,255,0.7)' }}>EVENT STARTS IN</span>
      <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>
        {pad(tl.d)}<span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 2px' }}>D</span>{' '}
        {pad(tl.h)}<span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 2px' }}>H</span>{' '}
        {pad(tl.m)}<span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 2px' }}>M</span>{' '}
        {pad(tl.s)}<span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 2px' }}>S</span>
      </span>
    </div>
  )
}

/* --- Google Calendar URL builder --- */
function googleCalUrl(event) {
  const s = (event.date || '').replace(/-/g, '') + 'T' + (event.time || '00:00').replace(/:/g, '') + '00'
  let e = s
  if (event.end_date) {
    e = event.end_date.replace(/-/g, '') + 'T' + (event.end_time || event.time || '23:59').replace(/:/g, '') + '00'
  }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title || '', dates: `${s}/${e}`, location: event.location || '', details: (event.description || '').slice(0, 500) })
  return `https://calendar.google.com/calendar/render?${params}`
}

/* --- ICS file generator --- */
function downloadIcs(event) {
  const s = (event.date || '').replace(/-/g, '') + 'T' + (event.time || '00:00').replace(/:/g, '') + '00'
  let e = s
  if (event.end_date) {
    e = event.end_date.replace(/-/g, '') + 'T' + (event.end_time || event.time || '23:59').replace(/:/g, '') + '00'
  }
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${s}\nDTEND:${e}\nSUMMARY:${event.title}\nLOCATION:${event.location || ''}\nDESCRIPTION:${(event.description || '').slice(0, 300)}\nEND:VEVENT\nEND:VCALENDAR`
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${event.title || 'event'}.ics`; a.click()
  URL.revokeObjectURL(url)
}

export default function EventDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  const [cart, setCart] = useState({})
  const [reservedFreeTiers, setReservedFreeTiers] = useState({})
  const [tierSoldCounts, setTierSoldCounts] = useState({})
  const [buying, setBuying] = useState(false)
  const [floaterExpanded, setFloaterExpanded] = useState(false)
  const cartSummaryRef = useRef(null)
  const [cartSummaryVisible, setCartSummaryVisible] = useState(false)

  const [attendanceMode, setAttendanceMode] = useState('in-person')

  const [hasRsvpd, setHasRsvpd] = useState(false)
  const [rsvping, setRsvping] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  const [paymentProcessing, setPaymentProcessing] = useState(false)

  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)

  const [reshareLink, setReshareLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showResharePanel, setShowResharePanel] = useState(false)

  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestAction, setGuestAction] = useState('')
  const [registrationData, setRegistrationData] = useState({})

  const [showAttendeeForm, setShowAttendeeForm] = useState(false)
  const [attendeeSlots, setAttendeeSlots] = useState([])
  const [pendingGuestInfo, setPendingGuestInfo] = useState(null)

  const [showFlyer, setShowFlyer] = useState(false)

  const [organizerSubaccount, setOrganizerSubaccount] = useState(null)

  /* --- Effects --- */
  useEffect(() => {
    const el = cartSummaryRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setCartSummaryVisible(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [event, purchaseSuccess, hasRsvpd])

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) { sessionStorage.setItem(`ref_${id}`, ref); ReferralService.trackClick(ref).catch(() => {}) }
  }, [id, searchParams])

  useEffect(() => {
    async function load() {
      try {
        const ev = await EventService.getById(id)
        setEvent(ev)
        if (ev?.organizer_id) { try { const subCode = await PayoutService.getSubaccountCode(ev.organizer_id); if (subCode) setOrganizerSubaccount(subCode) } catch (e) { console.warn('Could not fetch payout profile:', e) } }
      } catch { toast.error('Event not found'); navigate('/events') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  useEffect(() => {
    async function checkRsvp() {
      if (!user || !event) return
      if (event.ticket_tiers?.every(t => Number(t.price) === 0)) { setHasRsvpd(await TicketService.hasRsvp(event.id, user.id)) }
    }
    checkRsvp()
  }, [user, event])

  useEffect(() => {
    async function loadSoldCounts() {
      if (!event?.id) return
      try {
        const tickets = await TicketService.getByEvent(event.id)
        const counts = {}
        tickets.forEach(t => { const tier = t.tier_name || 'General'; counts[tier] = (counts[tier] || 0) + (t.quantity || 1) })
        setTierSoldCounts(counts)
      } catch (e) { console.warn('Could not load sold counts:', e) }
    }
    loadSoldCounts()
  }, [event])

  useEffect(() => {
    async function loadComments() {
      try { setComments(await CommentService.getByEvent(id)) } catch (e) { console.error(e) } finally { setLoadingComments(false) }
    }
    loadComments()
  }, [id])

  /* --- Cart helpers --- */
  function cartQty(tierName) { return cart[tierName] || 0 }
  function addToCart(tierName) {
    const tier = tiers.find(t => t.name === tierName)
    const maxPer = tier?.max_per_purchase || 10
    const remaining = tier ? getTierRemaining(tier) : null
    setCart(c => {
      const current = c[tierName] || 0
      if (current >= maxPer) return c
      if (remaining !== null && current >= remaining) return c
      return { ...c, [tierName]: current + 1 }
    })
  }
  function removeFromCart(tierName) { setCart(c => { const q = (c[tierName] || 0) - 1; if (q <= 0) { const { [tierName]: _, ...rest } = c; return rest } return { ...c, [tierName]: q } }) }
  function clearCart() { setCart({}); setFloaterExpanded(false) }

  /* --- Early Bird Price Helper (BUG FIX) --- */
  function getEffectivePrice(tier) {
    if (!tier) return 0
    if (tier.early_bird && tier.early_bird_price != null && tier.early_bird_end_date) {
      const now = new Date()
      const endDate = new Date(tier.early_bird_end_date + 'T23:59:59')
      if (now <= endDate) return Number(tier.early_bird_price)
    }
    return Number(tier.price) || 0
  }

  function getTierRemaining(tier) { if (tier.unlimited || tier.available == null) return null; const sold = tierSoldCounts[tier.name] || 0; return Math.max(0, Number(tier.available) - sold) }
  function isTierSoldOut(tier) { if (tier.unlimited || tier.available == null) return false; return getTierRemaining(tier) <= 0 }

  const tiers = event?.ticket_tiers || []
  const registrationFields = event?.registration_fields || []
  const isFreeEvent = tiers.length > 0 && tiers.every(t => getEffectivePrice(t) === 0)
  const isMixedEvent = tiers.length > 1 && tiers.some(t => getEffectivePrice(t) === 0) && tiers.some(t => getEffectivePrice(t) > 0)
  const cartItems = Object.entries(cart).map(([name, qty]) => { const tier = tiers.find(t => t.name === name); const price = getEffectivePrice(tier); return { tierName: name, quantity: qty, price, totalPrice: price * qty } }).filter(i => i.quantity > 0)
  const cartTotal = cartItems.reduce((s, i) => s + i.totalPrice, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)
  const showFloatingCart = cartCount > 0 && !isFreeEvent && !purchaseSuccess && !cartSummaryVisible && !showAttendeeForm && !isEventEnded

  function scrollToCart() { cartSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setFloaterExpanded(false) }

  /* --- Reshare handlers --- */
  async function handleGenerateReshareLink() {
    if (!user) { toast.error('Please log in to reshare'); navigate('/login'); return }
    if (user.id === event.organizer_id) { toast.error("You can't reshare your own event"); return }
    setGeneratingLink(true)
    try { const link = await ReferralService.getOrCreateLink(id, user.id); setReshareLink(`${window.location.origin}/events/${id}?ref=${link.referral_code}`); setShowResharePanel(true) } catch (e) { toast.error(e.message || 'Failed to generate link') } finally { setGeneratingLink(false) }
  }
  function copyReshareLink() { navigator.clipboard.writeText(reshareLink); setLinkCopied(true); toast.success('Referral link copied!'); setTimeout(() => setLinkCopied(false), 3000) }

  function triggerGuestCheckout(action) { setGuestAction(action); setShowGuestForm(true) }

  /* --- RSVP handler --- */
  async function handleRsvp(guestInfo = null) {
    if (!user && !guestInfo) { triggerGuestCheckout('rsvp'); return }
    if (user && !guestInfo?.registrationData && Object.keys(registrationData).length === 0) { setGuestAction('rsvp'); setGuestName(profile?.full_name || ''); setGuestEmail(user.email || ''); setShowGuestForm(true); return }
    setRsvping(true)
    try {
      const refCode = sessionStorage.getItem(`ref_${id}`)
      await TicketService.purchase({ eventId: event.id, eventTitle: event.title, tierName: tiers[0]?.name || 'General', quantity: 1, totalPrice: 0, userId: user?.id || null, guestName: guestInfo?.name || null, guestEmail: guestInfo?.email || null, referralCode: refCode || null, attendanceMode: event.event_type === 'hybrid' ? attendanceMode : (event.event_type === 'virtual' ? 'virtual' : 'in-person'), isRsvp: true, attendeeName: guestInfo?.name || profile?.full_name || null, attendeeEmail: guestInfo?.email || user?.email || null, paymentStatus: 'free', registrationData: guestInfo?.registrationData || registrationData })
      sessionStorage.removeItem(`ref_${id}`)
      setHasRsvpd(true); setPurchaseSuccess(true); setShowGuestForm(false)
      toast.success('RSVP confirmed!')
    } catch (e) { toast.error(e.message || 'RSVP failed') } finally { setRsvping(false) }
  }

  /* --- Reserve free tier --- */
  async function handleReserveFreeTier(tier, guestInfo = null) {
    if (!user && !guestInfo) { triggerGuestCheckout('rsvp'); return }
    if (user && !guestInfo?.registrationData && Object.keys(registrationData).length === 0) { setGuestAction('rsvp'); setGuestName(profile?.full_name || ''); setGuestEmail(user.email || ''); setShowGuestForm(true); return }
    setRsvping(true)
    try {
      const refCode = sessionStorage.getItem(`ref_${id}`)
      await TicketService.purchase({ eventId: event.id, eventTitle: event.title, tierName: tier.name, quantity: 1, totalPrice: 0, userId: user?.id || null, guestName: guestInfo?.name || null, guestEmail: guestInfo?.email || null, referralCode: refCode || null, attendanceMode: event.event_type === 'hybrid' ? attendanceMode : (event.event_type === 'virtual' ? 'virtual' : 'in-person'), isRsvp: true, attendeeName: guestInfo?.name || profile?.full_name || null, attendeeEmail: guestInfo?.email || user?.email || null, paymentStatus: 'free', registrationData: guestInfo?.registrationData || registrationData })
      setReservedFreeTiers(prev => ({ ...prev, [tier.name]: true }))
      toast.success(`Spot reserved for ${tier.name}!`)
    } catch (e) { toast.error(e.message || 'Reservation failed') } finally { setRsvping(false) }
  }

  /* --- Cart checkout handler --- */
  async function handleCheckout(guestInfo = null) {
    if (!user && !guestInfo) { triggerGuestCheckout('checkout'); return }
    if (user && registrationFields.length > 0 && !guestInfo?.registrationData && Object.keys(registrationData).length === 0) { setGuestAction('checkout'); setGuestName(profile?.full_name || ''); setGuestEmail(user.email || ''); setShowGuestForm(true); return }
    if (cartItems.length === 0) return

    const buyerName = profile?.full_name || guestInfo?.name || pendingGuestInfo?.name || ''

    if (cartCount >= 1 && !showAttendeeForm) {
      const slots = []
      cartItems.forEach(item => { for (let i = 0; i < item.quantity; i++) { slots.push({ tierName: item.tierName, price: item.price, name: '', email: '' }) } })
      if (slots.length > 0) { slots[0].name = buyerName; slots[0].email = user?.email || guestInfo?.email || '' }
      setAttendeeSlots(slots)
      setPendingGuestInfo(guestInfo)
      setShowAttendeeForm(true)
      setShowGuestForm(false)
      return
    }

    const effectiveGuestInfo = guestInfo || pendingGuestInfo
    let purchaseItems
    if (showAttendeeForm && attendeeSlots.length > 0) {
      purchaseItems = attendeeSlots.map(slot => ({ tierName: slot.tierName, quantity: 1, totalPrice: slot.price, attendeeName: slot.name.trim() || buyerName, attendeeEmail: slot.email?.trim() || '' }))
    } else {
      purchaseItems = cartItems.map(item => ({ tierName: item.tierName, quantity: 1, totalPrice: item.price, attendeeName: buyerName, attendeeEmail: user?.email || effectiveGuestInfo?.email || '' }))
    }

    setBuying(true)
    try {
      const refCode = sessionStorage.getItem(`ref_${id}`)
      const mode = event.event_type === 'hybrid' ? attendanceMode : (event.event_type === 'virtual' ? 'virtual' : 'in-person')

      let paymentReference = null
      let paymentStatus = 'free'
      let paymentChannel = null
      let paidAmount = 0

      if (cartTotal > 0) {
        setPaymentProcessing(true)
        const buyerEmail = user?.email || effectiveGuestInfo?.email
        const buyerNameForPayment = profile?.full_name || effectiveGuestInfo?.name || ''
        try {
          const result = await PaystackService.pay({ email: buyerEmail, amount: cartTotal, name: buyerNameForPayment, subaccount: organizerSubaccount || undefined, metadata: { event_id: event.id, event_title: event.title, user_id: user?.id || null, guest_name: effectiveGuestInfo?.name || null, guest_email: effectiveGuestInfo?.email || null, attendance_mode: mode, tickets: purchaseItems.map(item => ({ tier_name: item.tierName, quantity: item.quantity, total_price: item.totalPrice, attendee_name: item.attendeeName })) } })
          paymentReference = result.reference; paymentStatus = 'verified'; paymentChannel = result.channel; paidAmount = result.amount
        } catch (payErr) {
          setPaymentProcessing(false); setBuying(false)
          if (payErr.message === 'Payment cancelled') return
          if (payErr.message && payErr.message.includes('Payment made but verification failed')) { toast.error(payErr.message + ' Please contact support with your reference number.') } else { toast.error(payErr.message || 'Payment failed') }
          return
        }
      }

      const tickets = await TicketService.purchaseMultiple({ eventId: event.id, eventTitle: event.title, items: purchaseItems, userId: user?.id || null, guestName: effectiveGuestInfo?.name || null, guestEmail: effectiveGuestInfo?.email || null, referralCode: refCode || null, attendanceMode: mode, isRsvp: false, paymentReference, paymentStatus, paymentChannel, paidAmount, registrationData: effectiveGuestInfo?.registrationData || registrationData })
      if (refCode && event.reshare_enabled) { try { const refLink = await ReferralService.getByCode(refCode); if (refLink && refLink.user_id !== user?.id) { await ReferralService.recordCommission({ referralLinkId: refLink.id, ticketId: tickets[0]?.id, eventId: event.id, referrerId: refLink.user_id, buyerId: user?.id || null, ticketAmount: cartTotal }) } } catch (e) { console.error('Commission tracking error:', e) } }
      sessionStorage.removeItem(`ref_${id}`)
      setPurchaseSuccess(true); setCart({}); setFloaterExpanded(false)
      setShowGuestForm(false); setShowAttendeeForm(false)
      setAttendeeSlots([]); setPendingGuestInfo(null)
      toast.success(`${purchaseItems.length} ticket${purchaseItems.length > 1 ? 's' : ''} purchased!`)

      // Send individual ticket emails to each attendee
      const buyerEmailAddr = user?.email || effectiveGuestInfo?.email
      const sentTicketIds = new Set()
      tickets.forEach((ticket, i) => {
        const attendeeEmail = ticket.attendee_email || purchaseItems[i]?.attendeeEmail || ''
        const recipientEmail = attendeeEmail || buyerEmailAddr
        if (!recipientEmail) return
        if (sentTicketIds.has(ticket.id)) return
        sentTicketIds.add(ticket.id)
        fetch('/api/send-ticket-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: recipientEmail, buyerName: ticket.attendee_name || purchaseItems[i]?.attendeeName || buyerName, eventTitle: event.title, eventDate: event.date, eventTime: event.time, eventLocation: event.location, eventType: event.event_type, virtualLink: event.virtual_link, eventImage: event.image || '', eventSlug: event.slug || event.id, tickets: [{ tierName: ticket.tier_name, quantity: 1, totalPrice: ticket.total_price, checkInCode: ticket.check_in_code, attendeeName: ticket.attendee_name }], totalAmount: ticket.total_price || 0, paymentReference, paymentDate: new Date().toISOString() }) }).catch(err => console.warn('Email notification failed:', err))
      })
      // Summary email to buyer if multiple tickets
      if (buyerEmailAddr && tickets.length > 1) {
        fetch('/api/send-ticket-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: buyerEmailAddr, buyerName: profile?.full_name || effectiveGuestInfo?.name || '', eventTitle: event.title, eventDate: event.date, eventTime: event.time, eventLocation: event.location, eventType: event.event_type, virtualLink: event.virtual_link, eventImage: event.image || '', eventSlug: event.slug || event.id, tickets: tickets.map(t => ({ tierName: t.tier_name, quantity: 1, totalPrice: t.total_price, checkInCode: t.check_in_code, attendeeName: t.attendee_name })), totalAmount: paidAmount || 0, paymentReference, paymentDate: new Date().toISOString() }) }).catch(err => console.warn('Buyer summary email failed:', err))
      }
    } catch (e) { toast.error(e.message || 'Purchase failed') } finally { setBuying(false); setPaymentProcessing(false) }
  }

  /* --- Attendee form handlers --- */
  function handleAttendeeConfirm() {
    if (!attendeeSlots[0]?.name?.trim()) { toast.error('Please enter at least your name for the first ticket'); return }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (let i = 0; i < attendeeSlots.length; i++) { const email = attendeeSlots[i].email?.trim(); if (email && !emailRe.test(email)) { toast.error(`Invalid email for attendee ${i + 1}`); return } }
    handleCheckout(pendingGuestInfo)
  }

  function handleAttendeeBack() { setShowAttendeeForm(false); setAttendeeSlots([]); setPendingGuestInfo(null) }

  function updateRegistrationField(fieldId, value) { setRegistrationData(prev => ({ ...prev, [fieldId]: value })) }

  /* --- Guest form submit --- */
  function handleGuestSubmit(e) {
    e.preventDefault()
    if (!guestName.trim() || !guestEmail.trim()) { toast.error('Please fill in your name and email'); return }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(guestEmail)) { toast.error('Please enter a valid email'); return }
    for (const field of registrationFields) { if (field.required && !registrationData[field.id]?.toString().trim()) { toast.error(`${field.label} is required`); return } }
    const info = { name: guestName.trim(), email: guestEmail.trim(), registrationData: { ...registrationData } }
    if (guestAction === 'rsvp') handleRsvp(info); else handleCheckout(info)
  }

  /* --- Comments --- */
  async function handlePostComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!user) { toast.error('Please log in to comment'); navigate('/login'); return }
    setPosting(true)
    try { const nc = await CommentService.add({ eventId: id, userId: user.id, userName: profile?.full_name || user.email.split('@')[0], userAvatar: profile?.avatar_url || null, content: commentText.trim() }); setComments(prev => [nc, ...prev]); setCommentText(''); toast.success('Comment posted!') } catch (e) { toast.error(e.message || 'Failed to post comment') } finally { setPosting(false) }
  }
  async function handleDeleteComment(commentId) { try { await CommentService.delete(commentId); setComments(prev => prev.filter(c => c.id !== commentId)); toast.success('Comment deleted') } catch { toast.error('Failed to delete comment') } }

  /* --- Loading --- */
  if (loading) return <div className="min-h-screen bg-[#050510] flex items-center justify-center"><div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!event) return null

  const startDate = formatDate(event.date)
  const endDate = formatDate(event.end_date)
  const startTime = formatTime(event.time)
  const endTime = formatTime(event.end_time)
  const isMultiDay = event.end_date && event.end_date !== event.date
  const eventEndRef = event.end_date || event.date
  const eventEndTimeRef = event.end_time || event.time || '23:59'
  const isEventEnded = eventEndRef ? new Date(`${eventEndRef}T${eventEndTimeRef}:00`) < new Date() : false
  const isHybrid = event.event_type === 'hybrid'
  const isVirtual = event.event_type === 'virtual'
  const isPrivateVirtual = event.virtual_access === 'private'
  const showVirtualLink = (purchaseSuccess || hasRsvpd) && (isVirtual || (isHybrid && attendanceMode === 'virtual')) && event.virtual_link && !isPrivateVirtual

  return (
    <div className="min-h-screen bg-[#050510]" style={{ paddingTop: 64 }}>
      {event.date && <Countdown date={event.date} time={event.time} />}
      <div style={{ position: 'relative', width: '100%', minHeight: 420, overflow: 'hidden' }}>
        <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 20%, rgba(10,10,15,0.85) 75%, rgba(10,10,15,1) 100%)' }} />
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', zIndex: 5 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}><ArrowLeft size={16} /> Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setLiked(!liked)} style={{ background: liked ? 'rgba(236,72,153,0.7)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button>
            <ShareButton event={event} variant="icon" />
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 4, padding: '200px 24px 32px', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 16 }}>
            {event.title}
            {event.is_recurring && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(168,85,247,0.15)', color: '#c084fc', padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, marginLeft: 12, verticalAlign: 'middle' }}>Recurring: {event.recurrence_pattern ? event.recurrence_pattern.charAt(0).toUpperCase() + event.recurrence_pattern.slice(1) : 'Recurring'}</span>}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            {event.event_type !== 'virtual' && (<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={15} style={{ color: 'var(--purple-light)' }} /> {event.location}</span>)}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={15} style={{ color: 'var(--purple-light)' }} />{startDate.month} {startDate.day}{startTime ? ` - ${startTime}` : ''}</span>
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {isEventEnded ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontWeight: 800, padding: '12px 24px', borderRadius: 8, fontSize: '0.88rem', letterSpacing: '0.04em' }}><Clock size={16} /> EVENT ENDED</div>
            ) : (
              <button className="btn btn-purple" onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })}><span className="btn-label">GET TICKETS</span><span className="btn-arrow"><ArrowRight size={16} /></span></button>
            )}
            <button onClick={() => setShowFlyer(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.82rem', backdropFilter: 'blur(8px)' }}><Eye size={15} /> VIEW FLYER</button>
            <ShareButton event={event} variant="button" />
          </div>
          {!isEventEnded && (<div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>
            <span style={{ fontWeight: 700 }}>SAVE THE DATE</span>
            <a href={googleCalUrl(event)} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Google Calendar"><Calendar size={16} /></a>
            <button onClick={() => downloadIcs(event)} style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Download .ics"><Download size={16} /></button>
          </div>)}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 32, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>{event.title}</h2>
          {event.event_type !== 'virtual' && (<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MapPin size={18} style={{ color: 'var(--purple-light)' }} /></div><div><p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Venue</p><p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{event.location}</p></div></div>)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Calendar size={18} style={{ color: 'var(--purple-light)' }} /></div><div><p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{startDate.full}</p><p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{startTime}{endTime ? ` - ${endTime}` : ''} Africa/Lagos{isMultiDay && <span> - Ends {endDate.full}</span>}</p></div></div>
          {(isVirtual || isHybrid) && event.virtual_link && (<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Video size={18} style={{ color: '#60a5fa' }} /></div><div><p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>Virtual Event{isPrivateVirtual && <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 999 }}>Private</span>}</p>{(purchaseSuccess || hasRsvpd) && !isPrivateVirtual ? (<a href={event.virtual_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-light)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>Join online <ExternalLink size={12} /></a>) : (purchaseSuccess || hasRsvpd) && isPrivateVirtual ? (<p style={{ color: '#f59e0b', fontSize: '0.82rem' }}>Waiting for organizer approval</p>) : isPrivateVirtual ? (<p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Link sent after organizer approval</p>) : (<p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Link available after registration</p>)}</div></div>)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}><div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>{event.organizer_avatar ? (<img src={event.organizer_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (<span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{(event.organizer_name || 'U')[0].toUpperCase()}</span>)}</div><div><p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>Organized by</p><p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>{event.organizer_name || 'Unknown'}</p></div></div>
        </div>

        {event.reshare_enabled && (<div style={{ marginBottom: 32 }}><div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(236,72,153,0.06))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={18} style={{ color: 'var(--purple-light)' }} /></div><div><h3 style={{ fontWeight: 800, color: 'white', fontSize: '1.05rem' }}>Reshare & Earn</h3><p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>Earn 2.5% commission on every ticket sold through your link</p></div></div>{!showResharePanel ? (<button onClick={handleGenerateReshareLink} disabled={generatingLink} style={{ width: '100%', background: 'var(--purple)', border: 'none', color: 'white', fontWeight: 700, padding: '14px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem' }}><Share2 size={16} /> {generatingLink ? 'Generating...' : 'Get Your Referral Link'}</button>) : (<div style={{ display: 'flex', gap: 8 }}><input readOnly value={reshareLink} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white', fontSize: '0.82rem', outline: 'none' }} /><button onClick={copyReshareLink} style={{ background: linkCopied ? '#16a34a' : 'var(--purple)', border: 'none', color: 'white', padding: '12px 18px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{linkCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button></div>)}</div></div>)}

        {purchaseSuccess && (<div style={{ marginBottom: 32 }}><div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 16, padding: 40, textAlign: 'center' }}><CheckCircle2 size={56} style={{ color: '#4ade80', margin: '0 auto 16px' }} /><h3 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'white', marginBottom: 8 }}>{isFreeEvent ? "You're In!" : "Tickets Secured!"}</h3><p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{isPrivateVirtual && (isVirtual || (isHybrid && attendanceMode === 'virtual')) ? "Your registration is pending organizer approval. You'll receive the meeting link once approved." : isFreeEvent ? "Your RSVP has been confirmed. We'll see you there!" : "Your tickets have been confirmed. Check your dashboard for details."}</p>{isPrivateVirtual && (isVirtual || (isHybrid && attendanceMode === 'virtual')) && (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700, padding: '8px 16px', borderRadius: 999, fontSize: '0.85rem', marginBottom: 12 }}>Awaiting Approval</span>)}{showVirtualLink && (<a href={event.virtual_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2563eb', color: 'white', fontWeight: 700, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', marginBottom: 12 }}><Video size={18} /> Join Virtual Event <ExternalLink size={14} /></a>)}{user && <Link to="/dashboard" style={{ color: 'var(--purple-light)', fontWeight: 600, fontSize: '0.9rem' }}>View Dashboard</Link>}</div></div>)}

        {isHybrid && !purchaseSuccess && !hasRsvpd && (<div style={{ marginBottom: 24 }}><h3 style={{ fontWeight: 700, color: 'white', marginBottom: 12 }}>How will you attend?</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{[{ mode: 'in-person', icon: MapPinned, label: 'In Person', sub: 'Attend at venue', active: 'var(--purple)' }, { mode: 'virtual', icon: Monitor, label: 'Virtual', sub: 'Join online', active: '#2563eb' }].map(o => (<button key={o.mode} onClick={() => setAttendanceMode(o.mode)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, border: `1.5px solid ${attendanceMode === o.mode ? o.active : 'rgba(255,255,255,0.1)'}`, background: attendanceMode === o.mode ? `${o.active}15` : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', color: 'white' }}><o.icon size={20} style={{ color: attendanceMode === o.mode ? o.active : 'rgba(255,255,255,0.4)' }} /><div><p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{o.label}</p><p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{o.sub}</p></div></button>))}</div></div>)}

        {isEventEnded && !purchaseSuccess && !hasRsvpd && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <Clock size={48} style={{ color: 'rgba(239,68,68,0.5)', margin: '0 auto 16px' }} />
              <h3 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'white', marginBottom: 8 }}>This Event Has Ended</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.92rem', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>Tickets and RSVPs are no longer available. You can still browse the event details and photos below.</p>
            </div>
          </div>
        )}

        {!isEventEnded && !purchaseSuccess && !hasRsvpd && (<div id="tickets" style={{ marginBottom: 32 }}><h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{isFreeEvent ? 'RSVP' : 'Select Tickets'}</h2><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', marginBottom: 24 }}>{isFreeEvent ? 'Pick your tier and confirm your spot' : isMixedEvent ? 'This event has both free and paid tiers - pick what suits you' : 'Join the experience. Pulse levels rising'}</p>
          {isFreeEvent ? (<><div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>{tiers.map((tier, i) => { const isReserved = reservedFreeTiers[tier.name]; const maxPerPurchase = tier.max_per_purchase || 1; return (<div key={tier.name} style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${isReserved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: 24, transition: 'all 0.25s' }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}><div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={24} style={{ color: 'white' }} /></div><div style={{ flex: 1 }}><h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white', marginBottom: 4 }}>{tier.name}</h4><p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{tier.description || `Access to ${event.title}`}</p><span style={{ display: 'inline-block', marginTop: 8, fontSize: '0.72rem', fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', padding: '4px 10px', borderRadius: 999 }}>Free - Max {maxPerPurchase} Per Person</span></div></div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}><div><p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginBottom: 2 }}>PRICE</p><p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ade80' }}>FREE</p></div><button onClick={() => handleReserveFreeTier(tier)} disabled={isReserved || rsvping || isTierSoldOut(tier)} style={{ background: isTierSoldOut(tier) ? 'rgba(239,68,68,0.15)' : isReserved ? 'rgba(74,222,128,0.15)' : '#16a34a', border: isReserved ? '1px solid rgba(74,222,128,0.3)' : isTierSoldOut(tier) ? '1px solid rgba(239,68,68,0.25)' : 'none', color: isTierSoldOut(tier) ? '#ef4444' : isReserved ? '#4ade80' : 'white', fontWeight: 800, padding: '12px 24px', borderRadius: 12, cursor: (isReserved || isTierSoldOut(tier)) ? 'default' : 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>{isTierSoldOut(tier) ? 'Sold Out' : isReserved ? <><CheckCircle2 size={16} /> Reserved</> : rsvping ? 'Reserving...' : <><CheckCircle2 size={16} /> Reserve Spot</>}</button></div>{(() => { const isUnlimited = tier.unlimited || tier.available == null; const remaining = getTierRemaining(tier); const total = Number(tier.available) || 0; const pct = total > 0 ? remaining / total : 1; const soldOut = isTierSoldOut(tier); if (isUnlimited) return <p style={{ fontSize: '0.72rem', color: 'rgba(168,85,247,0.7)', marginTop: 6, fontWeight: 600 }}>Unlimited spots</p>; if (soldOut) return <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(239,68,68,0.25)' }}>SOLD OUT</span></div>; const color = pct > 0.5 ? '#4ade80' : pct > 0.15 ? '#facc15' : '#ef4444'; return (<div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.3s' }} /></div><span style={{ fontSize: '0.72rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>{remaining} left</span></div>) })()}</div>) })}</div></>) : (<><div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>{tiers.map((tier, i) => { const isTierFree = Number(tier.price) === 0; const qty = cartQty(tier.name); const isReserved = reservedFreeTiers[tier.name]; return (<div key={tier.name} style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${(qty > 0 || isReserved) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: 24, transition: 'all 0.25s' }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}><div style={{ width: 52, height: 52, borderRadius: 14, background: isTierFree ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, var(--purple), var(--purple-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{isTierFree ? <Users size={24} style={{ color: 'white' }} /> : <Zap size={24} style={{ color: 'white' }} />}</div><div style={{ flex: 1 }}><h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white', marginBottom: 4 }}>{tier.name}</h4><p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{tier.description || `Access to ${event.title}`}</p><span style={{ display: 'inline-block', marginTop: 8, fontSize: '0.72rem', fontWeight: 700, color: isTierFree ? '#4ade80' : 'rgba(255,255,255,0.5)', background: isTierFree ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isTierFree ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`, padding: '4px 10px', borderRadius: 999 }}>{isTierFree ? `Free - Max ${tier.max_per_purchase || 1} Per Person` : 'Admits 1 Person'}</span></div></div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}><div><p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginBottom: 2 }}>{isTierFree ? 'PRICE' : 'UNIT PRICE'}</p>{isTierFree ? (<p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ade80' }}>FREE</p>) : tier.early_bird && tier.early_bird_end_date && new Date(tier.early_bird_end_date) > new Date() ? (<div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--purple-light)' }}>N{Number(tier.early_bird_price || tier.price).toLocaleString()}</p><span style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', padding: '3px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700 }}>Early Bird</span></div><p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through', marginTop: 2 }}>N{Number(tier.price).toLocaleString()}</p><p style={{ fontSize: '0.72rem', color: 'rgba(250,204,21,0.7)', marginTop: 2 }}>Early bird ends {new Date(tier.early_bird_end_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p></div>) : (<p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--purple-light)' }}>N{Number(tier.price).toLocaleString()}</p>)}</div>{isTierFree ? (<button onClick={() => handleReserveFreeTier(tier)} disabled={isReserved || rsvping || isTierSoldOut(tier)} style={{ background: isTierSoldOut(tier) ? 'rgba(239,68,68,0.15)' : isReserved ? 'rgba(74,222,128,0.15)' : '#16a34a', border: isReserved ? '1px solid rgba(74,222,128,0.3)' : isTierSoldOut(tier) ? '1px solid rgba(239,68,68,0.25)' : 'none', color: isTierSoldOut(tier) ? '#ef4444' : isReserved ? '#4ade80' : 'white', fontWeight: 800, padding: '12px 24px', borderRadius: 12, cursor: (isReserved || isTierSoldOut(tier)) ? 'default' : 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>{isTierSoldOut(tier) ? 'Sold Out' : isReserved ? <><CheckCircle2 size={16} /> Reserved</> : rsvping ? 'Reserving...' : <><CheckCircle2 size={16} /> Reserve Spot</>}</button>) : (<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{qty > 0 && <button onClick={() => removeFromCart(tier.name)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>}{qty > 0 && <span style={{ fontWeight: 800, color: 'white', width: 24, textAlign: 'center' }}>{qty}</span>}<button onClick={() => addToCart(tier.name)} disabled={isTierSoldOut(tier)} style={{ width: 36, height: 36, borderRadius: 10, background: isTierSoldOut(tier) ? 'rgba(255,255,255,0.05)' : 'var(--purple)', border: 'none', color: isTierSoldOut(tier) ? 'rgba(255,255,255,0.2)' : 'white', cursor: isTierSoldOut(tier) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button></div>)}</div>{(() => { const isUnlimited = tier.unlimited || tier.available == null; const remaining = getTierRemaining(tier); const total = Number(tier.available) || 0; const pct = total > 0 ? remaining / total : 1; const soldOut = isTierSoldOut(tier); if (isUnlimited) return <p style={{ fontSize: '0.72rem', color: 'rgba(168,85,247,0.7)', marginTop: 6, fontWeight: 600 }}>Unlimited spots</p>; if (soldOut) return <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(239,68,68,0.25)' }}>SOLD OUT</span></div>; const color = pct > 0.5 ? '#4ade80' : pct > 0.15 ? '#facc15' : '#ef4444'; return (<div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.3s' }} /></div><span style={{ fontSize: '0.72rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>{remaining} left</span></div>) })()}</div>) })}</div>

            {showAttendeeForm && (<div style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}><Users size={20} style={{ color: 'var(--purple-light)' }} /><h3 style={{ fontWeight: 800, color: 'white', fontSize: '1.05rem' }}>Who's Coming?</h3></div><p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 20 }}>Enter a name and email for each ticket. Each person gets their own QR code sent directly to them.</p><div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{attendeeSlots.map((slot, i) => (<div key={i}>{(i === 0 || slot.tierName !== attendeeSlots[i - 1].tierName) && <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple-light)', letterSpacing: '0.06em', marginBottom: 8, marginTop: i > 0 ? 12 : 0 }}>{slot.tierName.toUpperCase()} - N{Number(slot.price).toLocaleString()}</p>}<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><div style={{ position: 'relative' }}><input type="text" placeholder={i === 0 ? 'Your name' : `Attendee ${i + 1} name`} value={slot.name} onChange={e => { const updated = [...attendeeSlots]; updated[i] = { ...updated[i], name: e.target.value }; setAttendeeSlots(updated) }} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: `1px solid ${i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, padding: '14px 16px', paddingRight: i === 0 ? 60 : 16, color: 'white', fontSize: '0.9rem', outline: 'none' }} />{i === 0 && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple-light)', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 6 }}>You</span>}</div><input type="email" placeholder={i === 0 ? 'Your email' : `Attendee ${i + 1} email (they'll get their ticket)`} value={slot.email || ''} onChange={e => { const updated = [...attendeeSlots]; updated[i] = { ...updated[i], email: e.target.value }; setAttendeeSlots(updated) }} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', color: 'white', fontSize: '0.85rem', outline: 'none' }} /></div></div>))}</div><div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 20, paddingTop: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Total</span><div style={{ textAlign: 'right' }}><span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--purple-light)' }}>N{cartTotal.toLocaleString()}</span><p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: 2 }}>{attendeeSlots.length} ticket{attendeeSlots.length > 1 ? 's' : ''} - {attendeeSlots.filter(s => s.name.trim()).length} named</p></div></div><div style={{ display: 'flex', gap: 10 }}><button type="button" onClick={handleAttendeeBack} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '14px 18px', borderRadius: 12, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> Back</button><button onClick={handleAttendeeConfirm} disabled={buying || paymentProcessing} style={{ flex: 1, background: 'var(--purple)', border: 'none', color: 'white', fontWeight: 800, padding: '14px', borderRadius: 12, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{paymentProcessing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing Payment...</> : buying ? 'Processing...' : <><ShoppingCart size={18} /> Confirm & Pay - N{cartTotal.toLocaleString()}</>}</button></div></div></div>)}

            {cartCount > 0 && !showGuestForm && !showAttendeeForm && (<div ref={cartSummaryRef} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><h3 style={{ fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={18} style={{ color: 'var(--purple-light)' }} /> Your Cart</h3><button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}><X size={12} /> Clear</button></div>{cartItems.map(item => (<div key={item.tierName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '6px 0' }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.tierName} x {item.quantity}</span><span style={{ color: 'white', fontWeight: 600 }}>N{item.totalPrice.toLocaleString()}</span></div>))}<div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12, paddingTop: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Total</span><span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--purple-light)' }}>N{cartTotal.toLocaleString()}</span></div><p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: 2 }}>{cartCount} ticket{cartCount > 1 ? 's' : ''}</p></div><button onClick={() => handleCheckout()} disabled={buying || paymentProcessing} style={{ width: '100%', marginTop: 20, background: 'var(--purple)', border: 'none', color: 'white', fontWeight: 800, padding: '16px', borderRadius: 12, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{paymentProcessing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block' }} /> Processing Payment...</> : buying ? 'Processing...' : <><ShoppingCart size={18} /> Checkout - N{cartTotal.toLocaleString()}</>}</button></div>)}</>)}

          {showGuestForm && (<div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0b0b14', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, maxWidth: 460, width: 'calc(100% - 32px)', maxHeight: '85vh', overflowY: 'auto', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><User size={20} style={{ color: 'var(--purple-light)' }} /><h3 style={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>{user ? (guestAction === 'rsvp' ? 'Confirm Your Details' : 'Registration Info') : 'Guest Checkout'}</h3></div><button type="button" onClick={() => setShowGuestForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button></div><p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: 16 }}>{user ? (registrationFields.length > 0 ? 'Please fill in the information required for this event.' : 'Confirm your details to reserve your spot.') : `Enter your details to ${guestAction === 'rsvp' ? 'confirm your RSVP' : 'complete your purchase'}. No account needed!`}</p><form onSubmit={handleGuestSubmit}><div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}><input type="text" placeholder="Full Name" value={guestName} onChange={e => setGuestName(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: '0.9rem', outline: 'none' }} /><input type="email" placeholder="Email Address" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} disabled={!!user} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: '0.9rem', outline: 'none', opacity: user ? 0.6 : 1 }} /></div>{registrationFields.length > 0 && (<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>{registrationFields.map(field => (<div key={field.id}>{field.type === 'select' ? (<select value={registrationData[field.id] || ''} onChange={e => updateRegistrationField(field.id, e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 16px', color: registrationData[field.id] ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '0.9rem', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}><option value="" style={{ background: '#1a1a2e' }}>{field.label}{field.required ? ' *' : ''}</option>{(field.options || []).map(opt => (<option key={opt} value={opt} style={{ background: '#1a1a2e', color: 'white' }}>{opt}</option>))}</select>) : (<input type={field.type || 'text'} placeholder={`${field.label}${field.required ? ' *' : ''}`} value={registrationData[field.id] || ''} onChange={e => updateRegistrationField(field.id, e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: '0.9rem', outline: 'none' }} />)}</div>))}</div>)}<div style={{ display: 'flex', gap: 10 }}><button type="submit" disabled={buying || rsvping || paymentProcessing} style={{ flex: 1, background: guestAction === 'rsvp' ? '#16a34a' : 'var(--purple)', border: 'none', color: 'white', fontWeight: 800, padding: '14px', borderRadius: 12, cursor: 'pointer', fontSize: '0.9rem' }}>{paymentProcessing ? 'Processing Payment...' : (buying || rsvping) ? 'Processing...' : guestAction === 'rsvp' ? 'Reserve Spot' : `Pay N${cartTotal.toLocaleString()}`}</button><button type="button" onClick={() => setShowGuestForm(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '14px 18px', borderRadius: 12, cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button></div></form>{!user && <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Already have an account? <Link to="/login" style={{ color: 'var(--purple-light)' }}>Log in</Link></p>}</div>)}
        </div>)}

        {hasRsvpd && !purchaseSuccess && (<div style={{ marginBottom: 32 }}><div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 16, padding: 28, textAlign: 'center' }}><CheckCircle2 size={44} style={{ color: '#4ade80', margin: '0 auto 12px' }} /><h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white', marginBottom: 4 }}>You've RSVP'd!</h3><p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem' }}>You're confirmed for this event</p></div></div>)}

        <div style={{ marginBottom: 32 }}><h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.02em' }}>About This Event</h2><p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '0.95rem' }}>{event.description}</p></div>

        {event.tags?.length > 0 && (<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>{event.tags.map(t => (<span key={t} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.06)' }}>#{t}</span>))}</div>)}

        {event.location && event.event_type !== 'virtual' && (<div style={{ marginBottom: 32 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Location</h2><a href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-light)', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', letterSpacing: '0.04em' }}>GET DIRECTIONS <ExternalLink size={12} /></a></div><div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.06)', background: 'rgba(200,240,220,0.06)' }}><iframe title="Map" width="100%" height="220" frameBorder="0" style={{ border: 0, display: 'block' }} src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed&z=15`} allowFullScreen loading="lazy" /><div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.3)' }}><div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={16} style={{ color: 'white' }} /></div><div><p style={{ fontWeight: 700, color: 'white', fontSize: '0.88rem' }}>{event.location}</p><p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>THE SPOT</p></div></div></div></div>)}

        <PhotoGallery eventId={id} eventTitle={event.title} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '32px 0' }} />

        <div style={{ marginBottom: 32 }}><h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><MessageCircle size={18} style={{ color: 'var(--purple-light)' }} /> Comments {comments.length > 0 && <span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>({comments.length})</span>}</h2><form onSubmit={handlePostComment} style={{ marginBottom: 24 }}><div style={{ display: 'flex', gap: 12 }}><div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>{user && profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MessageCircle size={14} style={{ color: 'var(--purple-light)' }} />}</div><div style={{ flex: 1 }}><textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={user ? "Share your thoughts..." : "Log in to comment..."} disabled={!user} rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: '0.88rem', outline: 'none', resize: 'none' }} />{user && commentText.trim() && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}><button type="submit" disabled={posting} style={{ background: 'var(--purple)', border: 'none', color: 'white', padding: '8px 18px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Send size={12} /> {posting ? 'Posting...' : 'Post'}</button></div>}</div></div></form>{loadingComments ? (<div style={{ textAlign: 'center', padding: 32 }}><div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block' }} /></div>) : comments.length === 0 ? (<div style={{ textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16 }}><MessageCircle size={32} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} /><p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>No comments yet. Be the first!</p></div>) : (<div>{comments.map(comment => (<div key={comment.id} style={{ display: 'flex', gap: 12, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="group"><div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: '0.72rem', fontWeight: 800, color: 'var(--purple-light)' }}>{comment.user_avatar ? <img src={comment.user_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (comment.user_name || '?')[0].toUpperCase()}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>{comment.user_name}</span><span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{timeAgo(comment.created_at)}</span></div><p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{comment.content}</p></div>{user && user.id === comment.user_id && <button onClick={() => handleDeleteComment(comment.id)} className="opacity-0 group-hover:opacity-100" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4, alignSelf: 'flex-start' }}><Trash2 size={14} /></button>}</div>))}</div>)}</div>
      </div>

      {showFlyer && (<div onClick={() => setShowFlyer(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}><div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 600, width: '100%' }}><button onClick={() => setShowFlyer(false)} style={{ position: 'absolute', top: -40, right: 0, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button><img src={event.image} alt={event.title} style={{ width: '100%', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} /></div></div>)}

      {showFloatingCart && (<div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>{floaterExpanded && (<div style={{ maxWidth: 768, margin: '0 auto', padding: '0 16px' }}><div style={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', borderRadius: '16px 16px 0 0', padding: '16px 20px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><h4 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingCart size={14} style={{ color: 'var(--purple-light)' }} /> Cart Summary</h4><button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}><X size={10} /> Clear</button></div>{cartItems.map(item => (<div key={item.tierName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '0.85rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.tierName}</span><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><button onClick={() => removeFromCart(item.tierName)} style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10} /></button><span style={{ color: 'white', fontWeight: 700, width: 18, textAlign: 'center', fontSize: '0.78rem' }}>{item.quantity}</span><button onClick={() => addToCart(item.tierName)} style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--purple)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10} /></button></div></div><span style={{ color: 'white', fontWeight: 600 }}>N{item.totalPrice.toLocaleString()}</span></div>))}</div></div>)}<div style={{ background: 'rgba(18,18,26,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}><div style={{ maxWidth: 768, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}><button onClick={() => setFloaterExpanded(!floaterExpanded)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, background: 'none', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }}><div style={{ position: 'relative' }}><ShoppingCart size={22} style={{ color: 'var(--purple-light)' }} /><span style={{ position: 'absolute', top: -8, right: -8, background: 'var(--purple)', color: 'white', fontSize: '0.6rem', fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span></div><div style={{ flex: 1, minWidth: 0 }}><p style={{ fontWeight: 900, fontSize: '1.1rem' }}>N{cartTotal.toLocaleString()}</p><p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cartCount} ticket{cartCount > 1 ? 's' : ''}</p></div><ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.4)', transform: floaterExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} /></button><button onClick={() => handleCheckout()} disabled={buying || paymentProcessing} style={{ background: 'var(--purple)', border: 'none', color: 'white', fontWeight: 800, padding: '14px 24px', borderRadius: 12, cursor: 'pointer', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{paymentProcessing ? 'Paying...' : buying ? 'Wait...' : 'Checkout'}</button></div></div></div>)}
    </div>
  )
}
