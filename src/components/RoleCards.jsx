import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Ticket, Mic2, Users, Store } from 'lucide-react'
import { Tilt3D, ScrollReveal } from './Interactive3D'

const roles = [
  {
    num: '01', badge: 'ATTENDEE',
    icon: Ticket, title: 'Attendees',
    desc: 'Discover events, buy tickets instantly, and earn rewards for attending.',
    cta: 'Find Events', to: '/events',
  },
  {
    num: '02', badge: 'ORGANIZER',
    icon: Mic2, title: 'Organizers',
    desc: 'Create, manage, and sell out your events with powerful tools.',
    cta: 'Start Creating', to: '/create',
  },
  {
    num: '03', badge: 'PROMOTER',
    icon: Users, title: 'Promoters',
    desc: 'Share events, build tribes around shared passions. Earn commission on every ticket sold.',
    cta: 'Join Network', to: '/signup',
  },
  {
    num: '04', badge: 'VENDOR',
    icon: Store, title: 'Vendors',
    desc: 'Showcase your brand at top events. Connect with thousands of attendees.',
    cta: 'Learn More', to: '/signup',
  },
]

export default function RoleCards() {
  const navigate = useNavigate()

  return (
    <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px', background: 'var(--lavender)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Vision card */}
        <ScrollReveal direction="up" delay={0.1}>
          <Tilt3D intensity={6} glowColor="rgba(123,78,247,0.12)">
            <div style={{
              background: 'var(--dark)',
              borderRadius: 20,
              border: '1.5px solid rgba(123,78,247,0.25)',
              padding: 'clamp(32px, 5vw, 48px)',
              marginBottom: 48,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: 'var(--lavender)' }} />
              <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', background: 'var(--lavender)' }} />

              <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 900, color: 'var(--purple-light)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
                THE VISION
              </h3>
              <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 520 }}>
                Power your movement. From ticketing to discovery and promotion, Planam is built for the African event scene — and built to scale.
              </p>
              <span onClick={() => navigate('/events')} style={{
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
          {roles.map((r, i) => (
            <ScrollReveal key={i} direction="up" delay={0.1 + i * 0.1}>
              <Tilt3D intensity={10} glowColor="rgba(123,78,247,0.18)">
                <div onClick={() => navigate(r.to)} style={{
                  background: 'var(--dark)',
                  borderRadius: 16,
                  border: '1.5px solid rgba(123,78,247,0.15)',
                  padding: '28px 24px',
                  cursor: 'pointer',
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(123,78,247,0.4)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(123,78,247,0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(123,78,247,0.15)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
                      ROLE · {r.num}
                    </span>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 800, color: 'var(--purple-light)',
                      background: 'rgba(123,78,247,0.15)', padding: '4px 10px', borderRadius: 999,
                      letterSpacing: '0.06em'
                    }}>
                      {r.badge}
                    </span>
                  </div>

                  <div style={{
                    width: 44, height: 44,
                    background: 'rgba(123,78,247,0.12)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                    transition: 'transform 0.3s, background 0.3s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(-8deg) scale(1.1)'; e.currentTarget.style.background = 'rgba(123,78,247,0.25)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(0) scale(1)'; e.currentTarget.style.background = 'rgba(123,78,247,0.12)' }}
                  >
                    <r.icon size={20} style={{ color: 'var(--purple-light)' }} />
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>{r.title}</h3>
                  <div style={{ borderTop: '2px dashed rgba(123,78,247,0.2)', margin: '12px 0', width: '100%' }} />
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{r.desc}</p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    marginTop: 16, fontSize: '0.8rem', fontWeight: 700, color: 'var(--purple-light)'
                  }}>
                    {r.cta} <ArrowRight size={14} />
                  </span>
                </div>
              </Tilt3D>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
