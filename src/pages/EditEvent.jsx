import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Video, Globe, Plus, Trash2, ArrowRight, ArrowLeft, Check, Upload, X, Link, Repeat, Clock, Sparkles, ClipboardList, Phone, Share2, Info } from 'lucide-react'
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

export default function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [imageMode, setImageMode] = useState('url')
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
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: '',
    tiers: [{ name: 'General', price: 0, available: 100, description: '', early_bird: false, early_bird_price: 0, early_bird_end_date: '' }],
    registration_fields: [
      { id: 'phone', label: 'Phone Number', type: 'tel', enabled: false, required: false },
      { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'], enabled: false, required: false },
      { id: 'age', label: 'Age', type: 'number', enabled: false, required: false },
      { id: 'organization', label: 'Organization / Company', type: 'text', enabled: false, required: false },
      { id: 'address', label: 'Address', type: 'text', enabled: false, required: false },
    ],
    custom_fields: [],
  })

  useEffect(() => {
    async function load() {
      try {
        const ev = await EventService.getById(id)
        if (!user || ev.organizer_id !== user.id) {
          toast.error('You can only edit your own events')
          navigate('/dashboard')
          return
        }
        setForm({
          title: ev.title || '',
          description: ev.description || '',
          date: ev.date || '',
          time: ev.time || '',
          end_date: ev.end_date || '',
          end_time: ev.end_time || '',
          location: ev.location || '',
          category: ev.category || 'Music',
          event_type: ev.event_type || 'in-person',
          virtual_link: ev.virtual_link || '',
          image: ev.image || '',
          tags: ev.tags?.join(', ') || '',
          is_recurring: ev.is_recurring || false,
          recurrence_pattern: ev.recurrence_pattern || 'weekly',
          recurrence_end_date: ev.recurrence_end_date || '',
          tiers: ev.ticket_tiers?.length
            ? ev.ticket_tiers.map(t => ({
                name: t.name || '',
                price: t.price || 0,
                available: t.available || 100,
                description: t.description || '',
                early_bird: t.early_bird || false,
                early_bird_price: t.early_bird_price || 0,
                early_bird_end_date: t.early_bird_end_date || '',
              }))
            : [{ name: 'General', price: 0, available: 100, description: '', early_bird: false, early_bird_price: 0, early_bird_end_date: '' }],
          registration_fields: (() => {
            const savedFields = ev.registration_fields || []
            const presetDefaults = [
              { id: 'phone', label: 'Phone Number', type: 'tel', enabled: false, required: false },
              { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'], enabled: false, required: false },
              { id: 'age', label: 'Age', type: 'number', enabled: false, required: false },
              { id: 'organization', label: 'Organization / Company', type: 'text', enabled: false, required: false },
              { id: 'address', label: 'Address', type: 'text', enabled: false, required: false },
            ]
            const presetIds = presetDefaults.map(f => f.id)
            return presetDefaults.map(preset => {
              const saved = savedFields.find(s => s.id === preset.id)
              return saved ? { ...preset, enabled: true, required: saved.required || false } : preset
            })
          })(),
          custom_fields: (() => {
            const savedFields = ev.registration_fields || []
            const presetIds = ['phone', 'gender', 'age', 'organization', 'address']
            return savedFields.filter(f => !presetIds.includes(f.id)).map(f => ({
              id: f.id, label: f.label, type: f.type, enabled: true, required: f.required || false
            }))
          })(),
        })
        if (ev.image) setImagePreview(ev.image)
      } catch (e) {
        toast.error('Event not found')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
  }, [id, user])

  function update(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }
  function updateTier(i, field, val) {
    setForm(f => {
      const tiers = [...f.tiers]; tiers[i] = { ...tiers[i], [field]: val }; return { ...f, tiers }
    })
  }
  function addTier() { setForm(f => ({ ...f, tiers: [...f.tiers, { name: '', price: 0, available: 50, description: '', early_bird: false, early_bird_price: 0, early_bird_end_date: '' }] })) }
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

  function validateStep1() {
    if (!form.title) { toast.error('Event title is required'); return false }
    if (!form.date) { toast.error('Start date is required'); return false }
    if (form.event_type !== 'virtual' && !form.location) { toast.error('Location is required'); return false }
    if ((form.event_type === 'virtual' || form.event_type === 'hybrid') && !form.virtual_link) { toast.error('Virtual link is required'); return false }
    if (form.end_date && form.end_date < form.date) { toast.error('End date cannot be before start date'); return false }
    if (form.is_recurring && !form.recurrence_end_date) { toast.error('Recurrence end date is required'); return false }
    if (form.is_recurring && form.recurrence_end_date && form.recurrence_end_date < form.date) { toast.error('Recurrence end date cannot be before start date'); return false }
    return true
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      let finalImage = form.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'
      if (imageFile) {
        setUploading(true)
        try { finalImage = await uploadEventImage(imageFile) }
        catch (err) { toast.error('Image upload failed'); setSubmitting(false); setUploading(false); return }
        setUploading(false)
      }

      const updates = {
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        end_date: form.end_date || form.date,
        end_time: form.end_time || form.time,
        location: form.event_type === 'virtual' ? 'Online' : form.location,
        category: form.category,
        event_type: form.event_type,
        virtual_link: form.virtual_link || null,
        image: finalImage,
        is_recurring: form.is_recurring,
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null,
        recurrence_end_date: form.is_recurring ? form.recurrence_end_date : null,
        ticket_tiers: form.tiers.map(t => ({
          name: t.name,
          price: Number(t.price),
          available: Number(t.available),
          description: t.description || '',
          early_bird: t.early_bird || false,
          early_bird_price: t.early_bird ? Number(t.early_bird_price) : 0,
          early_bird_end_date: t.early_bird ? t.early_bird_end_date : '',
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
      }
      await EventService.update(id, updates)
      toast.success('✅ Event updated!')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e.message || 'Failed to update event')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#050510] flex items-center justify-center"><div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Edit Event</h1>
        <p className="text-gray-400 text-center mb-8">Update your event details</p>

        <div className="flex items-center justify-center gap-4 mb-10">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-white/15 text-white' : 'bg-white/10 text-gray-500'}`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 ${step > s ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4">Basic Details</h2>
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
                <label className="text-sm text-gray-300 mb-2 block">Event Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {EVENT_TYPES.map(et => (
                    <button key={et.value} type="button" onClick={() => setForm(f => ({ ...f, event_type: et.value }))}
                      className={`p-3 rounded-xl border text-center transition-all ${form.event_type === et.value ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                      <et.icon className={`w-5 h-5 mx-auto mb-1 ${form.event_type === et.value ? 'text-pink-400' : 'text-gray-500'}`} />
                      <p className={`text-sm font-medium ${form.event_type === et.value ? 'text-white' : 'text-gray-400'}`}>{et.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-300 mb-1 block">Start Date *</label>
                  <input name="date" type="date" value={form.date} onChange={update} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" /></div>
                <div><label className="text-sm text-gray-300 mb-1 block">Start Time</label>
                  <input name="time" type="time" value={form.time} onChange={update} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-300 mb-1 block">End Date</label>
                  <input name="end_date" type="date" value={form.end_date} onChange={update} min={form.date} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" /></div>
                <div><label className="text-sm text-gray-300 mb-1 block">End Time</label>
                  <input name="end_time" type="time" value={form.end_time} onChange={update} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20" /></div>
              </div>

              {/* Recurring Events */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${form.is_recurring ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                      <Repeat className={`w-4 h-4 ${form.is_recurring ? 'text-purple-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">This is a recurring event</p>
                      <p className="text-gray-500 text-xs">Repeats on a schedule</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${form.is_recurring ? 'bg-purple-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_recurring ? 'translate-x-5.5 left-[1px]' : 'left-[2px]'}`}
                      style={{ transform: form.is_recurring ? 'translateX(22px)' : 'translateX(0)' }} />
                  </div>
                </button>

                {form.is_recurring && (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Recurrence Pattern</label>
                      <select
                        name="recurrence_pattern"
                        value={form.recurrence_pattern}
                        onChange={update}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                      >
                        {RECURRENCE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Recurrence End Date *</label>
                      <input
                        name="recurrence_end_date"
                        type="date"
                        value={form.recurrence_end_date}
                        onChange={update}
                        min={form.date}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {form.event_type !== 'virtual' && (
                <div><label className="text-sm text-gray-300 mb-1 block">Location *</label>
                  <input name="location" value={form.location} onChange={update} placeholder="Venue, City" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" /></div>
              )}
              {(form.event_type === 'virtual' || form.event_type === 'hybrid') && (
                <div><label className="text-sm text-gray-300 mb-1 block">Virtual Meeting Link *</label>
                  <input name="virtual_link" value={form.virtual_link} onChange={update} placeholder="https://zoom.us/..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" /></div>
              )}
              <button onClick={() => { if (validateStep1()) setStep(2) }}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4">Tickets & Pricing</h2>
              {form.tiers.map((tier, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Tier {i + 1}</span>
                    {form.tiers.length > 1 && <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <input value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)} placeholder="Tier name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)} placeholder="Price (₦)"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                    <input type="number" value={tier.available} onChange={e => updateTier(i, 'available', e.target.value)} placeholder="Qty"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                  </div>

                  {/* Tier Description */}
                  <textarea
                    value={tier.description}
                    onChange={e => updateTier(i, 'description', e.target.value)}
                    placeholder="What's included in this tier? (optional)"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm resize-none"
                  />

                  {/* Early Bird Pricing — only for paid tiers */}
                  {Number(tier.price) > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
                      <button
                        type="button"
                        onClick={() => updateTier(i, 'early_bird', !tier.early_bird)}
                        className="w-full flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${tier.early_bird ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                            <Sparkles className={`w-3.5 h-3.5 ${tier.early_bird ? 'text-yellow-400' : 'text-gray-500'}`} />
                          </div>
                          <span className="text-white text-sm font-medium">Early Bird Pricing</span>
                        </div>
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${tier.early_bird ? 'bg-yellow-500' : 'bg-white/10'}`}>
                          <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            style={{ left: '2px', transform: tier.early_bird ? 'translateX(16px)' : 'translateX(0)' }} />
                        </div>
                      </button>

                      {tier.early_bird && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-yellow-400" /> Early Bird Price (₦)
                            </label>
                            <input
                              type="number"
                              value={tier.early_bird_price}
                              onChange={e => updateTier(i, 'early_bird_price', e.target.value)}
                              placeholder="0"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                              <Clock className="w-3 h-3 text-yellow-400" /> Ends On
                            </label>
                            <input
                              type="date"
                              value={tier.early_bird_end_date}
                              onChange={e => updateTier(i, 'early_bird_end_date', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/20 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addTier} className="w-full border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add Tier
              </button>

              {/* ============ REGISTRATION FIELDS ============ */}
              <div className="border-t border-white/10 pt-5 mt-5">
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardList className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-semibold">Registration Fields</p>
                    <p className="text-gray-500 text-xs">Name & Email are always collected. Add more fields below.</p>
                  </div>
                </div>
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
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Optional Fields</p>
                <div className="space-y-2 mb-4">
                  {form.registration_fields.map(field => (
                    <div key={field.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <span className="text-white text-sm">{field.label}</span>
                      <div className="flex items-center gap-3">
                        {field.enabled && (
                          <button type="button" onClick={() => toggleRegFieldRequired(field.id)}
                            className={`text-xs px-2 py-1 rounded-full transition-colors ${field.required ? 'bg-red-400/20 text-red-300' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>
                            {field.required ? 'Required' : 'Optional'}
                          </button>
                        )}
                        <button type="button" onClick={() => toggleRegField(field.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${field.enabled ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/10'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${field.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {form.custom_fields.length > 0 && (
                  <>
                    <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Custom Fields</p>
                    <div className="space-y-2 mb-4">
                      {form.custom_fields.map(field => (
                        <div key={field.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3">
                            <input type="text" placeholder="Field name (e.g. T-shirt Size)" value={field.label}
                              onChange={e => updateCustomField(field.id, 'label', e.target.value)}
                              className="flex-1 bg-transparent border-none text-white text-sm placeholder-gray-500 focus:outline-none" />
                            <select value={field.type} onChange={e => updateCustomField(field.id, 'type', e.target.value)}
                              className="bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none">
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="tel">Phone</option>
                            </select>
                            <button type="button" onClick={() => updateCustomField(field.id, 'required', !field.required)}
                              className={`text-xs px-2 py-1 rounded-full transition-colors ${field.required ? 'bg-red-400/20 text-red-300' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>
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
                <button type="button" onClick={addCustomField}
                  className="w-full border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                  <Plus className="w-4 h-4" /> Add Custom Field
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><ArrowLeft className="w-5 h-5" /> Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">Next <ArrowRight className="w-5 h-5" /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4">Media & Tags</h2>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Cover Image</label>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => { setImageMode('upload'); setForm(f => ({ ...f, image: '' })) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${imageMode === 'upload' ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button onClick={() => { setImageMode('url'); setImageFile(null) }}
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
                        <p className="text-gray-400 text-sm">Click to upload a new image</p>
                        <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP — Max 5MB</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <img src={imagePreview} alt="preview" className="rounded-xl h-48 w-full object-cover" />
                        <button onClick={clearImage} className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"><X className="w-4 h-4" /></button>
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
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Tags (comma separated)</label>
                <input name="tags" value={form.tags} onChange={update} placeholder="music, lagos, nightlife"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><ArrowLeft className="w-5 h-5" /> Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  {uploading ? '📤 Uploading...' : submitting ? 'Saving...' : '✅ Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
