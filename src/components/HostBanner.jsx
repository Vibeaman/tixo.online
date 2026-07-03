import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { ScrollReveal, Tilt3D, MagneticButton, MorphBlob } from './Interactive3D'

const features = [
  'Instant event creation & publishing',
  'Real-time analytics dashboard',
  'Automated payouts in Naira',
  'Custom branding & landing pages',
]

const stats = [
  ['10K+', 'Events Hosted', '+23% this month'],
  ['₦2.4B+', 'Tickets Sold', '+41% this month'],
  ['98%', 'Host Satisfaction', 'Consistently high'],
  ['50+', 'Cities Covered', 'And growing fast'],
]

function StatCard({ val, label, sub, i }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Tilt3D intensity={12} glowColor="rgba(123,78,247,0.15)">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--dark)', padding: '28px 20px',
          textAlign: 'center', position: 'relative',
          borderRadius: 12,
          border: '1px solid rgba(123,78,247,0.1)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          ...(hovered ? {
            borderColor: 'rgba(123,78,247,0.3)',
            boxShadow: '0 8px 30px rgba(123,78,247,0.15)',
          } : {}),
        }}
      >
        <div style={{
          fontSize: '1.8rem', fontWeight: 900,
          color: i % 2 === 0 ? 'var(--purple-light)' : 'white',
          transition: 'transform 0.3s',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          textShadow: hovered ? '0 0 20px rgba(123,78,247,0.3)' : 'none',
        }}>{val}</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{sub}</div>
      </div>
    </Tilt3D>
  )
}

export default function HostBanner() {
  const navigate = useNavigate()

  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <ScrollReveal direction="up" delay={0.1} distance={60}>
        <Tilt3D intensity={6} glowColor="rgba(123,78,247,0.1)">
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(123,78,247,0.08), rgba(91,46,212,0.04))',
            border: '1px solid rgba(123,78,247,0.15)',
            borderRadius: 24,
            padding: 'clamp(40px, 5vw, 64px)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background blob */}
            <MorphBlob size={350} color="rgba(123,78,247,0.08)" style={{ position: 'absolute', top: '-15%', right: '-10%' }} />

            {/* Animated accent line at top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, transparent, var(--purple), var(--purple-light), var(--purple), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <ScrollReveal direction="left" delay={0.2}>
                <span className="section-tag section-tag-white" style={{ marginBottom: 16 }}>
                  🎤 For Event Hosts
                </span>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 12, maxWidth: 600 }}>
                  Everything you need to{' '}
                  <span className="shimmer-text" style={{ fontStyle: 'italic' }}>sell-out</span>{' '}
                  your next event.
                </h2>
              </ScrollReveal>

              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {features.map((f, i) => (
                  <ScrollReveal key={i} direction="left" delay={0.3 + i * 0.1}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)',
                      transition: 'transform 0.3s, color 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                    >
                      <CheckCircle2 size={15} style={{ color: 'var(--purple-light)', flexShrink: 0 }} />
                      {f}
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <ScrollReveal direction="up" delay={0.6}>
                <MagneticButton strength={0.3} style={{ marginTop: 32 }}>
                  <button className="btn btn-purple btn-3d" style={{ borderRadius: 12 }} onClick={() => navigate('/create')}>
                    <span className="btn-label">START HOSTING FREE</span>
                    <span className="btn-arrow"><ArrowRight size={16} /></span>
                  </button>
                </MagneticButton>
              </ScrollReveal>

              {/* Stats grid */}
              <div style={{
                marginTop: 48,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}>
                {stats.map(([val, label, sub], i) => (
                  <ScrollReveal key={i} direction="up" delay={0.7 + i * 0.1}>
                    <StatCard val={val} label={label} sub={sub} i={i} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </Tilt3D>
      </ScrollReveal>
    </section>
  )
}
