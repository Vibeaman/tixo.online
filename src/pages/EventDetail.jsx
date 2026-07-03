import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { MapPin, Calendar, Clock, Ticket, Share2, Heart, ArrowLeft, Minus, Plus, ShoppingCart, Video, Globe, ExternalLink, Users, MessageCircle, Send, Trash2, Copy, Check, TrendingUp, DollarSign, Monitor, MapPinned, CheckCircle2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import EventService from '../services/EventService'
import TicketService from '../services/TicketService'
import CommentService from '../services/CommentService'
import ReferralService from '../services/ReferralService'
import { useAuth } from '../context/AuthContext'

function formatDate(dateStr) {
  if (!dateStr) return { month: '', day: '', full: '' }
  const d = new Date(dateStr + 'T00:00:00')
  return {
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    full: d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  return `${hr % 12 || 12}:${m} ${ampm}`
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

function getEventTypeBadge(type) {
  if (type === 'virtual') return { label: 'Virtual', icon: Video, color: 'bg-blue-500/20 text-blue-400' }
  if (type === 'hybrid') return { label: 'Hybrid', icon: Globe, color: 'bg-teal-500/20 text-teal-400' }
  return { label: 'In Person', icon: MapPin, color: 'bg-purple-500/20 text-purple-400' }
}

export default function EventDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  // Cart state: { tierName: qty }
  const [cart, setCart] = useState({})
  const [buying, setBuying] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  // Hybrid attendance mode
  const [attendanceMode, setAttendanceMode] = useState('in-person')

  // RSVP state
  const [hasRsvpd, setHasRsvpd] = useState(false)
  const [rsvping, setRsvping] = useState(false)

  // Purchase success state
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  // Comments state
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)

  // Reshare state
  const [reshareLink, setReshareLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showResharePanel, setShowResharePanel] = useState(false)

  // Track referral click on page load
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      sessionStorage.setItem(`ref_${id}`, ref)
      ReferralService.trackClick(ref).catch(() => {})
    }
  }, [id, searchParams])

  useEffect(() => {
    async function load() {
      try {
        const data = await EventService.getById(id)
        setEvent(data)
      } catch (e) {
        toast.error('Event not found')
        navigate('/events')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Check RSVP status
  useEffect(() => {
    async function checkRsvp() {
      if (!user || !event) return
      const isFree = event.ticket_tiers?.every(t => Number(t.price) === 0)
      if (isFree) {
        const already = await TicketService.hasRsvp(event.id, user.id)
        setHasRsvpd(already)
      }
    }
    checkRsvp()
  }, [user, event])

  useEffect(() => {
    async function loadComments() {
      try {
        const data = await CommentService.getByEvent(id)
        setComments(data)
      } catch (e) { console.error(e) }
      finally { setLoadingComments(false) }
    }
    loadComments()
  }, [id])

  // Cart helpers
  function cartQty(tierName) { return cart[tierName] || 0 }
  function addToCart(tierName) {
    setCart(c => ({ ...c, [tierName]: (c[tierName] || 0) + 1 }))
  }
  function removeFromCart(tierName) {
    setCart(c => {
      const newQty = (c[tierName] || 0) - 1
      if (newQty <= 0) { const { [tierName]: _, ...rest } = c; return rest }
      return { ...c, [tierName]: newQty }
    })
  }
  function clearCart() { setCart({}) }

  const tiers = event?.ticket_tiers || []
  const isFreeEvent = tiers.length > 0 && tiers.every(t => Number(t.price) === 0)
  const cartItems = Object.entries(cart).map(([name, qty]) => {
    const tier = tiers.find(t => t.name === name)
    return { tierName: name, quantity: qty, price: tier?.price || 0, totalPrice: (tier?.price || 0) * qty }
  }).filter(i => i.quantity > 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + i.totalPrice, 0)
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  // Reshare handlers
  async function handleGenerateReshareLink() {
    if (!user) { toast.error('Please log in to reshare'); navigate('/login'); return }
    if (user.id === event.organizer_id) { toast.error("You can't reshare your own event"); return }
    setGeneratingLink(true)
    try {
      const link = await ReferralService.getOrCreateLink(id, user.id)
      const url = `${window.location.origin}/events/${id}?ref=${link.referral_code}`
      setReshareLink(url)
      setShowResharePanel(true)
    } catch (e) {
      toast.error(e.message || 'Failed to generate link')
    } finally { setGeneratingLink(false) }
  }

  function copyReshareLink() {
    navigator.clipboard.writeText(reshareLink)
    setLinkCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setLinkCopied(false), 3000)
  }

  // RSVP handler
  async function handleRsvp() {
    if (!user) { toast.error('Please log in to RSVP'); navigate('/login'); return }
    if (hasRsvpd) return
    setRsvping(true)
    try {
      const refCode = sessionStorage.getItem(`ref_${id}`)
      await TicketService.purchase({
        eventId: event.id,
        eventTitle: event.title,
        tierName: tiers[0]?.name || 'General',
        quantity: 1,
        totalPrice: 0,
        userId: user.id,
        referralCode: refCode || null,
        attendanceMode: event.event_type === 'hybrid' ? attendanceMode : (event.event_type === 'virtual' ? 'virtual' : 'in-person'),
        isRsvp: true
      })
      sessionStorage.removeItem(`ref_${id}`)
      setHasRsvpd(true)
      setPurchaseSuccess(true)
      toast.success('🎉 RSVP confirmed!')
    } catch (e) {
      toast.error(e.message || 'RSVP failed')
    } finally { setRsvping(false) }
  }

  // Cart checkout handler
  async function handleCheckout() {
    if (!user) { toast.error('Please log in to buy tickets'); navigate('/login'); return }
    if (cartItems.length === 0) return
    setBuying(true)
    try {
      const refCode = sessionStorage.getItem(`ref_${id}`)
      const mode = event.event_type === 'hybrid' ? attendanceMode : (event.event_type === 'virtual' ? 'virtual' : 'in-person')
      
      const tickets = await TicketService.purchaseMultiple({
        eventId: event.id,
        eventTitle: event.title,
        items: cartItems,
        userId: user.id,
        referralCode: refCode || null,
        attendanceMode: mode,
        isRsvp: false
      })

      // Record commission if referral
      if (refCode && event.reshare_enabled) {
        try {
          const refLink = await ReferralService.getByCode(refCode)
          if (refLink && refLink.user_id !== user.id) {
            await ReferralService.recordCommission({
              referralLinkId: refLink.id,
              ticketId: tickets[0]?.id,
              eventId: event.id,
              referrerId: refLink.user_id,
              buyerId: user.id,
              ticketAmount: cartTotal
            })
          }
        } catch (e) { console.error('Commission tracking error:', e) }
      }

      sessionStorage.removeItem(`ref_${id}`)
      setPurchaseSuccess(true)
      setCart({})
      setShowCheckout(false)
      toast.success(`🎉 ${cartCount} ticket${cartCount > 1 ? 's' : ''} purchased!`)
    } catch (e) {
      toast.error(e.message || 'Purchase failed')
    } finally { setBuying(false) }
  }

  async function handlePostComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!user) { toast.error('Please log in to comment'); navigate('/login'); return }
    setPosting(true)
    try {
      const newComment = await CommentService.add({
        eventId: id,
        userId: user.id,
        userName: profile?.full_name || user.email.split('@')[0],
        userAvatar: profile?.avatar_url || null,
        content: commentText.trim()
      })
      setComments(prev => [newComment, ...prev])
      setCommentText('')
      toast.success('Comment posted!')
    } catch (e) {
      toast.error(e.message || 'Failed to post comment')
    } finally { setPosting(false) }
  }

  async function handleDeleteComment(commentId) {
    try {
      await CommentService.delete(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (e) { toast.error('Failed to delete comment') }
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!event) return null

  const startDate = formatDate(event.date)
  const endDate = formatDate(event.end_date)
  const startTime = formatTime(event.time)
  const endTime = formatTime(event.end_time)
  const badge = getEventTypeBadge(event.event_type)
  const BadgeIcon = badge.icon
  const isMultiDay = event.end_date && event.end_date !== event.date
  const isHybrid = event.event_type === 'hybrid'
  const isVirtual = event.event_type === 'virtual'
  const showVirtualLink = purchaseSuccess && (isVirtual || (isHybrid && attendanceMode === 'virtual')) && event.virtual_link

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 pb-16">
      {/* Back button */}
      <div className="max-w-3xl mx-auto px-4 mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* Hero Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] mb-8">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setLiked(!liked)} className={`p-2.5 rounded-full backdrop-blur-md transition ${liked ? 'bg-pink-500/80 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}>
              <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }} className="bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/60 transition">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md ${badge.color}`}>
              <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
            </span>
            <span className="bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {event.category}
            </span>
            {isFreeEvent && (
              <span className="bg-green-500/20 backdrop-blur-md text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">Free</span>
            )}
            {event.reshare_enabled && (
              <span className="bg-green-500/20 backdrop-blur-md text-green-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Reshare
              </span>
            )}
          </div>
        </div>

        {/* Title & Host */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{event.title}</h1>
          <p className="text-gray-400 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-400 text-sm font-bold overflow-hidden">
              {event.organizer_avatar ? (
                <img src={event.organizer_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (event.organizer_name || 'U')[0].toUpperCase()
              )}
            </span>
            Hosted by <span className="text-white font-medium">{event.organizer_name || 'Unknown'}</span>
          </p>
        </div>

        {/* Date & Location */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-purple-400 leading-none">{startDate.month}</span>
              <span className="text-xl font-bold text-white leading-none mt-0.5">{startDate.day}</span>
            </div>
            <div>
              <p className="text-white font-semibold">{startDate.full}</p>
              <p className="text-gray-400 text-sm">
                {startTime}{endTime ? ` – ${endTime}` : ''}
                {isMultiDay && (
                  <span className="text-gray-500"> · Ends {endDate.full}</span>
                )}
              </p>
            </div>
          </div>

          {event.event_type !== 'virtual' && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold">{event.location}</p>
                <p className="text-gray-400 text-sm">In person</p>
              </div>
            </div>
          )}

          {(isVirtual || isHybrid) && event.virtual_link && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Virtual Event</p>
                {purchaseSuccess || hasRsvpd ? (
                  <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                    Join online <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-gray-500 text-sm">Virtual link available after registration</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============ RESHARE & EARN ============ */}
        {event.reshare_enabled && (
          <>
            <div className="border-t border-white/10 my-8" />
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Reshare & Earn</h3>
                    <p className="text-gray-400 text-sm">Earn 2.5% commission on every ticket sold through your link</p>
                  </div>
                </div>

                {!showResharePanel ? (
                  <button onClick={handleGenerateReshareLink} disabled={generatingLink}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-3">
                    <Share2 className="w-4 h-4" />
                    {generatingLink ? 'Generating...' : 'Get Your Referral Link'}
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input readOnly value={reshareLink}
                        className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none" />
                      <button onClick={copyReshareLink}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors ${linkCopied ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                        {linkCopied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="border-t border-white/10 my-8" />

        {/* About */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">About This Event</h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p>
        </div>

        {/* Tags */}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {event.tags.map(t => <span key={t} className="bg-white/5 text-gray-400 text-sm px-3 py-1.5 rounded-full border border-white/5">#{t}</span>)}
          </div>
        )}

        <div className="border-t border-white/10 my-8" />

        {/* ============ PURCHASE SUCCESS ============ */}
        {purchaseSuccess && (
          <div className="mb-8">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-white font-bold text-2xl mb-2">
                {isFreeEvent ? "You're In! 🎉" : "Tickets Secured! 🎉"}
              </h3>
              <p className="text-gray-400 mb-4">
                {isFreeEvent 
                  ? "Your RSVP has been confirmed. We'll see you there!" 
                  : "Your tickets have been confirmed. Check your dashboard for details."}
              </p>
              {showVirtualLink && (
                <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors mb-3">
                  <Video className="w-5 h-5" /> Join Virtual Event <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <div className="flex items-center justify-center gap-3 mt-2">
                <Link to="/dashboard" className="text-purple-400 hover:text-purple-300 font-medium text-sm">View Dashboard →</Link>
              </div>
            </div>
          </div>
        )}

        {/* ============ HYBRID ATTENDANCE MODE ============ */}
        {isHybrid && !purchaseSuccess && !hasRsvpd && (
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3">How will you attend?</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAttendanceMode('in-person')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  attendanceMode === 'in-person'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <MapPinned className={`w-5 h-5 ${attendanceMode === 'in-person' ? 'text-purple-400' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-semibold text-sm ${attendanceMode === 'in-person' ? 'text-white' : 'text-gray-300'}`}>In Person</p>
                  <p className="text-gray-500 text-xs">Attend at venue</p>
                </div>
              </button>
              <button
                onClick={() => setAttendanceMode('virtual')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  attendanceMode === 'virtual'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Monitor className={`w-5 h-5 ${attendanceMode === 'virtual' ? 'text-blue-400' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-semibold text-sm ${attendanceMode === 'virtual' ? 'text-white' : 'text-gray-300'}`}>Virtual</p>
                  <p className="text-gray-500 text-xs">Join online</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ============ TICKETS / RSVP ============ */}
        {!purchaseSuccess && !hasRsvpd && (
          <div id="tickets" className="mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-400" /> 
              {isFreeEvent ? 'RSVP' : 'Select Tickets'}
            </h2>

            {isFreeEvent ? (
              /* ---- FREE EVENT: RSVP ---- */
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">This is a Free Event!</h3>
                <p className="text-gray-400 text-sm mb-6">RSVP to confirm your spot and get event updates</p>
                <button onClick={handleRsvp} disabled={rsvping}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 px-10 rounded-xl transition-colors text-lg inline-flex items-center gap-2">
                  {rsvping ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirming...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> RSVP – It's Free</>
                  )}
                </button>
              </div>
            ) : (
              /* ---- PAID EVENT: MULTI-TIER CART ---- */
              <>
                <div className="space-y-3 mb-6">
                  {tiers.map(tier => {
                    const qty = cartQty(tier.name)
                    return (
                      <div key={tier.name}
                        className={`p-5 rounded-xl border transition-all ${qty > 0 ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-lg">{tier.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{tier.available} remaining</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-purple-400 font-bold text-lg">₦{Number(tier.price).toLocaleString()}</p>
                            <div className="flex items-center gap-2">
                              {qty > 0 && (
                                <button onClick={() => removeFromCart(tier.name)}
                                  className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition">
                                  <Minus className="w-4 h-4" />
                                </button>
                              )}
                              {qty > 0 && (
                                <span className="text-white font-bold w-6 text-center">{qty}</span>
                              )}
                              <button onClick={() => addToCart(tier.name)}
                                className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Cart summary / checkout */}
                {cartCount > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-purple-400" /> Your Cart
                      </h3>
                      <button onClick={clearCart} className="text-gray-500 hover:text-red-400 text-xs flex items-center gap-1 transition">
                        <X className="w-3 h-3" /> Clear
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      {cartItems.map(item => (
                        <div key={item.tierName} className="flex justify-between text-sm">
                          <span className="text-gray-400">{item.tierName} × {item.quantity}</span>
                          <span className="text-white">₦{item.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-5">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold text-xl">Total</span>
                        <span className="text-purple-400 font-bold text-2xl">₦{cartTotal.toLocaleString()}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{cartCount} ticket{cartCount > 1 ? 's' : ''}</p>
                    </div>

                    <button onClick={handleCheckout} disabled={buying}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg">
                      {buying ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                      ) : (
                        <><ShoppingCart className="w-5 h-5" /> Checkout – ₦{cartTotal.toLocaleString()}</>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Already RSVP'd */}
        {hasRsvpd && !purchaseSuccess && (
          <div className="mb-8">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-bold text-xl mb-2">You've RSVP'd! ✓</h3>
              <p className="text-gray-400 text-sm">You're confirmed for this event</p>
              {(isVirtual || isHybrid) && event.virtual_link && (
                <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors mt-4 text-sm">
                  <Video className="w-4 h-4" /> Join Virtual Event <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 my-8" />

        {/* Comments */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" /> 
            Comments {comments.length > 0 && <span className="text-sm font-normal text-gray-500">({comments.length})</span>}
          </h2>

          <form onSubmit={handlePostComment} className="mb-8">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-400 text-sm font-bold flex-shrink-0 overflow-hidden">
                {user && profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={user ? "Share your thoughts about this event..." : "Log in to comment..."}
                  disabled={!user}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none text-sm disabled:opacity-50"
                />
                {user && commentText.trim() && (
                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={posting}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                      <Send className="w-3.5 h-3.5" />
                      {posting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>

          {loadingComments ? (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl">
              <MessageCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {comments.map(comment => (
                <div key={comment.id} className="group flex gap-3 py-4 border-b border-white/5 last:border-0">
                  <div className="w-9 h-9 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0 overflow-hidden">
                    {comment.user_avatar ? (
                      <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      comment.user_name[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">{comment.user_name}</span>
                      <span className="text-gray-600 text-xs">{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                  {user && user.id === comment.user_id && (
                    <button onClick={() => handleDeleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-1 transition-all flex-shrink-0 self-start mt-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
