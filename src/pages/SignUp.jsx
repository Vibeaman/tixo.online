import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthService from '../services/AuthService'

export default function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

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

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 space-y-5">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">You're almost in! 🎉</h1>
            <p className="text-gray-400">
              We sent a verification link to <span className="text-purple-400 font-medium">{form.email}</span>.
              Click it to activate your account.
            </p>
            <p className="text-gray-500 text-sm">
              Check your spam folder if you don't see it within a minute.
            </p>
            <div className="pt-2 space-y-3">
              <button onClick={() => navigate('/login')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Go to Login
              </button>
              <button onClick={() => { setSuccess(false); setForm({ fullName: '', email: '', password: '', confirm: '' }) }}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium py-3 rounded-xl transition-colors">
                Sign Up with a Different Email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join Planam</h1>
          <p className="text-gray-400">Create your account and start exploring events</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input name="fullName" value={form.fullName} onChange={update} required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Your full name" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input name="email" type="email" value={form.email} onChange={update} required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="you@email.com" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={update} required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input name="confirm" type={show ? 'text' : 'password'} value={form.confirm} onChange={update} required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Repeat password" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight className="w-5 h-5" /></>}
          </button>
          <p className="text-center text-gray-400 text-sm">
            Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
