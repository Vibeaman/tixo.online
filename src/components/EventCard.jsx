import React from 'react'
import { MapPin, Ticket, ArrowRight } from 'lucide-react'

export default function EventCard({ event }) {
  const lowestPrice = event.tickets?.length > 0 ? Math.min(...event.tickets.map(t => t.price)) : null
  const priceLabel = lowestPrice === 0 ? 'FREE' : lowestPrice != null ? `₦${lowestPrice.toLocaleString()}` : (event.price || '')

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
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
        {event.hot && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            background: 'var(--purple)', color: 'white',
            padding: '4px 10px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em'
          }}>HOT 🔥</span>
        )}
        {event.viewers > 0 && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            {event.viewers?.toLocaleString()} watching
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ padding: '16px 18px 18px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>{event.title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
          <span>{event.date}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} /> {event.location}
          </span>
        </div>

        {/* Demand bar */}
        {event.demand > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Ticket Demand</span>
              <span style={{ color: 'var(--purple-light)', fontWeight: 700 }}>{event.demand}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', width: `${event.demand}%`, background: 'linear-gradient(90deg, var(--purple), var(--purple-light))' }} />
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
