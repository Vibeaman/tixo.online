import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Type, FileText, Image, Tag, Ticket, Plus, Trash2, ArrowRight, ArrowLeft, Check, Upload, X, Link, Video, Globe, Share2, DollarSign, Info, Repeat, Clock, Sparkles, ClipboardList, Phone, Lock, Unlock, ScanLine, Users, Layers, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import EventService from '../services/EventService'
import { useAuth } from '../context/AuthContext'
import { uploadEventImage } from '../lib/uploadImage'

const CATEGORIES = ['Music','Tech','Art','Food','Sports','Comedy','Festivals','Community','Party']
const EVENT_TYPES = [
  { value: 'in-person', label: 'In Person', icon: MapPin, desc: 'Physical venue' },
  { value: 'virtual', label: 'Virtual', icon: Video, desc: 'Online event' },
  { value: 'hybrid', label: 'Hybrid', icon: Globe, desc: 'Both in person & online' },
]

const RECURRENCE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const STEP_LABELS = ['Details', 'When & Where', 'Tickets', 'Extras', 'Review']
const TOTAL_STEPS = 5

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [imageMode, setImageMode] = useState('upload')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    title: '', description: '',
    date: '', time: '', end_date: '', end_time: '',
    location: '', category: 'Music',
    event_type: 'in-person', virtual_link: '',
    image: '', tags: '',
    virtual_access: 'public',
    require_checkin: true,
    pricing_type: 'paid',
    reshare_enabled: false,
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: '',
    tiers: [{ name: 'General', price: 0, available: 100, description: '', early_bird: false, early_bird_price: 0, early_bird_end_date: '', tier_type: 'paid', unlimited: false, max_per_purchase: 1 }],
    registration_fields: [
      { id: 'phone', label: 'Phone Number', type: 'tel', enabled: false, required: false },
      { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'], enabled: false, required: false },
      { id: 'age', label: 'Age', type: 'number', enabled: false, required: false },
      { id: 'organization', label: 'Organization / Company', type: 'text', enabled: false, required: false },
      { id: 'address', label: 'Address', type: 'text', enabled: false, required: false },
    ],
    custom_fields: [],
  })

  // ── Draft persistence: restore saved form after login redirect ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tixo_create_event_draft')
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.form) setForm(draft.form)
        if (draft.step) setStep(draft.step)
        if (draft.imagePreview) setImagePreview(draft.imagePreview)
        if (draft.imageMode) setImageMode(draft.imageMode)
        localStorage.removeItem('tixo_create_event_draft')
        toast.success('Your event draft has been restored!')
      }
    } catch { /* ignore corrupt data */ }
  }, [])

  // Save draft to localStorage before login redirect
  function saveDraftAndRedirect() {
    try {
      const draft = { form, step, imagePreview, imageMode }
      localStorage.setItem('tixo_create_event_draft', JSON.stringify(draft))
    } catch { /* storage full — proceed without saving */ }
    navigate('/login?redirect=/create-event')
  }

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function updateTier(i, field, val) {
    setForm(f => {
      const tiers = [...f.tiers]; tiers[i] = { ...tiers[i], [field]: val }; return { ...f, tiers }
    })
  }
  function addTier() { setForm(f => ({ ...f, tiers: [...f.tiers, { name: '', price: 0, available: 50, description: '', early_bird: false, early_bird_price: 0, early_bird_end_date: '', tier_type: form.pricing_type === 'mixed' ? 'paid' : 'paid', unlimited: false, max_per_purchase: 1 }] })) }
  function removeTier(i) { setForm(f => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) })) }

  function toggleRegField(id) {
    setForm(f => ({
      ...f,
      registration_fields: f.registration_fields.map(field =>
        field.id === id ? { ...field, enabled: !field.enabled, required: !field.enabled ? field.required : false } : field
      )
    }))
  }
  function toggleRegFieldRequired(id) {
    setForm(f => ({
      ...f,
      registration_fields: f.registration_fields.map(field =>
        field.id === id ? { ...field, required: !field.required } : field
      )
    }))
  }
  function addCustomField() {
    const newId = 'custom_' + Date.now()
    setForm(f => ({
      ...f,
      custom_fields: [...f.custom_fields, { id: newId, label: '', type: 'text', enabled: true, required: false }]
    }))
  }
  function updateCustomField(id, key, val) {
    setForm(f => ({
      ...f,
      custom_fields: f.custom_fields.map(field =>
        field.id === id ? { ...field, [key]: val } : field
      )
    }))
  }
  function removeCustomField(id) {
    setForm(f => ({ ...f, custom_fields: f.custom_fields.filter(field => field.id !== id) }))
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setForm(f => ({ ...f, image: '' }))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview('')
    setForm(f => ({ ...f, image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ── Validation per step ── */
  function validateStep1() {
    if (!form.title) { toast.error('Event title is required'); return false }
    return true
  }
  function validateStep2() {
    if (!form.date) { toast.error('Start date is required'); return false }
    if (form.event_type !== 'virtual' && !form.location) { toast.error('Location is required for in-person events'); return false }
    if ((form.event_type === 'virtual' || form.event_type === 'hybrid') && !form.virtual_link) { toast.error('Virtual link is required'); return false }
    if (form.end_date && form.end_date < form.date) { toast.error('End date cannot be before start date'); return false }
    if (form.is_recurring && !form.recurrence_end_date) { toast.error('Recurrence end date is required for recurring events'); return false }
    if (form.is_recurring && form.recurrence_end_date && form.recurrence_end_date < form.date) { toast.error('Recurrence end date must be after start date'); return false }
    return true
  }
  function validateStep3() {
    for (const t of form.tiers) {
      if (!t.name) { toast.error('All tiers need a name'); return false }
    }
    return true
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3 && !validateStep3()) return
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  async function handleSubmit(status = 'published') {
    if (!user) { toast.error('Please log in to publish your event'); saveDraftAndRedirect(); return }
    if (!form.title) { toast.error('Event title is required'); return }
    if (status === 'published' && !form.date) { toast.error('Start date is required'); return }
    setSubmitting(true)
    try {
      let finalImage = form.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'
      if (imageFile) {
        setUploading(true)
        try { finalImage = await uploadEventImage(imageFile) }
        catch (err) { toast.error('Image upload failed: ' + (err.message || 'Unknown error')); setSubmitting(false); setUploading(false); return }
        setUploading(false)
      }

      const eventData = {
        title: form.title,
        description: form.description,
        date: form.date || null,
        time: form.time,
        end_date: form.end_date || form.date || null,
        end_time: form.end_time || form.time,
        location: form.event_type === 'virtual' ? 'Online' : form.location,
        category: form.category,
        event_type: form.event_type,
        virtual_link: form.virtual_link || null,
        virtual_access: (form.event_type === 'virtual' || form.event_type === 'hybrid') ? form.virtual_access : null,
        require_checkin: form.event_type !== 'virtual' ? form.require_checkin : false,
        image: finalImage,
        reshare_enabled: form.reshare_enabled,
        is_recurring: form.is_recurring,
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null,
        recurrence_end_date: form.is_recurring ? form.recurrence_end_date : null,
        organizer_id: user.id,
        organizer_name: profile?.full_name || user.email,
        ticket_tiers: form.tiers.map(t => ({
          name: t.name,
          price: Number(t.price),
          available: t.unlimited ? null : Number(t.available),
          unlimited: !!t.unlimited,
          description: t.description || '',
          early_bird: t.early_bird,
          early_bird_price: t.early_bird ? Number(t.early_bird_price) : null,
          early_bird_end_date: t.early_bird ? t.early_bird_end_date : null,
          max_per_purchase: Number(t.max_per_purchase) || 1,
        })),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        registration_fields: [
          ...form.registration_fields.filter(f => f.enabled).map(f => ({
            id: f.id, label: f.label, type: f.type, required: f.required,
            ...(f.options ? { options: f.options } : {})
          })),
          ...form.custom_fields.filter(f => f.label.trim()).map(f => ({
            id: f.id, label: f.label.trim(), type: f.type, required: f.required
          }))
        ],
        watchers: 0, demand: 0,
        status
      }
      const created = await EventService.create(eventData)

      if (status === 'published' && form.is_recurring && form.recurrence_pattern && form.recurrence_end_date) {
        const endDate = new Date(form.recurrence_end_date + 'T00:00:00')
        let currentDate = new Date(form.date + 'T00:00:00')
        const childEvents = []

        while (true) {
          if (form.recurrence_pattern === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7)
          } else if (form.recurrence_pattern === 'bi-weekly') {
            currentDate.setDate(currentDate.getDate() + 14)
          } else if (form.recurrence_pattern === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1)
          } else if (form.recurrence_pattern === 'daily') {
            currentDate.setDate(currentDate.getDate() + 1)
          }

          if (currentDate > endDate) break

          const dateStr = currentDate.toISOString().split('T')[0]
          childEvents.push({
            ...eventData,
            date: dateStr,
            end_date: dateStr,
            parent_event_id: created.id,
            is_recurring: false
          })
        }

        if (childEvents.length > 0) {
          for (const child of childEvents) {
            try {
              await EventService.create(child)
            } catch (err) {
              console.warn('Failed to create recurring instance:', err)
            }
          }
          toast.success(`Created ${childEvents.length + 1} recurring event instances!`)
        }
      }

      localStorage.removeItem('tixo_create_event_draft')
      if (status === 'draft') {
        toast.success('Event saved as draft!')
      } else if (!form.is_recurring || !form.recurrence_end_date) {
        toast.success('Event published!')
      }
      navigate('/dashboard')
    } catch (e) {
      toast.error(e.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const samplePrice = form.tiers[0]?.price || 0
  const reshareOrganizer = Math.round(samplePrice * 0.90)
  const resharePlatform = Math.round(samplePrice * 0.075)
  const reshareReferrer = Math.round(samplePrice * 0.025)
  const standardOrganizer = Math.round(samplePrice * 0.95)
  const standardPlatform = Math.round(samplePrice * 0.05)

  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Event</h1>
        <p className="text-gray-400 text-center mb-8">Fill in the details to publish your event</p>

        {/* ── Progress Bar ── */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEP_LABELS.map((label, idx) => {
            const s = idx + 1
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (s < step) setStep(s)
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step === s ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25' :
                      step > s ? 'bg-white/15 text-white cursor-pointer hover:bg-white/25' :
                      'bg-white/5 text-gray-600'
                    }`}
                  >
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </button>
                  <span className={`text-[10px] font-medium ${step >= s ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
                </div>
                {s < TOTAL_STEPS && (
                  <div className={`w-8 sm:w-12 h-0.5 mb-5 transition-colors ${step > s ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">

          {/* ═══════════════ STEP 1: BASIC INFO ═══════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Type className="w-5 h-5 text-pink-400" /> Basic Info</h2>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Event Title *</label>
                <input name="title" value={form.title} onChange={update} placeholder="e.g. Afrobeats Night Live"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Description</label>
                <textarea name="description" value={form.description} onChange={update} rows={4} placeholder="Tell people what to expect..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Category</label>
                <select name="category" value={form.category} onChange={update}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Tags (comma separated)</label>
                <input name="tags" value={form.tags} onChange={update} placeholder="music, lagos, nightlife"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" />
              </div>

              <button onClick={goNext}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ═══════════════ STEP 2: WHEN & WHERE ═══════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-pink-400" /> When & Where</h2>

              {/* Event Type Toggle */}
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Event Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {EVENT_TYPES.map(et => (
                    <button key={et.value} type="button" onClick={() => setForm(f => ({ ...f, event_type: et.value }))}
                      className={`p-3 rounded-xl border text-center transition-all ${form.event_type === et.value ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                      <et.icon className={`w-5 h-5 mx-auto mb-1 ${form.event_type === et.value ? 'text-pink-400' : 'text-gray-500'}`} />
                      <p className={`text-sm font-medium ${form.event_type === et.value ? 'text-white' : 'text-gray-400'}`}>{et.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{et.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Start Date *</label>
                  <input name="date" type="date" value={form.date} onChange={update}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Start Time</label>
                  <input name="time" type="time" value={form.time} onChange={update}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">End Date</label>
                  <input name="end_date" type="date" value={form.end_date} onChange={update} min={form.date}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">End Time</label>
                  <input name="end_time" type="time" value={form.end_time} onChange={update}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" />
                </div>
              </div>

              {/* Recurring Event */}
              <div className={`border rounded-xl p-4 transition-all ${form.is_recurring ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${form.is_recurring ? 'bg-purple-500/20' : 'bg-white/10'}`}>
                      <Repeat className={`w-5 h-5 ${form.is_recurring ? 'text-purple-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Recurring Event</p>
                      <p className="text-gray-500 text-xs">Automatically repeat this event on a schedule</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.is_recurring ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_recurring ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {form.is_recurring && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-300 mb-1 block">
                          <Clock className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                          Recurrence Pattern
                        </label>
                        <select
                          name="recurrence_pattern"
                          value={form.recurrence_pattern}
                          onChange={update}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/40"
                        >
                          {RECURRENCE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-1 block">Recurrence End Date</label>
                        <input
                          name="recurrence_end_date"
                          type="date"
                          value={form.recurrence_end_date}
                          onChange={update}
                          min={form.date}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/40"
                        />
                      </div>
                    </div>
                    <p className="text-purple-300/60 text-xs">
                      This event will repeat {form.recurrence_pattern === 'weekly' ? 'every week' : form.recurrence_pattern === 'bi-weekly' ? 'every two weeks' : 'every month'}
                      {form.recurrence_end_date ? ` until ${form.recurrence_end_date}` : ''}.
                    </p>
                  </div>
                )}
              </div>

              {/* Location */}
              {form.event_type !== 'virtual' && (
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Location *</label>
                  <input name="location" value={form.location} onChange={update} placeholder="Venue, City"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" />
                </div>
              )}

              {/* Virtual link */}
              {(form.event_type === 'virtual' || form.event_type === 'hybrid') && (
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Virtual Meeting Link *</label>
                  <input name="virtual_link" value={form.virtual_link} onChange={update} placeholder="https://zoom.us/... or https://meet.google.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" />
                </div>
              )}

              {/* Virtual Access Control */}
              {(form.event_type === 'virtual' || form.event_type === 'hybrid') && (
                <div className={`border rounded-xl p-4 transition-all ${form.virtual_access === 'private' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {form.virtual_access === 'private' ? (
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-amber-400" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Unlock className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">Virtual Access Control</p>
                      <p className="text-gray-500 text-xs">Who gets the meeting link after registration?</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setForm(f => ({ ...f, virtual_access: 'public' }))}
                      className={`p-3 rounded-xl border text-center transition-all ${form.virtual_access === 'public' ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                      <Unlock className={`w-5 h-5 mx-auto mb-1 ${form.virtual_access === 'public' ? 'text-green-400' : 'text-gray-500'}`} />
                      <p className={`text-sm font-medium ${form.virtual_access === 'public' ? 'text-white' : 'text-gray-400'}`}>Public</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Instant access to link</p>
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, virtual_access: 'private' }))}
                      className={`p-3 rounded-xl border text-center transition-all ${form.virtual_access === 'private' ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                      <Lock className={`w-5 h-5 mx-auto mb-1 ${form.virtual_access === 'private' ? 'text-amber-400' : 'text-gray-500'}`} />
                      <p className={`text-sm font-medium ${form.virtual_access === 'private' ? 'text-white' : 'text-gray-400'}`}>Private</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">You approve first</p>
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">
                    {form.virtual_access === 'public' ? 'Attendees get the meeting link immediately after registration.' : 'Attendees must be approved by you before they can see the meeting link.'}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={goNext}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 3: TICKETS ═══════════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Ticket className="w-5 h-5 text-pink-400" /> Tickets & Pricing</h2>

              {/* Free / Paid / Mixed Toggle */}
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Event Pricing *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        pricing_type: 'free',
                        reshare_enabled: false,
                        tiers: f.tiers.map(t => ({ ...t, price: 0, tier_type: 'free', early_bird: false, early_bird_price: 0, early_bird_end_date: '' }))
                      }))
                    }}
                    className={`p-4 rounded-xl border text-center transition-all ${form.pricing_type === 'free' ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                  >
                    <Ticket className={`w-6 h-6 mx-auto mb-1.5 ${form.pricing_type === 'free' ? 'text-green-400' : 'text-gray-500'}`} />
                    <p className={`text-sm font-semibold ${form.pricing_type === 'free' ? 'text-white' : 'text-gray-400'}`}>Free</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">No charges</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, pricing_type: 'paid', tiers: f.tiers.map(t => ({ ...t, tier_type: 'paid' })) }))}
                    className={`p-4 rounded-xl border text-center transition-all ${form.pricing_type === 'paid' ? 'border-pink-500/30 bg-pink-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                  >
                    <DollarSign className={`w-6 h-6 mx-auto mb-1.5 ${form.pricing_type === 'paid' ? 'text-pink-400' : 'text-gray-500'}`} />
                    <p className={`text-sm font-semibold ${form.pricing_type === 'paid' ? 'text-white' : 'text-gray-400'}`}>Paid</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Set prices</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, pricing_type: 'mixed', tiers: f.tiers.map(t => ({ ...t, tier_type: Number(t.price) > 0 ? 'paid' : 'free' })) }))}
                    className={`p-4 rounded-xl border text-center transition-all ${form.pricing_type === 'mixed' ? 'border-purple-500/30 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                  >
                    <Layers className={`w-6 h-6 mx-auto mb-1.5 ${form.pricing_type === 'mixed' ? 'text-purple-400' : 'text-gray-500'}`} />
                    <p className={`text-sm font-semibold ${form.pricing_type === 'mixed' ? 'text-white' : 'text-gray-400'}`}>Mixed</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Free + Paid</p>
                  </button>
                </div>
              </div>

              {/* Tier Cards */}
              {form.tiers.map((tier, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Tier {i + 1}</span>
                    {form.tiers.length > 1 && <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <input value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)} placeholder="Tier name (e.g. VIP)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />

                  <input value={tier.description} onChange={e => updateTier(i, 'description', e.target.value)} placeholder="What's included in this tier? (optional)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />

                  {/* Per-tier Free/Paid toggle for Mixed mode */}
                  {form.pricing_type === 'mixed' && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { updateTier(i, 'tier_type', 'free'); updateTier(i, 'price', 0); updateTier(i, 'early_bird', false); updateTier(i, 'early_bird_price', 0); updateTier(i, 'early_bird_end_date', '') }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tier.tier_type === 'free' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'}`}>
                        <Ticket className="w-3.5 h-3.5" /> Free Tier
                      </button>
                      <button type="button" onClick={() => updateTier(i, 'tier_type', 'paid')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tier.tier_type === 'paid' ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30' : 'bg-white/5 text-gray-500 border border-white/10 hover:border-white/20'}`}>
                        <DollarSign className="w-3.5 h-3.5" /> Paid Tier
                      </button>
                    </div>
                  )}

                  {form.pricing_type === 'free' || (form.pricing_type === 'mixed' && tier.tier_type === 'free') ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-semibold text-sm">FREE</span>
                      </div>
                      {tier.unlimited ? (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                          <span className="text-purple-400 font-semibold text-sm">Unlimited</span>
                        </div>
                      ) : (
                        <input type="number" value={tier.available} onChange={e => updateTier(i, 'available', e.target.value)} placeholder="Qty available"
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                      )}
                    </div>
                  ) : (form.pricing_type === 'paid' || (form.pricing_type === 'mixed' && tier.tier_type === 'paid')) ? (
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" value={tier.price || ''} onChange={e => updateTier(i, 'price', e.target.value)} placeholder="₦ Ticket amount"
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                      {tier.unlimited ? (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                          <span className="text-purple-400 font-semibold text-sm">Unlimited</span>
                        </div>
                      ) : (
                        <input type="number" value={tier.available} onChange={e => updateTier(i, 'available', e.target.value)} placeholder="Qty available"
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                      )}
                    </div>
                  ) : null}

                  {/* Unlimited toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" checked={!!tier.unlimited} onChange={e => { updateTier(i, 'unlimited', e.target.checked); if (e.target.checked) updateTier(i, 'available', '') }}
                        className="sr-only peer" />
                      <div className="w-9 h-5 bg-white/10 rounded-full peer-checked:bg-purple-500/50 transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-gray-400 rounded-full peer-checked:translate-x-4 peer-checked:bg-purple-400 transition-all" />
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Unlimited capacity</span>
                  </label>

                  {/* Max Per Purchase */}
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-500" />
                    <label className="text-xs text-gray-400">Max per person</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={tier.max_per_purchase === '' ? '' : tier.max_per_purchase}
                      onChange={e => updateTier(i, 'max_per_purchase', e.target.value)}
                      onBlur={e => { if (!e.target.value || Number(e.target.value) < 1) updateTier(i, 'max_per_purchase', 1) }}
                      placeholder="1"
                      className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-white/20"
                    />
                  </div>

                  {/* Early Bird Pricing */}
                  {(form.pricing_type === 'paid' || (form.pricing_type === 'mixed' && tier.tier_type === 'paid')) && Number(tier.price) > 0 && (
                    <div className={`border rounded-lg p-3 transition-all ${tier.early_bird ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className={`w-4 h-4 ${tier.early_bird ? 'text-amber-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm font-medium ${tier.early_bird ? 'text-amber-300' : 'text-gray-400'}`}>Early Bird Pricing</p>
                            <p className="text-gray-500 text-[11px]">Offer a discounted price for early buyers</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateTier(i, 'early_bird', !tier.early_bird)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${tier.early_bird ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${tier.early_bird ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>

                      {tier.early_bird && (
                        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-amber-300/70 mb-1 block">Early Bird Price (NGN)</label>
                            <input
                              type="number"
                              value={tier.early_bird_price}
                              onChange={e => {
                                const val = e.target.value
                                if (Number(val) >= Number(tier.price)) {
                                  toast.error('Early bird price must be less than regular price')
                                  return
                                }
                                updateTier(i, 'early_bird_price', val)
                              }}
                              placeholder="Discounted price"
                              max={Number(tier.price) - 1}
                              className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-amber-300/70 mb-1 block">Ends On</label>
                            <input
                              type="date"
                              value={tier.early_bird_end_date}
                              onChange={e => updateTier(i, 'early_bird_end_date', e.target.value)}
                              className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500/40 text-sm"
                            />
                          </div>
                          {Number(tier.early_bird_price) > 0 && (
                            <div className="col-span-2">
                              <p className="text-amber-400/60 text-xs">
                                Savings: NGN {(Number(tier.price) - Number(tier.early_bird_price)).toLocaleString()} off
                                ({Math.round(((Number(tier.price) - Number(tier.early_bird_price)) / Number(tier.price)) * 100)}% discount)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addTier} className="w-full border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add Tier
              </button>

              {/* Reshare Toggle — only for paid/mixed events */}
              {form.pricing_type !== 'free' && <div className="border-t border-white/10 pt-5 mt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-pink-400" />
                    <div>
                      <p className="text-white font-semibold">Enable Public Reshare</p>
                      <p className="text-gray-500 text-xs">Let anyone earn commissions promoting your event</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, reshare_enabled: !f.reshare_enabled }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.reshare_enabled ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.reshare_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {form.reshare_enabled && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-pink-400" />
                      <p className="text-pink-300 text-sm font-medium">Revenue Split (per ticket)</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">You (Organizer)</span>
                        <span className="text-green-400 font-bold">90%{samplePrice > 0 ? ` · NGN ${reshareOrganizer.toLocaleString()}` : ''}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tixo</span>
                        <span className="text-gray-300 font-medium">7.5%{samplePrice > 0 ? ` · NGN ${resharePlatform.toLocaleString()}` : ''}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Referrer (Affiliate)</span>
                        <span className="text-pink-400 font-bold">2.5%{samplePrice > 0 ? ` · NGN ${reshareReferrer.toLocaleString()}` : ''}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/5 mt-3 pt-3">
                      <p className="text-gray-500 text-xs">Without reshare: You get 95%, Tixo gets 5%{samplePrice > 0 ? ` (NGN ${standardOrganizer.toLocaleString()} / NGN ${standardPlatform.toLocaleString()})` : ''}</p>
                    </div>
                  </div>
                )}
              </div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={goNext}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 4: EXTRAS ═══════════════ */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-pink-400" /> Extras</h2>

              {/* Cover Image */}
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Cover Image</label>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => { setImageMode('upload'); setForm(f => ({ ...f, image: '' })) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${imageMode === 'upload' ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button onClick={() => { setImageMode('url'); clearImage() }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${imageMode === 'url' ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <Link className="w-4 h-4" /> URL
                  </button>
                </div>
                {imageMode === 'upload' ? (
                  <div>
                    {!imageFile ? (
                      <div onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all">
                        <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Click to upload an image</p>
                        <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP — Max 5MB</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <img src={imagePreview} alt="preview" className="rounded-xl h-48 w-full object-cover" />
                        <button onClick={clearImage} className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                        <p className="text-gray-400 text-xs mt-2">{imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(1)}MB)</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </div>
                ) : (
                  <div>
                    <input name="image" value={form.image} onChange={update} placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" />
                    {form.image && <img src={form.image} alt="preview" className="mt-3 rounded-xl h-40 w-full object-cover" />}
                  </div>
                )}
              </div>

              {/* Gate Check-in Toggle */}
              {(form.event_type === 'in-person' || form.event_type === 'hybrid') && (
                <div className={`border rounded-xl p-4 transition-all ${form.require_checkin ? 'border-pink-500/30 bg-pink-500/5' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${form.require_checkin ? 'bg-pink-500/20' : 'bg-white/10'}`}>
                        <ScanLine className={`w-5 h-5 ${form.require_checkin ? 'text-pink-400' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Gate Check-in</p>
                        <p className="text-gray-500 text-xs">
                          {form.require_checkin ? 'Attendees must show QR code ticket at gate' : 'No gate check-in — tickets auto-marked attended after event'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, require_checkin: !f.require_checkin }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.require_checkin ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.require_checkin ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Registration Fields */}
              <div className="border-t border-white/10 pt-5 mt-5">
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardList className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-semibold">Registration Fields</p>
                    <p className="text-gray-500 text-xs">Name & Email are always collected. Add more fields below.</p>
                  </div>
                </div>

                {/* Default fields */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <span className="text-white text-sm">Full Name</span>
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">Always collected</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <span className="text-white text-sm">Email Address</span>
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">Always collected</span>
                  </div>
                </div>

                {/* Toggleable preset fields */}
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Optional Fields</p>
                <div className="space-y-2 mb-4">
                  {form.registration_fields.map(field => (
                    <div key={field.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <span className="text-white text-sm">{field.label}</span>
                      <div className="flex items-center gap-3">
                        {field.enabled && (
                          <button
                            type="button"
                            onClick={() => toggleRegFieldRequired(field.id)}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${field.required ? 'bg-red-400/20 text-red-300' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                          >
                            {field.required ? 'Required' : 'Optional'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleRegField(field.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${field.enabled ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${field.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom fields */}
                {form.custom_fields.length > 0 && (
                  <>
                    <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Custom Fields</p>
                    <div className="space-y-2 mb-4">
                      {form.custom_fields.map(field => (
                        <div key={field.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              placeholder="Field name (e.g. T-shirt Size)"
                              value={field.label}
                              onChange={e => updateCustomField(field.id, 'label', e.target.value)}
                              className="flex-1 bg-transparent border-none text-white text-sm placeholder-gray-500 focus:outline-none"
                            />
                            <select
                              value={field.type}
                              onChange={e => updateCustomField(field.id, 'type', e.target.value)}
                              className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="tel">Phone</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => updateCustomField(field.id, 'required', !field.required)}
                              className={`text-xs px-2 py-1 rounded-full transition-colors ${field.required ? 'bg-red-400/20 text-red-300' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                            >
                              {field.required ? 'Required' : 'Optional'}
                            </button>
                            <button type="button" onClick={() => removeCustomField(field.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={addCustomField}
                  className="w-full border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Custom Field
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={goNext}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  Review <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 5: REVIEW & PUBLISH ═══════════════ */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-pink-400" /> Review & Publish</h2>

              {/* Image preview */}
              {(imagePreview || form.image) && (
                <img src={imagePreview || form.image} alt="Cover" className="rounded-xl h-44 w-full object-cover" />
              )}

              {/* Summary sections */}
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Type className="w-4 h-4 text-pink-400" /> Basic Info</h3>
                    <button onClick={() => setStep(1)} className="text-xs text-pink-400 hover:text-pink-300">Edit</button>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1.5">
                    <p><span className="text-gray-500">Title:</span> <span className="text-white">{form.title || '—'}</span></p>
                    {form.description && <p><span className="text-gray-500">Description:</span> {form.description.substring(0, 120)}{form.description.length > 120 ? '...' : ''}</p>}
                    <p><span className="text-gray-500">Category:</span> {form.category}</p>
                    {form.tags && <p><span className="text-gray-500">Tags:</span> {form.tags}</p>}
                  </div>
                </div>

                {/* When & Where */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-pink-400" /> When & Where</h3>
                    <button onClick={() => setStep(2)} className="text-xs text-pink-400 hover:text-pink-300">Edit</button>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1.5">
                    <p><span className="text-gray-500">Type:</span> {EVENT_TYPES.find(t => t.value === form.event_type)?.label}</p>
                    <p><span className="text-gray-500">Starts:</span> {form.date || '—'} {form.time}</p>
                    {form.end_date && <p><span className="text-gray-500">Ends:</span> {form.end_date} {form.end_time}</p>}
                    <p><span className="text-gray-500">Location:</span> {form.event_type === 'virtual' ? 'Online' : (form.location || '—')}</p>
                    {form.is_recurring && (
                      <p><span className="text-gray-500">Recurring:</span> {RECURRENCE_OPTIONS.find(o => o.value === form.recurrence_pattern)?.label}{form.recurrence_end_date ? ` until ${form.recurrence_end_date}` : ''}</p>
                    )}
                    {(form.event_type === 'virtual' || form.event_type === 'hybrid') && (
                      <p><span className="text-gray-500">Virtual Access:</span> {form.virtual_access === 'private' ? 'Private (approval required)' : 'Public (instant access)'}</p>
                    )}
                  </div>
                </div>

                {/* Tickets */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Ticket className="w-4 h-4 text-pink-400" /> Tickets</h3>
                    <button onClick={() => setStep(3)} className="text-xs text-pink-400 hover:text-pink-300">Edit</button>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1.5">
                    <p><span className="text-gray-500">Pricing:</span> {form.pricing_type === 'free' ? 'Free Event' : form.pricing_type === 'mixed' ? 'Mixed (Free + Paid)' : 'Paid Event'}</p>
                    {form.tiers.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-white font-medium">{t.name || `Tier ${i + 1}`}</span>
                        <span className="text-gray-500">·</span>
                        <span className={form.pricing_type === 'free' || (form.pricing_type === 'mixed' && t.tier_type === 'free') ? 'text-green-400' : 'text-pink-400'}>
                          {form.pricing_type === 'free' || (form.pricing_type === 'mixed' && t.tier_type === 'free') ? 'Free' : `NGN ${Number(t.price).toLocaleString()}`}
                        </span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-500">{t.unlimited ? 'Unlimited' : `${t.available} spots`}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-500">Max {t.max_per_purchase || 1}/person</span>
                        {t.early_bird && <span className="text-amber-400 text-xs ml-auto">Early Bird</span>}
                      </div>
                    ))}
                    {form.pricing_type !== 'free' && <p><span className="text-gray-500">Reshare:</span> {form.reshare_enabled ? 'Enabled (90/7.5/2.5 split)' : 'Off (95/5 split)'}</p>}
                  </div>
                </div>

                {/* Extras */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Image className="w-4 h-4 text-pink-400" /> Extras</h3>
                    <button onClick={() => setStep(4)} className="text-xs text-pink-400 hover:text-pink-300">Edit</button>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1.5">
                    <p><span className="text-gray-500">Image:</span> {imageFile ? imageFile.name : (form.image ? 'URL provided' : 'Default')}</p>
                    {(form.event_type === 'in-person' || form.event_type === 'hybrid') && (
                      <p><span className="text-gray-500">Gate Check-in:</span> {form.require_checkin ? 'Required (QR scan at gate)' : 'Off (auto-attended after event)'}</p>
                    )}
                    <p>
                      <span className="text-gray-500">Registration:</span>{' '}
                      Name, Email
                      {form.registration_fields.filter(f => f.enabled).length > 0 && `, ${form.registration_fields.filter(f => f.enabled).map(f => f.label).join(', ')}`}
                      {form.custom_fields.filter(f => f.label.trim()).length > 0 && `, ${form.custom_fields.filter(f => f.label.trim()).map(f => f.label).join(', ')}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={() => handleSubmit('draft')} disabled={submitting}
                  className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  {submitting ? '...' : 'Save Draft'}
                </button>
                <button onClick={() => handleSubmit('published')} disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  {uploading ? 'Uploading image...' : submitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
