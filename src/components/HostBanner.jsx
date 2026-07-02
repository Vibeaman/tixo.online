import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

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

export default function HostBanner() {
  const navigate = useNavigate()

  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        background: 'linear-gradient(135deg, rgba(123,78,247,0.08), rgba(91,46,212,0.04))',
        border: '1px solid rgba(123,78,247,0.15)',
        padding: 'clamp(40px, 5vw, 64px)'
      }}>
        <span className="section-tag section-tag-white" style={{ marginBottom: 16 }}>
          🎤 For Event Hosts
        </span>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 12, maxWidth: 600 }}>
          Everything you need to{' '}
          <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>sell-out</span>{' '}
          your next event.
        </h2>

        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--purple-light)', flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>

        <button className="btn btn-purple" style={{ marginTop: 32 }} onClick={() => navigate('/create')}>
          <span className="btn-label">START HOSTING FREE</span>
          <span className="btn-arrow"><ArrowRight size={16} /></span>
        </button>

        {/* Stats grid */}
        <div style={{
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 1,
          background: 'rgba(123,78,247,0.15)',
          border: '1px solid rgba(123,78,247,0.15)'
        }}>
          {stats.map(([val, label, sub], i) => (
            <div key={i} style={{
              background: 'var(--dark)', padding: '24px 20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: i % 2 === 0 ? 'var(--purple-light)' : 'white' }}>{val}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
