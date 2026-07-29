import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EventCard from './EventCard'
import EventService from '../services/EventService'
import { ScrollReveal } from './Interactive3D'

export default function NewestEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await EventService.getAll() // already ordered by created_at DESC
        setEvents((data || []).slice(0, 6))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (!loading && events.length === 0) return null

  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
          <ScrollReveal direction="left">
            <div>
              <span className="section-tag" style={{ marginBottom: 12, display: 'inline-block' }}>
                🆕 Just Dropped
              </span>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                marginTop: 8,
              }}>
                The{' '}
                <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>newest</span>{' '}
                events on Tixo.
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
      </div>
    </section>
  )
}
