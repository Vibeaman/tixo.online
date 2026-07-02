import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import EventCard from './EventCard'
import EventService from '../services/EventService'

export default function TrendingEvents() {
  const navigate = useNavigate()
  const events = EventService.search({ sort: 'demand' }).slice(0, 4)

  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 48 }}>
          <div>
            <span className="section-tag section-tag-white" style={{ marginBottom: 16 }}>
              🔥 Trending Now
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 12 }}>
              Events everyone's{' '}
              <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>talking about.</span>
            </h2>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/events')}>
            <span className="btn-label">VIEW ALL EVENTS</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24
        }}>
          {events.map(e => (
            <div key={e.id} onClick={() => navigate(`/events/${e.id}`)} style={{ cursor: 'pointer' }}>
              <EventCard event={e} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
