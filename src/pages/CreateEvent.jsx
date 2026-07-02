import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Plus, X, Image, MapPin, Calendar, Clock, Tag, FileText, Ticket } from 'lucide-react'
import EventService from '../services/EventService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const categories = ['Music', 'Tech', 'Art', 'Food', 'Sports', 'Comedy', 'Festivals', 'Community']

const STEPS = ['Details', 'Tickets', 'Review']

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '', location: '', category: 'Music',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    tickets: [{ tier: 'General Admission', price: 0, available: 100 }],
  })

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px', textAlign: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Sign in to create events</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>You need an account to publish events on Planam.</p>
          <button onClick={() => navigate('/login')} className="btn btn-purple">
            <span className="btn-label">SIGN IN</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>
      </div>
    )
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const updateTicket = (i, k, v) => {
    const tickets = [...form.tickets]
    tickets[i] = { ...tickets[i], [k]: v }
    setForm(f => ({ ...f, tickets }))
  }

  const addTicket = () => {
    setForm(f => ({ ...f, tickets: [...f.tickets, { tier: '', price: 0, available: 50 }] }))
  }

  const removeTicket = (i) => {
    if (form.tickets.length <= 1) return
    setForm(f => ({ ...f, tickets: f.tickets.filter((_, idx) => idx !== i) }))
  }

  const canNext = () => {
    if (step === 0) return form.title && form.date && form.time && form.location && form.description
    if (step === 1) return form.tickets.every(t => t.tier && t.available > 0)
    return true
  }

  const handleSubmit = () => {
    const event = EventService.create({
      ...form,
      organizer: user.name,
      organizerId: user.id,
      tickets: form.tickets.map(t => ({ ...t, price: Number(t.price), available: Number(t.available), currency: '₦' })),
    })
    toast.success('Event published! 🎉')
    navigate(`/events/${event.id}`)
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s',
  }
  const labelStyle = { fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Create <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>Event</span>
        </h1>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 40, marginTop: 24 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, position: 'relative' }}>
              <div style={{ height: 3, background: i <= step ? 'var(--purple)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: i <= step ? 'var(--purple-light)' : 'rgba(255,255,255,0.3)', marginTop: 6, display: 'block' }}>
                {i + 1}. {s}
              </span>
            </div>
          ))}
        </div>

        {/* Step 0: Details */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}><FileText size={12} style={{ display: 'inline', marginRight: 4 }} />Event Title</label>
              <input type="text" placeholder="e.g. Detty December Lagos" value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label style={labelStyle}><FileText size={12} style={{ display: 'inline', marginRight: 4 }} />Description</label>
              <textarea rows={4} placeholder="Describe your event…" value={form.description} onChange={e => set('description', e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Date</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label style={labelStyle}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Time</label>
                <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
            </div>
            <div>
              <label style={labelStyle}><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Location</label>
              <input type="text" placeholder="Venue name, City" value={form.location} onChange={e => set('location', e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label style={labelStyle}><Tag size={12} style={{ display: 'inline', marginRight: 4 }} />Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
                {categories.map(c => <option key={c} value={c} style={{ background: '#120D35' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}><Image size={12} style={{ display: 'inline', marginRight: 4 }} />Cover Image URL</label>
              <input type="url" placeholder="https://..." value={form.image} onChange={e => set('image', e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              {form.image && (
                <div style={{ marginTop: 10, height: 120, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Tickets */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {form.tickets.map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--purple-light)' }}>Tier {i + 1}</span>
                  {form.tickets.length > 1 && (
                    <button onClick={() => removeTicket(i)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Tier Name</label>
                    <input type="text" placeholder="e.g. VIP, Regular" value={t.tier} onChange={e => updateTicket(i, 'tier', e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Price (₦)</label>
                      <input type="number" min="0" value={t.price} onChange={e => updateTicket(i, 'price', e.target.value)} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Available</label>
                      <input type="number" min="1" value={t.available} onChange={e => updateTicket(i, 'available', e.target.value)} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addTicket} style={{
              padding: '14px', background: 'rgba(123,78,247,0.08)', border: '1px dashed rgba(123,78,247,0.3)',
              color: 'var(--purple-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: '0.85rem', fontWeight: 700,
            }}>
              <Plus size={16} /> Add Ticket Tier
            </button>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(20px, 3vw, 32px)' }}>
            {form.image && (
              <div style={{ height: 180, overflow: 'hidden', marginBottom: 20 }}>
                <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <span style={{ background: 'rgba(123,78,247,0.15)', color: 'var(--purple-light)', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{form.category}</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: 12, marginBottom: 12 }}>{form.title || 'Untitled Event'}</h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 16 }}>{form.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
              <span>📅 {form.date} at {form.time}</span>
              <span>📍 {form.location}</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--purple-light)' }}>Ticket Tiers</h4>
              {form.tickets.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.88rem' }}>
                  <span>{t.tier} ({t.available} tickets)</span>
                  <span style={{ fontWeight: 700, color: Number(t.price) === 0 ? '#4ade80' : 'var(--purple-light)' }}>
                    {Number(t.price) === 0 ? 'FREE' : `₦${Number(t.price).toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn btn-outline">
              <span className="btn-label"><ArrowLeft size={14} /> BACK</span>
            </button>
          ) : <div />}
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn btn-purple" disabled={!canNext()}
              style={{ opacity: canNext() ? 1 : 0.4 }}>
              <span className="btn-label">NEXT</span>
              <span className="btn-arrow"><ArrowRight size={16} /></span>
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn btn-purple">
              <span className="btn-label">PUBLISH EVENT</span>
              <span className="btn-arrow"><ArrowRight size={16} /></span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
