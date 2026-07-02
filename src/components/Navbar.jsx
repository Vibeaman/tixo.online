import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowRight, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Browse Events', to: '/events' },
    { label: 'Create Event', to: '/create' },
  ]

  const close = () => setMenuOpen(false)

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
        <Link to="/" onClick={close}>
          <img src="/logo-white.svg" alt="planam.io" style={{ height: 34 }} />
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'white'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
            >{l.label}</Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          {user ? (
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'var(--purple)', border: 'none', color: 'white', width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              fontWeight: 800, fontSize: '0.85rem', borderRadius: '50%',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </button>
          ) : (
            <>
              <Link to="/login" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <button className="btn btn-purple">
                  <span className="btn-label">SIGN UP</span>
                  <span className="btn-arrow"><ArrowRight size={16} /></span>
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden" style={{ background: 'rgba(18,13,53,0.97)', backdropFilter: 'blur(20px)', padding: '16px 24px 24px', borderTop: '1px solid rgba(123,78,247,0.15)' }}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={close} style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{l.label}</Link>
          ))}
          {user ? (
            <Link to="/dashboard" onClick={close} style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login" onClick={close} style={{ display: 'block', padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Sign In</Link>
              <Link to="/signup" onClick={close} style={{ textDecoration: 'none' }}>
                <button className="btn btn-purple" style={{ marginTop: 16, width: '100%' }}>
                  <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>SIGN UP</span>
                  <span className="btn-arrow"><ArrowRight size={16} /></span>
                </button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
