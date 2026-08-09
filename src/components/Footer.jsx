import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Twitter, Instagram, Facebook, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

const footerLinks = [
  { label: 'All Events', to: '/events' },
  { label: 'Create Event', to: '/create' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'About Tixo', to: '/about' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
]

const socials = [
  { Icon: Twitter, url: 'https://x.com/tixoonline' },
  { Icon: Instagram, url: 'https://www.instagram.com/tixo.online?igsh=MXA5NTduOGV3ZHhjYw==' },
  { Icon: Facebook, url: 'https://www.facebook.com' },
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
    <footer style={{ background: '#050510', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Newsletter strip */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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
                outline: 'none', minWidth: 220, borderRadius: '8px 0 0 8px',
              }}
            />
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #E91E8C, #8B5CF6)',
              border: 'none', color: 'white', padding: '12px 18px',
              fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.03em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              textTransform: 'uppercase', borderRadius: '0 8px 8px 0',
            }}>
              SUBSCRIBE <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 32px' }}>
        {/* Brand row: logo + tagline + socials */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/tixo-logo.png" alt="Tixo" style={{ height: 32 }} />
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Discover. Book. Experience.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="mailto:bayorobertonline@gmail.com" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
            >
              <Mail size={14} /> bayorobertonline@gmail.com
            </a>
            {socials.map(({ Icon, url }, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s', borderRadius: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Single row of links */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 24px',
          paddingTop: 24, paddingBottom: 24,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          {footerLinks.map((l, i) => (
            <Link key={i} to={l.to} style={{
              fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = 'white'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
            >{l.label}</Link>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: 24,
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)',
        }}>
          <span>© 2026 Tixo.online — All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
