import React from 'react'
import { Music, Cpu, Palette, UtensilsCrossed, Trophy, Users, PartyPopper, Laugh, Tent } from 'lucide-react'

const cats = [
  { name: 'Music', icon: Music, count: '240+' },
  { name: 'Tech', icon: Cpu, count: '180+' },
  { name: 'Art', icon: Palette, count: '120+' },
  { name: 'Food', icon: UtensilsCrossed, count: '95+' },
  { name: 'Sports', icon: Trophy, count: '160+' },
  { name: 'Community', icon: Users, count: '210+' },
  { name: 'Party', icon: PartyPopper, count: '300+' },
  { name: 'Comedy', icon: Laugh, count: '75+' },
  { name: 'Festivals', icon: Tent, count: '45+' },
]

export default function Categories() {
  return (
    <section className="section-lavender" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="section-tag section-tag-purple" style={{ marginBottom: 16 }}>
          🎯 Browse by Category
        </span>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-dark)', marginTop: 12 }}>
          Find your <span style={{ color: 'var(--purple)', fontStyle: 'italic' }}>vibe.</span>
        </h2>

        <div style={{
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16
        }}>
          {cats.map((c, i) => (
            <div key={i} style={{
              background: 'white',
              border: '1px solid rgba(123,78,247,0.08)',
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.25s, box-shadow 0.25s'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(123,78,247,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                width: 48, height: 48, margin: '0 auto 14px',
                background: 'var(--lavender)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <c.icon size={22} style={{ color: 'var(--purple)' }} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: 4 }}>{c.name}</h3>
              <span style={{ fontSize: '0.78rem', color: '#8888AA', fontWeight: 600 }}>{c.count} events</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
