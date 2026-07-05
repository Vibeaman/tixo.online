import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Type, FileText, Image, Tag, Ticket, Plus, Trash2, ArrowRight, ArrowLeft, Check, Upload, X, Link, Video, Globe, Share2, DollarSign, Info } from 'lucide-react'
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
    reshare_enabled: false,
    tiers: [{ name: 'General', price: 0, available: 100 }]
  })

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
    if (form.event_type !== 'virtual' && !form.location) { toast.error('Location is required for in-person events'); return false }
    if ((form.event_type === 'virtual' || form.event_type === 'hybrid') && !form.virtual_link) { toast.error('Virtual link is required'); return false }
    if (form.end_date && form.end_date < form.date) { toast.error('End date cannot be before start date'); return false }
    return true
  }

  async function handleSubmit(status = 'published') {
    if (!user) { toast.error('Please log in first'); navigate('/login'); return }
    // Drafts only need a title; published needs full validation
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
        image: finalImage,
        reshare_enabled: form.reshare_enabled,
        organizer_id: user.id,
        organizer_name: profile?.full_name || user.email,
        ticket_tiers: form.tiers.map(t => ({ name: t.name, price: Number(t.price), available: Number(t.available) })),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        watchers: 0, demand: 0,
        status
      }
      await EventService.create(eventData)
      if (status === 'draft') {
        toast.success('💾 Event saved as draft!')
      } else {
        toast.success('🎉 Event published!')
      }
      navigate('/dashboard')
    } catch (e) {
      toast.error(e.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  // Calculate revenue preview based on a sample ticket price
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

        {/* Progress */}
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
                  <input value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)} placeholder="Tier name (e.g. VIP)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)} placeholder="Price (₦)"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                    <input type="number" value={tier.available} onChange={e => updateTier(i, 'available', e.target.value)} placeholder="Qty available"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 text-sm" />
                  </div>
                </div>
              ))}
              <button onClick={addTier} className="w-full border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add Tier
              </button>

              {/* ============ RESHARE TOGGLE ============ */}
              <div className="border-t border-white/10 pt-5 mt-5">
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

                {/* Revenue split preview */}
                {form.reshare_enabled && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-pink-400" />
                      <p className="text-pink-300 text-sm font-medium">Revenue Split (per ticket)</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">You (Organizer)</span>
                        <span className="text-green-400 font-bold">90%{samplePrice > 0 ? ` · ₦${reshareOrganizer.toLocaleString()}` : ''}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tixo.io</span>
                        <span className="text-gray-300 font-medium">7.5%{samplePrice > 0 ? ` · ₦${resharePlatform.toLocaleString()}` : ''}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Referrer (Affiliate)</span>
                        <span className="text-pink-400 font-bold">2.5%{samplePrice > 0 ? ` · ₦${reshareReferrer.toLocaleString()}` : ''}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/5 mt-3 pt-3">
                      <p className="text-gray-500 text-xs">Without reshare: You get 95%, Tixo.io gets 5%{samplePrice > 0 ? ` (₦${standardOrganizer.toLocaleString()} / ₦${standardPlatform.toLocaleString()})` : ''}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  Next <ArrowRight className="w-5 h-5" />
                </button>
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
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Tags (comma separated)</label>
                <input name="tags" value={form.tags} onChange={update} placeholder="music, lagos, nightlife"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-medium mb-2">Summary</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <p><span className="text-gray-500">Title:</span> {form.title}</p>
                  <p><span className="text-gray-500">Type:</span> {EVENT_TYPES.find(t => t.value === form.event_type)?.label}</p>
                  <p><span className="text-gray-500">Starts:</span> {form.date} {form.time}</p>
                  {form.end_date && <p><span className="text-gray-500">Ends:</span> {form.end_date} {form.end_time}</p>}
                  <p><span className="text-gray-500">Location:</span> {form.event_type === 'virtual' ? 'Online' : form.location}</p>
                  <p><span className="text-gray-500">Category:</span> {form.category}</p>
                  <p><span className="text-gray-500">Reshare:</span> {form.reshare_enabled ? '✅ Enabled (90/7.5/2.5 split)' : '❌ Off (95/5 split)'}</p>
                  <p><span className="text-gray-500">Image:</span> {imageFile ? `📎 ${imageFile.name}` : (form.image ? '🔗 URL provided' : '📷 Default')}</p>
                  <p><span className="text-gray-500">Tiers:</span> {form.tiers.map(t => `${t.name} (₦${Number(t.price).toLocaleString()})`).join(', ')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={() => handleSubmit('draft')} disabled={submitting}
                  className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  {submitting ? '...' : '💾 Save Draft'}
                </button>
                <button onClick={() => handleSubmit('published')} disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  {uploading ? '📤 Uploading image...' : submitting ? 'Publishing...' : '🎉 Publish Event'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
