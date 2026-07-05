import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Ticket, Mic2, Users, Store } from 'lucide-react'
import { Tilt3D, ScrollReveal, GlowCard, FloatingShapes, MorphBlob } from './Interactive3D'

const roles = [
  {
    num: '01', badge: 'ATTENDEE',
    icon: Ticket, title: 'Attendees',
    desc: 'Discover events, buy tickets instantly, and earn rewards for attending.',
    cta: 'Find Events', to: '/events',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.05))',
  },
  {
    num: '02', badge: 'ORGANIZER',
    icon: Mic2, title: 'Organizers',
    desc: 'Create, manage, and sell out your events with powerful tools.',
    cta: 'Start Creating', to: '/create',
    gradient: 'linear-gradient(135deg, rgba(147,51,234,0.2), rgba(139,92,246,0.05))',
  },
  {
    num: '03', badge: 'PROMOTER',
    icon: Users, title: 'Promoters',
    desc: 'Share events, build tribes around shared passions. Earn commission on every ticket sold.',
    cta: 'Join Network', to: '/signup',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.05))',
  },
  {
    num: '04', badge: 'VENDOR',
    icon: Store, title: 'Vendors',
    desc: 'Showcase your brand at top events. Connect with thousands of attendees.',
    cta: 'Learn More', to: '/signup',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))',
  },
]

function RoleCard({ r, i }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <ScrollReveal direction={i % 2 === 0 ? 'left' : 'right'} delay={0.15 + i * 0.12} rotate={i % 2 === 0 ? -2 : 2}>
      <Tilt3D intensity={22} glowColor="rgba(139,92,246,0.25)">
        <div
          onClick={() => navigate(r.to)}
          className="card-3d-lift"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: 'var(--dark)',
            borderRadius: 16,
            border: '1.5px solid rgba(139,92,246,0.15)',
            padding: '28px 24px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background gradient on hover */}
          <div style={{
            position: 'absolute', inset: 0,
            background: r.gradient,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.5s',
            zIndex: 0,
          }} />

          {/* Animated corner accent */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(139,92,246,0.1)',
            transform: hovered ? 'scale(3)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
            zIndex: 0,
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                color: hovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
                letterSpacing: '0.08em', transition: 'color 0.3s',
              }}>
                ROLE · {r.num}
              </span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, color: 'var(--purple-light)',
                background: 'rgba(139,92,246,0.15)', padding: '4px 10px', borderRadius: 999,
                letterSpacing: '0.06em',
                transform: hovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.3s',
              }}>
                {r.badge}
              </span>
            </div>

            <div style={{
              width: 48, height: 48,
              background: hovered ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.12)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
              transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
              transform: hovered ? 'rotate(-12deg) scale(1.15) translateY(-4px)' : 'rotate(0) scale(1)',
              boxShadow: hovered ? '0 8px 25px rgba(139,92,246,0.3)' : 'none',
            }}>
              <r.icon size={22} style={{
                color: 'var(--purple-light)',
                transition: 'color 0.3s',
                ...(hovered ? { color: 'white' } : {}),
              }} />
            </div>

            <h3 style={{
              fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: 8,
              transition: 'transform 0.3s',
              transform: hovered ? 'translateX(4px)' : 'translateX(0)',
            }}>{r.title}</h3>

            <div style={{
              borderTop: '2px dashed rgba(139,92,246,0.2)', margin: '12px 0', width: '100%',
              transition: 'border-color 0.3s',
              borderColor: hovered ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.2)',
            }} />

            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{r.desc}</p>

            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 16, fontSize: '0.8rem', fontWeight: 700, color: 'var(--purple-light)',
              transition: 'all 0.3s',
              transform: hovered ? 'translateX(8px)' : 'translateX(0)',
            }}>
              {r.cta} <ArrowRight size={14} style={{
                transition: 'transform 0.3s',
                transform: hovered ? 'translateX(4px)' : 'translateX(0)',
              }} />
            </span>
          </div>
        </div>
      </Tilt3D>
    </ScrollReveal>
  )
}

export default function RoleCards() {
  return (
    <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px', background: 'var(--lavender)', position: 'relative', overflow: 'hidden' }}>
      {/* Background decorative elements */}
      <div style={{ position: 'absolute', top: '10%', right: '-5%', opacity: 0.5 }}>
        <MorphBlob size={300} color="rgba(139,92,246,0.06)" />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Vision card */}
        <ScrollReveal direction="up" delay={0.1} distance={50}>
          <Tilt3D intensity={8} glowColor="rgba(139,92,246,0.15)">
            <div style={{
              background: 'var(--dark)',
              borderRadius: 20,
              border: '1.5px solid rgba(139,92,246,0.25)',
              padding: 'clamp(32px, 5vw, 48px)',
              marginBottom: 48,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: 'var(--lavender)' }} />
              <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: 'var(--lavender)' }} />

              {/* Animated accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, transparent, #E91E8C, #8B5CF6, #00BFFF, transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              }} />

              <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 900, color: 'var(--purple-light)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
                THE VISION
              </h3>
              <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 520 }}>
                Power your movement. From ticketing to discovery and promotion, Tixo is built for the African event scene — and built to scale.
              </p>
              <span onClick={() => window.location.href = '/events'} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginTop: 28, fontSize: '0.85rem', fontWeight: 700, color: 'white',
                letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer'
              }}>
                EXPLORE EVENTS <ArrowRight size={16} style={{ color: 'var(--purple-light)' }} />
              </span>
            </div>
          </Tilt3D>
        </ScrollReveal>

        {/* Section heading */}
        <ScrollReveal direction="up" delay={0.15}>
          <span className="section-tag section-tag-purple" style={{ marginBottom: 16 }}>
            👥 Built for Everyone
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-dark)', marginTop: 12 }}>
            One platform,{' '}
            <span style={{ color: 'var(--purple)', fontStyle: 'italic' }}>every role.</span>
          </h2>
        </ScrollReveal>

        {/* Role cards grid */}
        <div style={{
          marginTop: 40,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20
        }}>
          {roles.map((r, i) => <RoleCard key={i} r={r} i={i} />)}
        </div>
      </div>
    </section>
  )
}
