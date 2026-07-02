import React from 'react'
import { MapPin, Ticket, ArrowRight, Video, Globe } from 'lucide-react'

export default function EventCard({ event }) {
  const lowestPrice = event.ticket_tiers?.length > 0 ? Math.min(...event.ticket_tiers.map(t => t.price)) : null
  const fallbackPrice = event.tickets?.length > 0 ? Math.min(...event.tickets.map(t => t.price)) : null
  const price = lowestPrice ?? fallbackPrice
  const priceLabel = price === 0 ? 'FREE' : price != null ? `₦${price.toLocaleString()}` : (event.price || '')

  const isVirtual = event.event_type === 'virtual'
  const isHybrid = event.event_type === 'hybrid'

  // Format date range
  let dateDisplay = event.date || ''
  if (event.end_date && event.end_date !== event.date) {
    dateDisplay = `${event.date} – ${event.end_date}`
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'transform 0.25s, border-color 0.25s',
      cursor: 'pointer'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(123,78,247,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img src={event.image} alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(18,13,53,0.8))' }} />
        
        {/* Event type badge */}
        {(isVirtual || isHybrid) && (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 4,
            background: isVirtual ? 'rgba(59,130,246,0.25)' : 'rgba(20,184,166,0.25)',
            color: isVirtual ? '#60a5fa' : '#2dd4bf',
            padding: '4px 10px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800,
            backdropFilter: 'blur(8px)'
          }}>
            {isVirtual ? <Video size={10} /> : <Globe size={10} />}
            {isVirtual ? 'VIRTUAL' : 'HYBRID'}
          </span>
        )}

        {event.hot && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            background: 'var(--purple)', color: 'white',
            padding: '4px 10px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em',
            borderRadius: 999
          }}>HOT 🔥</span>
        )}
        {event.watchers > 0 && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            {event.watchers?.toLocaleString()} watching
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ padding: '16px 18px 18px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>{event.title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
          <span>{dateDisplay}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isVirtual ? <Video size={12} /> : <MapPin size={12} />}
            {isVirtual ? 'Online Event' : event.location}
          </span>
        </div>

        {/* Demand bar */}
        {event.demand > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Ticket Demand</span>
              <span style={{ color: 'var(--purple-light)', fontWeight: 700 }}>{event.demand}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${event.demand}%`, background: 'linear-gradient(90deg, var(--purple), var(--purple-light))', borderRadius: 2 }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontWeight: 800, fontSize: '1rem',
            color: priceLabel === 'FREE' ? '#4ade80' : 'var(--purple-light)'
          }}>{priceLabel}</span>
          <span className="btn btn-purple" style={{ fontSize: '0.7rem' }}>
            <span className="btn-label" style={{ padding: '8px 14px' }}><Ticket size={12} /> GET TICKETS</span>
            <span className="btn-arrow" style={{ padding: '0 10px' }}><ArrowRight size={12} /></span>
          </span>
        </div>
      </div>
    </div>
  )
}
