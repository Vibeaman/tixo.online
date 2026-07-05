import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Ticket } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthService from '../services/AuthService'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    await AuthService.logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <nav
      className="fixed top-0 w-full z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(5,5,16,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/tixo-logo.png" alt="Tixo" style={{ height: 28 }} className="transition-transform duration-300 group-hover:scale-105" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/events" className="text-sm font-medium transition-colors relative group"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            Browse Events
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link to="/create" className="text-sm font-medium transition-colors relative group"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            Create Event
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 group-hover:w-full transition-all duration-300" />
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {profile?.full_name?.split(' ')[0] || 'Dashboard'}
              </Link>
              <button onClick={handleLogout} className="p-2 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              ><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >Log In</Link>
              <Link to="/signup" className="text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #E91E8C, #8B5CF6)',
                  color: 'white',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(233,30,140,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 py-6 space-y-4" style={{
          background: 'rgba(5,5,16,0.98)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          animation: 'slideUp 0.3s ease',
        }}>
          <Link to="/events" onClick={() => setOpen(false)} className="block font-medium"
            style={{ color: 'rgba(255,255,255,0.6)' }}>Browse Events</Link>
          <Link to="/create" onClick={() => setOpen(false)} className="block font-medium"
            style={{ color: 'rgba(255,255,255,0.6)' }}>Create Event</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block font-medium"
                style={{ color: 'rgba(255,255,255,0.6)' }}>Dashboard</Link>
              <button onClick={() => { handleLogout(); setOpen(false) }} className="block font-medium"
                style={{ color: 'rgba(255,255,255,0.4)' }}>Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block font-medium"
                style={{ color: 'rgba(255,255,255,0.6)' }}>Log In</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="block text-center py-2.5 rounded-full font-semibold" style={{ background: 'linear-gradient(135deg, #E91E8C, #8B5CF6)', color: 'white' }}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
