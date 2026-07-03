import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import EventCard from './EventCard'
import { ScrollReveal } from './Interactive3D'

export default function TrendingEvents() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    supabase.from('events').select('*, ticket_tiers(*)').order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setEvents(data) })
  }, [])

  if (events.length === 0) return null

  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal direction="up" delay={0.1}>
          <span className="section-tag section-tag-white" style={{ marginBottom: 16 }}>
            🔥 Trending Now
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 12 }}>
            Events people{' '}
            <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>can't stop</span>{' '}
            talking about.
          </h2>
        </ScrollReveal>

        <div style={{
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {events.map((ev, i) => (
            <ScrollReveal key={ev.id} direction="up" delay={0.1 + i * 0.1} distance={40}>
              <EventCard event={ev} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
