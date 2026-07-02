import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthService from '../services/AuthService'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  async function handleLogout() {
    await AuthService.logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/planam-logo.png" alt="planam.io" style={{ height: 28 }} />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/events" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Browse Events</Link>
          <Link to="/create" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Create Event</Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 bg-purple-600/20 text-purple-400 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-600/30 transition-colors">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {profile?.full_name?.split(' ')[0] || 'Dashboard'}
              </Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2 transition-colors"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Log In</Link>
              <Link to="/signup" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">Sign Up</Link>
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
        <div className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 px-4 py-6 space-y-4">
          <Link to="/events" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-white font-medium">Browse Events</Link>
          <Link to="/create" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-white font-medium">Create Event</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-white font-medium">Dashboard</Link>
              <button onClick={() => { handleLogout(); setOpen(false) }} className="block text-gray-400 hover:text-white font-medium">Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block text-gray-300 hover:text-white font-medium">Log In</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="block bg-purple-600 text-white text-center py-2.5 rounded-full font-semibold">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
