import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Video, Globe, Plus, Trash2, ArrowRight, ArrowLeft, Check, Upload, X, Link } from 'lucide-react'
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
    tiers: [{ name: 'General', price: 0, available: 100 }]
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
          tiers: ev.ticket_tiers?.length ? ev.ticket_tiers : [{ name: 'General', price: 0, available: 100 }]
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
  function addTier() { setForm(f => ({ ...f, tiers: [...f.tiers, { name: '', price: 0, available: 50 }] })) }
  function removeTier(i) { setForm(f => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) })) }

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
        ticket_tiers: form.tiers.map(t => ({ name: t.name, price: Number(t.price), available: Number(t.available) })),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
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

  if (loading) return <div className="min-h-screen bg-[#0B0B1A] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#0B0B1A] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Edit Event</h1>
        <p className="text-gray-400 text-center mb-8">Update your event details</p>

        <div className="flex items-center justify-center gap-4 mb-10">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-500'}`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 ${step > s ? 'bg-purple-600' : 'bg-white/10'}`} />}
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Description</label>
                <textarea name="description" value={form.description} onChange={update} rows={4} placeholder="Tell people what to expect..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Category</label>
                <select name="category" value={form.category} onChange={update}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Event Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {EVENT_TYPES.map(et => (
                    <button key={et.value} type="button" onClick={() => setForm(f => ({ ...f, event_type: et.value }))}
                      className={`p-3 rounded-xl border text-center transition-all ${form.event_type === et.value ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                      <et.icon className={`w-5 h-5 mx-auto mb-1 ${form.event_type === et.value ? 'text-purple-400' : 'text-gray-500'}`} />
                      <p className={`text-sm font-medium ${form.event_type === et.value ? 'text-white' : 'text-gray-400'}`}>{et.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-300 mb-1 block">Start Date *</label>
                  <input name="date" type="date" value={form.date} onChange={update} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" /></div>
                <div><label className="text-sm text-gray-300 mb-1 block">Start Time</label>
                  <input name="time" type="time" value={form.time} onChange={update} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-300 mb-1 block">End Date</label>
                  <input name="end_date" type="date" value={form.end_date} onChange={update} min={form.date} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" /></div>
                <div><label className="text-sm text-gray-300 mb-1 block">End Time</label>
                  <input name="end_time" type="time" value={form.end_time} onChange={update} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" /></div>
              </div>
              {form.event_type !== 'virtual' && (
                <div><label className="text-sm text-gray-300 mb-1 block">Location *</label>
                  <input name="location" value={form.location} onChange={update} placeholder="Venue, City" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" /></div>
              )}
              {(form.event_type === 'virtual' || form.event_type === 'hybrid') && (
                <div><label className="text-sm text-gray-300 mb-1 block">Virtual Meeting Link *</label>
                  <input name="virtual_link" value={form.virtual_link} onChange={update} placeholder="https://zoom.us/..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" /></div>
              )}
              <button onClick={() => { if (validateStep1()) setStep(2) }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)} placeholder="Price (₦)"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm" />
                    <input type="number" value={tier.available} onChange={e => updateTier(i, 'available', e.target.value)} placeholder="Qty"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm" />
                  </div>
                </div>
              ))}
              <button onClick={addTier} className="w-full border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add Tier
              </button>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><ArrowLeft className="w-5 h-5" /> Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">Next <ArrowRight className="w-5 h-5" /></button>
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${imageMode === 'upload' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button onClick={() => { setImageMode('url'); setImageFile(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${imageMode === 'url' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <Link className="w-4 h-4" /> URL
                  </button>
                </div>
                {imageMode === 'upload' ? (
                  <div>
                    {!imageFile ? (
                      <div onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-all">
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                    {form.image && <img src={form.image} alt="preview" className="mt-3 rounded-xl h-40 w-full object-cover" />}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Tags (comma separated)</label>
                <input name="tags" value={form.tags} onChange={update} placeholder="music, lagos, nightlife"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><ArrowLeft className="w-5 h-5" /> Back</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
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
