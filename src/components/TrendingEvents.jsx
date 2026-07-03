import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EventCard from './EventCard'
import EventService from '../services/EventService'
import { ScrollReveal } from './Interactive3D'

export default function TrendingEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Try featured first, fall back to all events
        let data = await EventService.getFeatured()
        if (!data || data.length === 0) {
          data = await EventService.getAll()
        }
        setEvents((data || []).slice(0, 6))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
          <ScrollReveal direction="left">
            <div>
              <span className="section-tag" style={{ marginBottom: 12, display: 'inline-block' }}>
                🔥 Trending Now
              </span>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                marginTop: 8,
              }}>
                Events people{' '}
                <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>can't stop</span>{' '}
                talking about.
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <button onClick={() => navigate('/events')}
              className="btn btn-purple btn-3d"
              style={{ borderRadius: 999, fontSize: '0.75rem' }}>
              <span className="btn-label" style={{ padding: '10px 20px' }}>VIEW ALL EVENTS</span>
            </button>
          </ScrollReveal>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              display: 'inline-block', width: 40, height: 40,
              border: '3px solid var(--purple)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontSize: '1.1rem' }}>No events yet — be the first to create one! 🎉</p>
            <button onClick={() => navigate('/create')}
              className="btn btn-purple btn-3d" style={{ marginTop: 20, borderRadius: 999 }}>
              <span className="btn-label" style={{ padding: '12px 24px' }}>CREATE EVENT</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {events.map((ev, i) => (
              <ScrollReveal key={ev.id} direction="up" delay={0.08 + i * 0.08} distance={40}>
                <EventCard event={ev} />
              </ScrollReveal>
            ))}
          </div>
        )}

        <button onClick={() => navigate('/events')}
          className="btn btn-purple btn-3d"
          style={{
            display: 'none',
            marginTop: 32, width: '100%', borderRadius: 999,
            fontSize: '0.8rem',
          }}>
          <span className="btn-label" style={{ padding: '14px 24px', justifyContent: 'center' }}>VIEW ALL EVENTS</span>
        </button>
      </div>
    </section>
  )
}
