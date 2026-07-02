import React from 'react'
import EventCard from './EventCard'

const events = [
  { id: 1, title: 'Detty December Lagos', date: 'Dec 20, 2025', location: 'Eko Hotel, Lagos', price: '₦15,000', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600', viewers: 2400, demand: 92, hot: true },
  { id: 2, title: 'Afro Nation Nigeria', date: 'Jan 5, 2026', location: 'Tafawa Balewa, Lagos', price: '₦25,000', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600', viewers: 3100, demand: 88, hot: true },
  { id: 3, title: 'Lagos Tech Summit', date: 'Feb 14, 2026', location: 'Landmark Centre', price: '₦5,000', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600', viewers: 1200, demand: 75 },
  { id: 4, title: 'Art X Lagos 2025', date: 'Nov 3, 2025', location: 'Federal Palace Hotel', price: 'FREE', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', viewers: 890, demand: 65 },
]

export default function TrendingEvents() {
  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="section-tag section-tag-white" style={{ marginBottom: 16 }}>
          🔥 Trending Now
        </span>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 12 }}>
          Events everyone's{' '}
          <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>talking about.</span>
        </h2>

        <div style={{
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24
        }}>
          {events.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      </div>
    </section>
  )
}
