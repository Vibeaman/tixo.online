import React, { useState, useEffect } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = ['Discover', 'Host Event', 'Pricing', 'About']

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(18,13,53,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(123,78,247,0.15)' : 'none',
      transition: 'all 0.3s'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        {/* Logo */}
        <img src="/logo-white.svg" alt="planam.io" style={{ height: 34 }} />

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
          {links.map(l => (
            <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'white'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
            >{l}</a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          <a href="#" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
          <button className="btn btn-purple">
            <span className="btn-label">GET STARTED</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden" style={{ background: 'rgba(18,13,53,0.97)', backdropFilter: 'blur(20px)', padding: '16px 24px 24px', borderTop: '1px solid rgba(123,78,247,0.15)' }}>
          {links.map(l => (
            <a key={l} href="#" style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{l}</a>
          ))}
          <button className="btn btn-purple" style={{ marginTop: 16, width: '100%' }}>
            <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>GET STARTED</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>
      )}
    </nav>
  )
}
