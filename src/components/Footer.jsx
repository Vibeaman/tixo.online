import React from 'react'
import { ArrowRight, Twitter, Instagram, Youtube } from 'lucide-react'

const linkGroups = [
  { title: 'Discover', links: ['All Events', 'Music', 'Tech', 'Food & Drink', 'Sports', 'Festivals'] },
  { title: 'Host', links: ['Create Event', 'Pricing', 'Host Dashboard', 'Payouts', 'Help Center'] },
  { title: 'Company', links: ['About Planam', 'Careers', 'Press', 'Blog', 'Contact'] },
]

export default function Footer() {
  return (
    <footer style={{ background: 'var(--dark)', borderTop: '1px solid rgba(123,78,247,0.1)' }}>
      {/* Newsletter strip */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Stay in the loop</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Get the best events in your inbox weekly.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <input type="email" placeholder="your@email.com"
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRight: 'none', padding: '12px 16px', color: 'white', fontSize: '0.85rem',
                outline: 'none', minWidth: 220
              }}
            />
            <button className="btn btn-purple" style={{ fontSize: '0.75rem' }}>
              <span className="btn-label" style={{ padding: '12px 18px' }}>SUBSCRIBE</span>
              <span className="btn-arrow" style={{ padding: '0 12px' }}><ArrowRight size={14} /></span>
            </button>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 40
        }}>
          {/* Brand col */}
          <div>
            <img src="/logo-white.svg" alt="planam.io" style={{ height: 30, marginBottom: 16 }} />
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Africa's premier event discovery and ticketing platform.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {[Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--purple)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {linkGroups.map((g, i) => (
            <div key={i}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--purple-light)', marginBottom: 16 }}>{g.title}</h4>
              {g.links.map((l, j) => (
                <a key={j} href="#" style={{
                  display: 'block', padding: '5px 0', fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                  onMouseEnter={e => e.target.style.color = 'white'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: 48, paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12,
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)'
        }}>
          <span>© 2025 planam.io — All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
