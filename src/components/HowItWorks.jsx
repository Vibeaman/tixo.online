import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ScrollReveal, Tilt3D, MagneticButton } from './Interactive3D'

const steps = [
  { num: '01', title: 'Discover', desc: 'Browse curated events or search by city, genre, or vibe.', emoji: '🔍' },
  { num: '02', title: 'Book', desc: 'Grab tickets in seconds with seamless mobile checkout.', emoji: '🎫' },
  { num: '03', title: 'Experience', desc: 'Show up, scan in, and enjoy unforgettable moments.', emoji: '🎉' },
  { num: '04', title: 'Earn', desc: 'Collect loyalty points and unlock exclusive perks.', emoji: '💰' },
]

function StepCard({ s, i }) {
  const [hovered, setHovered] = useState(false)

  return (
    <ScrollReveal direction="up" delay={0.1 + i * 0.15} distance={50} rotate={i % 2 === 0 ? -1 : 1}>
      <Tilt3D intensity={16} glowColor="rgba(139,92,246,0.2)">
        <div
          className="card-3d-lift"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            background: 'rgba(139,92,246,0.04)',
            border: '1px solid rgba(139,92,246,0.1)',
            borderRadius: 16,
            padding: '32px 24px',
            overflow: 'hidden',
          }}
        >
          {/* Animated number background */}
          <span style={{
            fontSize: 'clamp(4rem, 6vw, 6rem)', fontWeight: 900,
            color: 'transparent',
            WebkitTextStroke: hovered ? '2px rgba(139,92,246,0.35)' : '1.5px rgba(139,92,246,0.15)',
            lineHeight: 1, display: 'block', marginBottom: -20,
            position: 'relative', zIndex: 0,
            transition: 'all 0.4s',
            transform: hovered ? 'scale(1.1) translateX(-5px)' : 'scale(1)',
          }}>{s.num}</span>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '1.8rem', marginBottom: 8,
              transition: 'transform 0.4s',
              transform: hovered ? 'scale(1.2) rotate(-10deg)' : 'scale(1)',
            }}>{s.emoji}</div>
            <h3 style={{
              fontSize: '1.3rem', fontWeight: 800, marginBottom: 8,
              color: 'var(--purple-light)',
              transition: 'transform 0.3s',
              transform: hovered ? 'translateX(6px)' : 'translateX(0)',
            }}>{s.title}</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{s.desc}</p>
          </div>

          {/* Bottom accent line */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            height: 3,
            background: 'linear-gradient(90deg, #E91E8C, #8B5CF6, #00BFFF)',
            width: hovered ? '100%' : '0%',
            transition: 'width 0.5s cubic-bezier(0.23,1,0.32,1)',
          }} />
        </div>
      </Tilt3D>
    </ScrollReveal>
  )
}

export default function HowItWorks() {
  const navigate = useNavigate()

  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 56 }}>
          <ScrollReveal direction="left" delay={0.1}>
            <div>
              <span className="section-tag section-tag-white" style={{ marginBottom: 16 }}>
                ⚡ Simple & Seamless
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 12 }}>
                How it <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>works.</span>
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={0.2}>
            <MagneticButton strength={0.3}>
              <button className="btn btn-purple btn-3d" style={{ borderRadius: 12 }} onClick={() => navigate('/signup')}>
                <span className="btn-label">GET STARTED</span>
                <span className="btn-arrow"><ArrowRight size={16} /></span>
              </button>
            </MagneticButton>
          </ScrollReveal>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 20
        }}>
          {steps.map((s, i) => <StepCard key={i} s={s} i={i} />)}
        </div>
      </div>
    </section>
  )
}
