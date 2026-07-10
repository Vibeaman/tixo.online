import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, PenLine, Share2, Zap } from 'lucide-react'
import { ScrollReveal, Tilt3D, MagneticButton, MorphBlob } from './Interactive3D'

const features = [
  'Instant event creation & publishing',
  'Real-time analytics dashboard',
  'Automated payouts in Naira',
  'Custom branding & landing pages',
]

const steps = [
  {
    icon: PenLine,
    number: '01',
    title: 'Create',
    desc: 'Set up your event in minutes — add tiers, set capacity, and customize your page.',
    gradient: 'linear-gradient(135deg, #E91E8C, #8B5CF6)',
  },
  {
    icon: Share2,
    number: '02',
    title: 'Share',
    desc: 'Send your unique event link anywhere — social media, WhatsApp, email.',
    gradient: 'linear-gradient(135deg, #8B5CF6, #00BFFF)',
  },
  {
    icon: Zap,
    number: '03',
    title: 'Collect',
    desc: 'Get RSVPs and payments instantly. Track everything from your dashboard.',
    gradient: 'linear-gradient(135deg, #00BFFF, #E91E8C)',
  },
]

function StepCard({ step, i }) {
  const [hovered, setHovered] = useState(false)
  const Icon = step.icon

  return (
    <Tilt3D intensity={12} glowColor="rgba(255,255,255,0.06)">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--dark)', padding: '32px 24px',
          textAlign: 'center', position: 'relative',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.05)',
          transition: 'border-color 0.4s, box-shadow 0.4s, transform 0.4s',
          overflow: 'hidden',
          ...(hovered ? {
            borderColor: 'rgba(255,255,255,0.12)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            transform: 'translateY(-4px)',
          } : {}),
        }}
      >
        {/* Top gradient bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: step.gradient,
          opacity: hovered ? 1 : 0.4,
          transition: 'opacity 0.4s',
        }} />

        {/* Step number */}
        <div style={{
          fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em',
          background: step.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 16,
        }}>{step.number}</div>

        {/* Icon circle */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: step.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          transition: 'transform 0.4s, box-shadow 0.4s',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          boxShadow: hovered ? `0 0 30px rgba(233, 30, 140, 0.25)` : 'none',
        }}>
          <Icon size={24} color="white" strokeWidth={2.2} />
        </div>

        {/* Title */}
        <div style={{
          fontSize: '1.2rem', fontWeight: 800, color: 'white',
          marginBottom: 8, letterSpacing: '-0.02em',
        }}>{step.title}</div>

        {/* Description */}
        <div style={{
          fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.6, maxWidth: 220, margin: '0 auto',
        }}>{step.desc}</div>

        {/* Connector arrow (not on last card) */}
        {i < steps.length - 1 && (
          <div style={{
            display: 'none', // hidden on mobile, shown on desktop via CSS
          }} className="step-connector">
            <ArrowRight size={20} style={{ color: 'rgba(255,255,255,0.15)' }} />
          </div>
        )}
      </div>
    </Tilt3D>
  )
}

export default function HostBanner() {
  const navigate = useNavigate()

  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <ScrollReveal direction="up" delay={0.1} distance={60}>
        <Tilt3D intensity={6} glowColor="rgba(255,255,255,0.05)">
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(91,46,212,0.04))',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: 'clamp(40px, 5vw, 64px)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background blob */}
            <MorphBlob size={350} color="rgba(255,255,255,0.04)" style={{ position: 'absolute', top: '-15%', right: '-10%' }} />

            {/* Animated accent line at top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, transparent, #E91E8C, #8B5CF6, #00BFFF, transparent)',
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

              {/* How it works steps */}
              <ScrollReveal direction="up" delay={0.65}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
                  marginTop: 48, marginBottom: 20,
                }}>HOW IT WORKS</div>
              </ScrollReveal>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 20,
              }}>
                {steps.map((step, i) => (
                  <ScrollReveal key={i} direction="up" delay={0.7 + i * 0.15}>
                    <StepCard step={step} i={i} />
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
