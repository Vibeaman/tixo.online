import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Calendar, Clock, Users, ArrowRight, ArrowLeft, Minus, Plus, Ticket, Share2 } from 'lucide-react'
import EventService from '../services/EventService'
import TicketService from '../services/TicketService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [selectedTier, setSelectedTier] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    const e = EventService.getById(id)
    if (!e) { navigate('/events'); return }
    setEvent(e)
  }, [id])

  if (!event) return null

  const ticket = event.tickets?.[selectedTier]
  const isFree = ticket?.price === 0

  const handlePurchase = () => {
    if (!user) {
      toast.error('Please sign in to get tickets')
      navigate('/login')
      return
    }
    TicketService.purchase({
      userId: user.id,
      eventId: event.id,
      eventTitle: event.title,
      tier: ticket.tier,
      price: ticket.price,
      quantity: qty,
    })
    toast.success(`${qty}x ${ticket.tier} ticket${qty > 1 ? 's' : ''} confirmed! 🎉`)
    navigate('/dashboard')
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    toast.success('Link copied!')
  }

  const formatPrice = (p) => p === 0 ? 'FREE' : `₦${p.toLocaleString()}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingTop: 80 }}>
      {/* Hero image */}
      <div style={{ position: 'relative', height: 'clamp(250px, 40vw, 420px)', overflow: 'hidden' }}>
        <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, var(--dark))' }} />
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 24, left: 24, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
          padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600,
          backdropFilter: 'blur(8px)',
        }}>
          <ArrowLeft size={16} /> Back
        </button>
        {event.hot && (
          <span style={{ position: 'absolute', top: 24, right: 24, background: 'var(--purple)', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800 }}>🔥 HOT</span>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, marginTop: -40, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40 }}>
            {/* Left: Event Info */}
            <div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ background: 'rgba(123,78,247,0.15)', color: 'var(--purple-light)', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{event.category}</span>
                {event.viewers > 0 && (
                  <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} /> {event.viewers.toLocaleString()} interested
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 20 }}>{event.title}</h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' }}>
                  <Calendar size={16} style={{ color: 'var(--purple-light)' }} />
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' }}>
                  <Clock size={16} style={{ color: 'var(--purple-light)' }} />
                  {event.time}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)' }}>
                  <MapPin size={16} style={{ color: 'var(--purple-light)' }} />
                  {event.location}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12 }}>About this event</h3>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{event.description}</p>
              </div>

              <div style={{ marginTop: 24 }}>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>Organized by</span>
                <p style={{ fontWeight: 700, marginTop: 4 }}>{event.organizer}</p>
              </div>

              <button onClick={handleShare} style={{
                marginTop: 20, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
                padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                <Share2 size={14} /> Share Event
              </button>
            </div>

            {/* Right: Ticket selection */}
            <div id="tickets">
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                padding: 'clamp(24px, 3vw, 32px)', position: 'sticky', top: 96,
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ticket size={18} style={{ color: 'var(--purple-light)' }} /> Select Tickets
                </h3>

                {/* Demand bar */}
                {event.demand > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Demand</span>
                      <span style={{ color: event.demand >= 80 ? '#f87171' : 'var(--purple-light)', fontWeight: 700 }}>{event.demand}%{event.demand >= 80 ? ' — selling fast!' : ''}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', width: `${event.demand}%`, background: event.demand >= 80 ? 'linear-gradient(90deg, var(--purple), #f87171)' : 'linear-gradient(90deg, var(--purple), var(--purple-light))', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )}

                {/* Tier selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {event.tickets?.map((t, i) => (
                    <button key={i} onClick={() => { setSelectedTier(i); setQty(1) }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 16px', cursor: 'pointer', border: '1.5px solid',
                        borderColor: selectedTier === i ? 'var(--purple)' : 'rgba(255,255,255,0.08)',
                        background: selectedTier === i ? 'rgba(123,78,247,0.08)' : 'transparent',
                        color: 'white', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.tier}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.available} remaining</span>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: t.price === 0 ? '#4ade80' : 'var(--purple-light)' }}>
                        {formatPrice(t.price)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Qty selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Quantity</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer',
                    }}><Minus size={14} /></button>
                    <span style={{ width: 48, textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(10, q + 1))} style={{
                      width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer',
                    }}><Plus size={14} /></button>
                  </div>
                </div>

                {/* Total */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Total</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: isFree ? '#4ade80' : 'white' }}>
                    {isFree ? 'FREE' : `₦${(ticket.price * qty).toLocaleString()}`}
                  </span>
                </div>

                <button onClick={handlePurchase} className="btn btn-purple" style={{ width: '100%', justifyContent: 'center' }}>
                  <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>
                    {isFree ? 'REGISTER NOW' : 'GET TICKETS'}
                  </span>
                  <span className="btn-arrow"><ArrowRight size={16} /></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
