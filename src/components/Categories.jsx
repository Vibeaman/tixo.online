import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, Cpu, Palette, UtensilsCrossed, Trophy, Users, PartyPopper, Laugh, Tent } from 'lucide-react'
import { ScrollReveal, Tilt3D } from './Interactive3D'

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

function CategoryCard({ c, i }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <ScrollReveal direction="scale" delay={0.05 + i * 0.06}>
      <Tilt3D intensity={15} glowColor="rgba(123,78,247,0.15)">
        <div
          onClick={() => navigate(`/category/${c.name.toLowerCase()}`)}
          className="card-3d-lift"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: 'white',
            border: '1px solid rgba(123,78,247,0.08)',
            borderRadius: 16,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background fill on hover */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(123,78,247,0.08), rgba(157,122,250,0.04))',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.4s',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 52, height: 52, margin: '0 auto 14px',
              background: hovered ? 'rgba(123,78,247,0.15)' : 'var(--lavender)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
              transform: hovered ? 'scale(1.15) rotate(-8deg) translateY(-4px)' : 'scale(1)',
              boxShadow: hovered ? '0 8px 20px rgba(123,78,247,0.2)' : 'none',
            }}>
              <c.icon size={24} style={{
                color: 'var(--purple)',
                transition: 'transform 0.3s',
                transform: hovered ? 'scale(1.1)' : 'scale(1)',
              }} />
            </div>
            <h3 style={{
              fontSize: '0.95rem', fontWeight: 800,
              color: hovered ? 'var(--purple)' : 'var(--text-dark)',
              marginBottom: 4, transition: 'color 0.3s',
            }}>{c.name}</h3>
            <span style={{
              fontSize: '0.78rem',
              color: hovered ? 'var(--purple-light)' : '#8888AA',
              fontWeight: 600, transition: 'color 0.3s',
            }}>{c.count} events</span>
          </div>
        </div>
      </Tilt3D>
    </ScrollReveal>
  )
}

export default function Categories() {
  return (
    <section className="section-lavender" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal direction="up" delay={0.1}>
          <span className="section-tag section-tag-purple" style={{ marginBottom: 16 }}>
            🎯 Browse by Category
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-dark)', marginTop: 12 }}>
            Find your <span style={{ color: 'var(--purple)', fontStyle: 'italic' }}>vibe.</span>
          </h2>
        </ScrollReveal>

        <div style={{
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16
        }}>
          {cats.map((c, i) => <CategoryCard key={i} c={c} i={i} />)}
        </div>
      </div>
    </section>
  )
}
