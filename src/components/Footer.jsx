import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Twitter, Instagram, Youtube } from 'lucide-react'
import toast from 'react-hot-toast'

const linkGroups = [
  {
    title: 'Discover',
    links: [
      { label: 'All Events', to: '/events' },
      { label: 'Music', to: '/category/music' },
      { label: 'Tech', to: '/category/tech' },
      { label: 'Food & Drink', to: '/category/food' },
      { label: 'Sports', to: '/category/sports' },
      { label: 'Festivals', to: '/category/festivals' },
    ],
  },
  {
    title: 'Host',
    links: [
      { label: 'Create Event', to: '/create' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Planam', to: '/' },
      { label: 'Sign Up', to: '/signup' },
      { label: 'Login', to: '/login' },
    ],
  },
]

export default function Footer() {
  const [email, setEmail] = useState('')

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (!email) return
    toast.success('You\'re subscribed! 🎉')
    setEmail('')
  }

  return (
    <footer style={{ background: 'var(--dark)', borderTop: '1px solid rgba(123,78,247,0.1)' }}>
      {/* Newsletter strip */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Stay in the loop</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Get the best events in your inbox weekly.</p>
          </div>
          <form onSubmit={handleNewsletter} style={{ display: 'flex', alignItems: 'stretch' }}>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRight: 'none', padding: '12px 16px', color: 'white', fontSize: '0.85rem',
                outline: 'none', minWidth: 220
              }}
            />
            <button type="submit" className="btn btn-purple" style={{ fontSize: '0.75rem' }}>
              <span className="btn-label" style={{ padding: '12px 18px' }}>SUBSCRIBE</span>
              <span className="btn-arrow" style={{ padding: '0 12px' }}><ArrowRight size={14} /></span>
            </button>
          </form>
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
              {[
                { Icon: Twitter, url: 'https://twitter.com' },
                { Icon: Instagram, url: 'https://instagram.com' },
                { Icon: Youtube, url: 'https://youtube.com' },
              ].map(({ Icon, url }, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
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
                <Link key={j} to={l.to} style={{
                  display: 'block', padding: '5px 0', fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                  onMouseEnter={e => e.target.style.color = 'white'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
                >{l.label}</Link>
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
          <span>© 2026 planam.io — All rights reserved.</span>
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
