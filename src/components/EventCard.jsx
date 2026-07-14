import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Ticket, ArrowRight, Video, Globe, Calendar, Clock, Eye } from 'lucide-react'
import { Tilt3D, GlowCard } from './Interactive3D'

export default function EventCard({ event }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const lowestPrice = event.ticket_tiers?.length > 0 ? Math.min(...event.ticket_tiers.map(t => t.price)) : null
  const fallbackPrice = event.tickets?.length > 0 ? Math.min(...event.tickets.map(t => t.price)) : null
  const price = lowestPrice ?? fallbackPrice
  const priceLabel = price === 0 ? 'FREE' : price != null ? `₦${price.toLocaleString()}` : (event.price || '')

  const isVirtual = event.event_type === 'virtual'
  const isHybrid = event.event_type === 'hybrid'

  const eventEndRef = event.end_date || event.date
  const eventEndTimeRef = event.end_time || event.time || '23:59'
  const isEnded = eventEndRef ? new Date(`${eventEndRef}T${eventEndTimeRef}:00`) < new Date() : false

  let dateDisplay = event.date || ''
  if (event.end_date && event.end_date !== event.date) {
    dateDisplay = `${event.date} – ${event.end_date}`
  }

  let shortDate = ''
  if (event.date) {
    try {
      const d = new Date(event.date + 'T00:00:00')
      shortDate = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
      if (event.time) {
        const [h, m] = event.time.split(':')
        const hr = parseInt(h)
        shortDate += ` · ${hr % 12 || 12}${m !== '00' ? ':' + m : ''}${hr >= 12 ? 'PM' : 'AM'}`
      }
    } catch { shortDate = dateDisplay }
  }

  return (
    <Tilt3D intensity={18} glowColor="rgba(255,255,255,0.1)">
      <div
        onClick={() => navigate(`/events/${event.id}`)}
        className="card-3d-lift"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--dark)',
          border: '1.5px solid rgba(255,255,255,0.05)',
          borderRadius: 16,
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Animated top border glow on hover */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, #E91E8C, #8B5CF6, #00BFFF, transparent)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.4s',
          zIndex: 5,
        }} />

        {/* Image */}
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          <img src={event.image} alt={event.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
              transform: hovered ? 'scale(1.12)' : 'scale(1)',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: hovered
              ? 'linear-gradient(transparent 20%, rgba(18,13,53,0.9))'
              : 'linear-gradient(transparent 40%, rgba(18,13,53,0.85))',
            transition: 'background 0.4s',
          }} />
          
          {(isVirtual || isHybrid) && (
            <span style={{
              position: 'absolute', top: 12, left: 12,
              display: 'flex', alignItems: 'center', gap: 4,
              background: isVirtual ? 'rgba(59,130,246,0.3)' : 'rgba(20,184,166,0.3)',
              color: isVirtual ? '#60a5fa' : '#2dd4bf',
              padding: '4px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800,
              backdropFilter: 'blur(8px)', border: `1px solid ${isVirtual ? 'rgba(59,130,246,0.3)' : 'rgba(20,184,166,0.3)'}`
            }}>
              {isVirtual ? <Video size={10} /> : <Globe size={10} />}
              {isVirtual ? 'VIRTUAL' : 'HYBRID'}
            </span>
          )}

          {event.hot && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(255,255,255,0.12)', color: 'white',
              padding: '4px 10px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em',
              borderRadius: 999, backdropFilter: 'blur(8px)',
              animation: 'glowPulse 2s ease-in-out infinite',
            }}>🔥 HOT</span>
          )}

          {isEnded && (
            <span style={{
              position: 'absolute', top: 12, right: event.hot ? 80 : 12,
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(239,68,68,0.25)', color: '#fca5a5',
              padding: '4px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800,
              backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.3)',
              letterSpacing: '0.06em',
            }}>
              <Clock size={10} /> ENDED
            </span>
          )}

          <span style={{
            position: 'absolute', bottom: 12, right: 12,
            fontWeight: 800, fontSize: '0.85rem',
            color: priceLabel === 'FREE' ? '#4ade80' : 'white',
            background: priceLabel === 'FREE' ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg, rgba(233,30,140,0.3), rgba(255,255,255,0.1))',
            border: `1px solid ${priceLabel === 'FREE' ? 'rgba(74,222,128,0.3)' : 'rgba(233,30,140,0.3)'}`,
            padding: '5px 14px', borderRadius: 999,
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.3s',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}>{priceLabel}</span>
        </div>

        {/* Details */}
        <div style={{ padding: '16px 18px 18px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 800, marginBottom: 10,
            letterSpacing: '-0.01em', color: 'white',
            transition: 'color 0.3s',
            ...(hovered ? { color: 'var(--purple-light)' } : {}),
          }}>{event.title}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
            <Calendar size={12} style={{
              color: 'var(--purple-light)', flexShrink: 0,
              transition: 'transform 0.3s',
              transform: hovered ? 'rotate(-15deg) scale(1.2)' : 'none',
            }} />
            {shortDate || dateDisplay}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
            {isVirtual ? <Video size={12} style={{ color: 'var(--purple-light)', flexShrink: 0 }} /> : <MapPin size={12} style={{
              color: 'var(--purple-light)', flexShrink: 0,
              transition: 'transform 0.3s',
              transform: hovered ? 'translateY(-3px) scale(1.2)' : 'none',
            }} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isVirtual ? 'Online Event' : event.location}
            </span>
          </div>

          {event.demand > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Ticket Demand</span>
                <span style={{ color: 'var(--purple-light)', fontWeight: 700 }}>{event.demand}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div className="demand-bar-fill" style={{
                  height: '100%', width: `${event.demand}%`,
                  background: 'linear-gradient(90deg, #E91E8C, #8B5CF6, #00BFFF)',
                  borderRadius: 2,
                  boxShadow: hovered ? '0 0 12px rgba(233,30,140,0.3)' : 'none',
                  transition: 'box-shadow 0.3s',
                }} />
              </div>
            </div>
          )}

          <div style={{
            marginTop: 16, display: 'flex', justifyContent: 'flex-end',
            transform: hovered ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.3s',
          }}>
            {isEnded ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, padding: '8px 14px', borderRadius: 10, fontSize: '0.68rem' }}><Eye size={11} /> VIEW EVENT</span>
            ) : (
              <span className="btn btn-purple btn-3d" style={{ fontSize: '0.68rem', borderRadius: 10 }}>
                <span className="btn-label" style={{ padding: '8px 14px', gap: 5 }}><Ticket size={11} /> GET TICKETS</span>
                <span className="btn-arrow" style={{ padding: '0 10px' }}><ArrowRight size={11} /></span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Tilt3D>
  )
}
