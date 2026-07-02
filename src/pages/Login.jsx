import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    const result = login({ email: form.email, password: form.password })
    setLoading(false)
    if (result.ok) {
      toast.success('Welcome back! 🔥')
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
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>Welcome back</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: '0.95rem' }}>
          Sign in to your Planam account. Don't have one? <Link to="/signup" style={{ color: 'var(--purple-light)', textDecoration: 'none', fontWeight: 600 }}>Create account</Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input type="email" required placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type={showPw ? 'text' : 'password'} required placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: 38, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="btn btn-purple" disabled={loading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
            <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>{loading ? 'SIGNING IN…' : 'SIGN IN'}</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </form>
      </div>
    </div>
  )
}
