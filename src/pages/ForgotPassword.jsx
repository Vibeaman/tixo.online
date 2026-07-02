import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthService from '../services/AuthService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await AuthService.resetPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 space-y-5">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Check your email</h1>
            <p className="text-gray-400">
              We sent a password reset link to <span className="text-purple-400 font-medium">{email}</span>.
              Click the link in the email to reset your password.
            </p>
            <p className="text-gray-500 text-sm">
              Didn't get it? Check spam, or wait a minute and try again.
            </p>
            <div className="pt-2 space-y-3">
              <button onClick={() => { setSent(false); setEmail('') }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Try a Different Email
              </button>
              <Link to="/login"
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
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
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400">No worries — enter your email and we'll send you a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="you@email.com" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            {loading ? 'Sending...' : <><Send className="w-5 h-5" /><span>Send Reset Link</span></>}
          </button>
          <Link to="/login"
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </form>
      </div>
    </div>
  )
}
