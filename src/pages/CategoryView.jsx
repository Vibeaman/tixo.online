import React, { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import EventService from '../services/EventService'
import EventCard from '../components/EventCard'

export default function CategoryView() {
  const { name } = useParams()
  const navigate = useNavigate()
  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  const events = useMemo(() => EventService.getByCategory(name), [name])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: 20,
        }}>
          <ArrowLeft size={16} /> Back
        </button>

        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
          <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>{displayName}</span> Events
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 40, fontSize: '0.95rem' }}>
          {events.length} event{events.length !== 1 ? 's' : ''} in this category
        </p>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>No events in {displayName} yet</p>
            <p style={{ fontSize: '0.9rem', marginBottom: 20 }}>Be the first to create one!</p>
            <button onClick={() => navigate('/create')} className="btn btn-purple">
              <span className="btn-label">CREATE EVENT</span>
              <span className="btn-arrow" style={{ padding: '0 12px' }}>→</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {events.map(e => (
              <div key={e.id} onClick={() => navigate(`/events/${e.id}`)} style={{ cursor: 'pointer' }}>
                <EventCard event={e} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
