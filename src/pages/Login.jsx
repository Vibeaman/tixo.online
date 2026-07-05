import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Ticket, Sparkles, Music, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthService from '../services/AuthService'

function FloatingIcon({ icon: Icon, size, top, left, delay, color }) {
  return (
    <div style={{
      position: 'absolute', top, left,
      animation: `float ${5 + delay}s ease-in-out ${delay}s infinite`,
      opacity: 0.15,
    }}>
      <Icon size={size} style={{ color }} />
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await AuthService.login({ email: form.email, password: form.password })
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await AuthService.signInWithGoogle()
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex auth-gradient-bg">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Animated gradient background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(233,30,140,0.08) 0%, rgba(255,255,255,0.05) 50%, rgba(0,191,255,0.06) 100%)',
        }} />

        {/* Floating icons */}
        <FloatingIcon icon={Ticket} size={40} top="15%" left="10%" delay={0} color="#E91E8C" />
        <FloatingIcon icon={Music} size={32} top="30%" left="75%" delay={1.5} color="#8B5CF6" />
        <FloatingIcon icon={Sparkles} size={28} top="60%" left="20%" delay={0.8} color="#00BFFF" />
        <FloatingIcon icon={PartyPopper} size={36} top="75%" left="65%" delay={2} color="#FF6B35" />

        {/* Morphing gradient blob */}
        <div style={{
          position: 'absolute', top: '30%', left: '30%',
          width: 400, height: 400,
          background: 'linear-gradient(135deg, rgba(233,30,140,0.12), rgba(255,255,255,0.05), rgba(0,191,255,0.08))',
          animation: 'morphBlob 12s ease-in-out infinite',
          filter: 'blur(60px)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/">
            <img src="/tixo-logo.png" alt="Tixo" style={{ height: 40 }} />
          </Link>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}>
            Welcome back to<br />
            <span className="tixo-gradient-text">the vibe.</span>
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', maxWidth: 400, lineHeight: 1.7 }}>
            Your next unforgettable experience is waiting. Log in and let's get you there.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)' }}>
            © 2026 Tixo.online — Discover. Book. Experience.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md" style={{ animation: 'slideInRight 0.6s ease' }}>
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <img src="/tixo-logo.png" alt="Tixo" style={{ height: 36, margin: '0 auto' }} />
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Welcome Back</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>Log in to your Tixo account</p>
          </div>

          <div className="auth-card rounded-2xl p-8 space-y-5">
            {/* Google Sign In */}
            <button onClick={handleGoogle} disabled={googleLoading}
              className="w-full bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-800 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              {googleLoading ? 'Redirecting...' : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input name="email" type="email" value={form.email} onChange={update} required
                    className="auth-input" placeholder="you@email.com" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={update} required
                    className="auth-input" style={{ paddingRight: 44 }} placeholder="Your password" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium transition-colors" style={{ color: '#E91E8C' }}
                  onMouseEnter={e => e.target.style.color = '#A78BFA'}
                  onMouseLeave={e => e.target.style.color = '#E91E8C'}
                >Forgot password?</Link>
              </div>
              <button type="submit" disabled={loading} className="auth-btn auth-btn-primary">
                {loading ? 'Logging in...' : <><span>Log In</span><ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium" style={{ color: '#E91E8C' }}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
