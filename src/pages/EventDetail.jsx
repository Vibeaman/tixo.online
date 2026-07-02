import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Calendar, Clock, Ticket, Share2, Heart, ArrowLeft, Minus, Plus, ShoppingCart, Video, Globe, ExternalLink, Users, MessageCircle, Send, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import EventService from '../services/EventService'
import TicketService from '../services/TicketService'
import CommentService from '../services/CommentService'
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
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState(null)
  const [qty, setQty] = useState(1)
  const [buying, setBuying] = useState(false)
  const [liked, setLiked] = useState(false)

  // Comments state
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await EventService.getById(id)
        setEvent(data)
        if (data?.ticket_tiers?.length) setSelectedTier(data.ticket_tiers[0])
      } catch (e) {
        toast.error('Event not found')
        navigate('/events')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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

  async function handleBuy() {
    if (!user) { toast.error('Please log in to buy tickets'); navigate('/login'); return }
    if (!selectedTier) return
    setBuying(true)
    try {
      await TicketService.purchase({
        eventId: event.id,
        eventTitle: event.title,
        tierName: selectedTier.name,
        quantity: qty,
        totalPrice: selectedTier.price * qty,
        userId: user.id
      })
      toast.success(`🎉 ${qty}x ${selectedTier.name} ticket${qty > 1 ? 's' : ''} purchased!`)
      navigate('/dashboard')
    } catch (e) {
      toast.error(e.message || 'Purchase failed')
    } finally {
      setBuying(false)
    }
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
    } finally {
      setPosting(false)
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await CommentService.delete(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (e) {
      toast.error('Failed to delete comment')
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!event) return null

  const tiers = event.ticket_tiers || []
  const startDate = formatDate(event.date)
  const endDate = formatDate(event.end_date)
  const startTime = formatTime(event.time)
  const endTime = formatTime(event.end_time)
  const badge = getEventTypeBadge(event.event_type)
  const BadgeIcon = badge.icon

  const isMultiDay = event.end_date && event.end_date !== event.date

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 pb-16">
      {/* Back button */}
      <div className="max-w-3xl mx-auto px-4 mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* Hero Image — Luma style */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] mb-8">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Action buttons on image */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setLiked(!liked)} className={`p-2.5 rounded-full backdrop-blur-md transition ${liked ? 'bg-pink-500/80 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}>
              <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }} className="bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/60 transition">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Event type badge on image */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md ${badge.color}`}>
              <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
            </span>
            <span className="bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {event.category}
            </span>
          </div>
        </div>

        {/* Title & Host — Luma style */}
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

        {/* Date & Location — Luma style blocks */}
        <div className="space-y-4 mb-8">
          {/* Date block */}
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

          {/* Location block */}
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

          {/* Virtual link block */}
          {(event.event_type === 'virtual' || event.event_type === 'hybrid') && event.virtual_link && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Virtual Event</p>
                <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                  Join online <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
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

        {/* Divider */}
        <div className="border-t border-white/10 my-8" />

        {/* Tickets section */}
        <div id="tickets" className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Ticket className="w-5 h-5 text-purple-400" /> Select Tickets</h2>
          <div className="space-y-3 mb-6">
            {tiers.map(tier => (
              <button key={tier.name} onClick={() => { setSelectedTier(tier); setQty(1) }}
                className={`w-full text-left p-5 rounded-xl border transition-all ${selectedTier?.name === tier.name ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold text-lg">{tier.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{tier.available} remaining</p>
                  </div>
                  <p className="text-purple-400 font-bold text-lg">₦{tier.price.toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
          {selectedTier && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-400">Quantity</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><Minus className="w-4 h-4" /></button>
                  <span className="text-white font-bold w-8 text-center text-lg">{qty}</span>
                  <button onClick={() => setQty(Math.min(10, qty + 1))} className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 mb-5">
                <div className="flex justify-between text-gray-400 text-sm mb-1"><span>{selectedTier.name} × {qty}</span><span>₦{(selectedTier.price * qty).toLocaleString()}</span></div>
                <div className="flex justify-between text-white font-bold text-xl mt-3"><span>Total</span><span>₦{(selectedTier.price * qty).toLocaleString()}</span></div>
              </div>
              <button onClick={handleBuy} disabled={buying}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg">
                <ShoppingCart className="w-5 h-5" />
                {buying ? 'Processing...' : `Get Ticket${qty > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-8" />

        {/* Comments Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" /> 
            Comments {comments.length > 0 && <span className="text-sm font-normal text-gray-500">({comments.length})</span>}
          </h2>

          {/* Comment input */}
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

          {/* Comments list */}
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
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0 overflow-hidden">
                    {comment.user_avatar ? (
                      <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      comment.user_name[0].toUpperCase()
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">{comment.user_name}</span>
                      <span className="text-gray-600 text-xs">{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                  {/* Delete button (own comments only) */}
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
