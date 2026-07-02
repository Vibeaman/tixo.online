import React from 'react'
import { ArrowRight, Ticket, Mic2, Users, Store } from 'lucide-react'

const roles = [
  {
    icon: Ticket, title: 'Attendees',
    desc: 'Discover events, buy tickets instantly, and earn rewards for attending.',
    color: 'var(--purple)',
  },
  {
    icon: Mic2, title: 'Organizers',
    desc: 'Create, manage, and sell out your events with powerful tools.',
    color: 'var(--purple-dark)',
  },
  {
    icon: Users, title: 'Communities',
    desc: 'Build tribes around shared passions. Grow together, event after event.',
    color: 'var(--purple)',
  },
  {
    icon: Store, title: 'Vendors',
    desc: 'Showcase your brand at top events. Connect with thousands of attendees.',
    color: 'var(--purple-dark)',
  },
]

export default function RoleCards() {
  return (
    <section className="section-lavender" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <span className="section-tag section-tag-purple" style={{ marginBottom: 16 }}>
          👥 Built for Everyone
        </span>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-dark)', marginTop: 12 }}>
          One platform,{' '}
          <span style={{ color: 'var(--purple)', fontStyle: 'italic' }}>every role.</span>
        </h2>

        <div style={{
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 24
        }}>
          {roles.map((r, i) => (
            <div key={i} style={{
              background: 'white',
              border: '1px solid rgba(123,78,247,0.1)',
              padding: 32,
              transition: 'transform 0.25s, box-shadow 0.25s',
              cursor: 'pointer'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(123,78,247,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                width: 48, height: 48,
                background: 'var(--lavender)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20
              }}>
                <r.icon size={22} style={{ color: r.color }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: 8 }}>{r.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#64648C', lineHeight: 1.6 }}>{r.desc}</p>
              <a href="#" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 16, fontSize: '0.82rem', fontWeight: 700, color: 'var(--purple)',
                textDecoration: 'none'
              }}>
                Learn More <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
