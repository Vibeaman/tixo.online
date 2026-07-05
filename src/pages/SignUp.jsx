import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, Ticket, Sparkles, Zap, Heart } from 'lucide-react'
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

export default function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  const passwordStrength = (() => {
    const p = form.password
    if (!p) return { level: 0, label: '', color: '' }
    let s = 0
    if (p.length >= 6) s++
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    if (s <= 1) return { level: 1, label: 'Weak', color: '#ef4444' }
    if (s <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' }
    if (s <= 3) return { level: 3, label: 'Good', color: '#8B5CF6' }
    return { level: 4, label: 'Strong', color: '#10b981' }
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await AuthService.signUp({ fullName: form.fullName, email: form.email, password: form.password })
      setSuccess(true)
    } catch (err) {
      toast.error(err.message || 'Sign up failed')
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

  if (success) {
    return (
      <div className="min-h-screen auth-gradient-bg flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center" style={{ animation: 'bounceIn 0.6s ease' }}>
          <div className="auth-card rounded-2xl p-10 space-y-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.2), rgba(255,255,255,0.07))' }}>
              <CheckCircle className="w-8 h-8" style={{ color: '#E91E8C' }} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>You're almost in! 🎉</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              We sent a verification link to <span style={{ color: '#E91E8C', fontWeight: 600 }}>{form.email}</span>.
              Click it to activate your account.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Check your spam folder if you don't see it within a minute.</p>
            <div className="pt-2 space-y-3">
              <button onClick={() => navigate('/login')} className="auth-btn auth-btn-primary">Go to Login</button>
              <button onClick={() => { setSuccess(false); setForm({ fullName: '', email: '', password: '', confirm: '' }) }}
                className="auth-btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                Sign Up with a Different Email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex auth-gradient-bg">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,191,255,0.06) 0%, rgba(255,255,255,0.05) 50%, rgba(233,30,140,0.08) 100%)',
        }} />

        <FloatingIcon icon={Sparkles} size={36} top="12%" left="15%" delay={0} color="#00BFFF" />
        <FloatingIcon icon={Ticket} size={32} top="35%" left="70%" delay={1} color="#E91E8C" />
        <FloatingIcon icon={Zap} size={28} top="55%" left="25%" delay={1.8} color="#8B5CF6" />
        <FloatingIcon icon={Heart} size={30} top="78%" left="60%" delay={0.5} color="#FF6B35" />

        <div style={{
          position: 'absolute', top: '40%', left: '25%',
          width: 450, height: 450,
          background: 'linear-gradient(135deg, rgba(0,191,255,0.08), rgba(255,255,255,0.05), rgba(233,30,140,0.06))',
          animation: 'morphBlob 15s ease-in-out infinite',
          filter: 'blur(70px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/">
            <img src="/tixo-logo.png" alt="Tixo" style={{ height: 40 }} />
          </Link>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: 16,
          }}>
            Your next<br />
            <span className="tixo-gradient-text">experience awaits.</span>
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', maxWidth: 400, lineHeight: 1.7 }}>
            Join thousands discovering and hosting amazing events across Africa.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
            {['🎫 Instant Tickets', '📱 QR Check-in', '🔥 Trending Events', '💰 Earn Rewards'].map((f, i) => (
              <span key={i} style={{
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500,
              }}>{f}</span>
            ))}
          </div>
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
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <img src="/tixo-logo.png" alt="Tixo" style={{ height: 36, margin: '0 auto' }} />
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>Join Tixo</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>Create your account and start exploring</p>
          </div>

          <div className="auth-card rounded-2xl p-8 space-y-5">
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

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input name="fullName" value={form.fullName} onChange={update} required className="auth-input" placeholder="Your full name" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input name="email" type="email" value={form.email} onChange={update} required className="auth-input" placeholder="you@email.com" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={update} required
                    className="auth-input" style={{ paddingRight: 44 }} placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: i <= passwordStrength.level ? passwordStrength.color : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.3s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input name="confirm" type={show ? 'text' : 'password'} value={form.confirm} onChange={update} required className="auth-input" placeholder="Repeat password" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="auth-btn auth-btn-primary">
                {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium" style={{ color: '#E91E8C' }}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
