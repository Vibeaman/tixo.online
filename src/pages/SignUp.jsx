import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function SignUp() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    const result = signup({ name: form.name, email: form.email, password: form.password })
    setLoading(false)
    if (result.ok) {
      toast.success('Welcome to Planam! 🎉')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link to="/" style={{ display: 'block', marginBottom: 40 }}>
          <img src="/logo-white.svg" alt="planam.io" style={{ height: 32 }} />
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>Create your account</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: '0.95rem' }}>
          Join Africa's #1 event platform. Already have an account? <Link to="/login" style={{ color: 'var(--purple-light)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
            <input type="text" required placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input type="email" required placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type={showPw ? 'text' : 'password'} required placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: 38, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
            <input type="password" required placeholder="Repeat password" value={form.confirm} onChange={e => set('confirm', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <button type="submit" className="btn btn-purple" disabled={loading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
            <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>{loading ? 'CREATING…' : 'CREATE ACCOUNT'}</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </form>
      </div>
    </div>
  )
}
