import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Flame, Search } from 'lucide-react'

export default function Hero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const tags = ['Afrobeats', 'Tech Lagos', 'Art Basel', 'Food Fest', 'Comedy Night']

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(query ? `/events?q=${encodeURIComponent(query)}` : '/events')
  }

  return (
    <section style={{
      position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
      background: `radial-gradient(ellipse at 30% 20%, rgba(123,78,247,0.15) 0%, transparent 60%),
                   radial-gradient(ellipse at 70% 80%, rgba(91,46,212,0.1) 0%, transparent 50%),
                   var(--dark)`,
      overflow: 'hidden'
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '140px 24px 80px', width: '100%', textAlign: 'center' }}>
        {/* Tag */}
        <span className="section-tag section-tag-white" style={{ marginBottom: 32, display: 'inline-flex' }}>
          <Flame size={12} style={{ color: '#9D7AFA' }} /> Africa's #1 Event Platform
        </span>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginTop: 24 }}>
          Discover events.<br />
          Reward your people.<br />
          <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>Build tribes.</span>
        </h1>

        <p style={{ marginTop: 20, fontSize: '1.15rem', color: 'rgba(255,255,255,0.55)', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          Find, host, and experience the best events across Africa. One platform for everything.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{
          marginTop: 40, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto',
          display: 'flex', alignItems: 'stretch',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
            <Search size={18} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input type="text" placeholder="Search events, artists, venues…" value={query} onChange={e => setQuery(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'white', width: '100%', fontSize: '0.95rem', padding: '16px 0' }}
            />
          </div>
          <button type="submit" style={{
            background: 'var(--purple)', border: 'none', color: 'white', padding: '0 28px',
            fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.03em', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            SEARCH <ArrowRight size={16} />
          </button>
        </form>

        {/* Trending tags */}
        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', alignSelf: 'center', marginRight: 4 }}>Trending:</span>
          {tags.map(t => (
            <span key={t} onClick={() => navigate(`/events?q=${encodeURIComponent(t)}`)} style={{
              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600,
              background: 'rgba(123,78,247,0.1)', border: '1px solid rgba(123,78,247,0.2)',
              color: 'var(--purple-light)', cursor: 'pointer', transition: 'all 0.2s'
            }}>{t}</span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-purple" onClick={() => navigate('/events')}>
            <span className="btn-label">BROWSE EVENTS</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/create')}>
            <span className="btn-label">CREATE EVENT</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>
      </div>
    </section>
  )
}
