import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Camera, Upload, X, ChevronLeft, ChevronRight, Image, Trash2, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/* ═══════════════════════════════════════════════════════════
   EVENT PHOTO GALLERY
   - Upload event photos (logged in users)
   - Masonry grid display
   - Lightbox viewer with navigation
   ═══════════════════════════════════════════════════════════ */

export default function PhotoGallery({ eventId, eventTitle }) {
  const { user, profile } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null) // index
  const [dragActive, setDragActive] = useState(false)
  const fileRef = useRef(null)

  // Load photos
  useEffect(() => {
    loadPhotos()
  }, [eventId])

  async function loadPhotos() {
    try {
      const { data, error } = await supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (e) {
      console.error('Failed to load photos:', e)
    } finally {
      setLoading(false)
    }
  }

  // Upload handler
  async function handleUpload(files) {
    if (!files || files.length === 0) return

    const maxFiles = 5
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const filesToUpload = Array.from(files).slice(0, maxFiles)

    for (const f of filesToUpload) {
      if (!allowed.includes(f.type)) {
        toast.error(`${f.name}: Only JPG, PNG, WebP, and GIF allowed`)
        return
      }
      if (f.size > maxSize) {
        toast.error(`${f.name}: Max 10MB per file`)
        return
      }
    }

    setUploading(true)
    let uploaded = 0

    try {
      for (const file of filesToUpload) {
        const ext = file.name.split('.').pop()
        const fileName = `${eventId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(fileName, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('event-photos')
          .getPublicUrl(fileName)

        // Insert record
        const { error: insertError } = await supabase
          .from('event_photos')
          .insert({
            event_id: eventId,
            user_id: user.id,
            user_name: profile?.full_name || user.email.split('@')[0],
            user_avatar: profile?.avatar_url || null,
            photo_url: urlData.publicUrl,
            storage_path: fileName,
          })

        if (insertError) throw insertError
        uploaded++
      }

      toast.success(`${uploaded} photo${uploaded > 1 ? 's' : ''} uploaded! 📸`)
      loadPhotos()
    } catch (e) {
      console.error('Upload failed:', e)
      toast.error('Upload failed: ' + (e.message || 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  // Delete photo
  async function handleDelete(photo) {
    if (!confirm('Delete this photo?')) return
    try {
      // Delete from storage
      await supabase.storage.from('event-photos').remove([photo.storage_path])
      // Delete record
      await supabase.from('event_photos').delete().eq('id', photo.id)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      if (lightbox !== null) setLightbox(null)
      toast.success('Photo deleted')
    } catch (e) {
      toast.error('Failed to delete photo')
    }
  }

  // Drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (!user) { toast.error('Please log in to upload photos'); return }
    handleUpload(e.dataTransfer.files)
  }, [user, eventId])

  // Lightbox navigation
  function prevPhoto() { setLightbox(i => (i - 1 + photos.length) % photos.length) }
  function nextPhoto() { setLightbox(i => (i + 1) % photos.length) }

  useEffect(() => {
    if (lightbox === null) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowLeft') prevPhoto()
      if (e.key === 'ArrowRight') nextPhoto()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightbox, photos.length])

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{
          fontSize: '1.4rem', fontWeight: 900, color: 'white',
          textTransform: 'uppercase', letterSpacing: '0.02em',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <Camera size={22} style={{ color: 'var(--purple-light)' }} />
          Event Photos
          {photos.length > 0 && (
            <span style={{
              fontSize: '0.78rem', fontWeight: 700, color: 'var(--purple-light)',
              background: 'rgba(123,78,247,0.15)', padding: '4px 10px', borderRadius: 999
            }}>{photos.length}</span>
          )}
        </h2>

        {user && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              background: 'var(--purple)', border: 'none', color: 'white',
              padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
              fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? <><Loader size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload Photos</>}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* Upload zone (when no photos yet or drag active) */}
      {(photos.length === 0 || dragActive) && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => user ? fileRef.current?.click() : toast.error('Please log in to upload photos')}
          style={{
            border: `2px dashed ${dragActive ? 'var(--purple)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16, padding: '48px 24px', textAlign: 'center',
            background: dragActive ? 'rgba(123,78,247,0.06)' : 'rgba(255,255,255,0.02)',
            cursor: 'pointer', transition: 'all 0.3s',
            marginBottom: photos.length > 0 ? 20 : 0,
          }}
        >
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(123,78,247,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <Image size={28} style={{ color: 'var(--purple-light)' }} />
          </div>
          <p style={{ fontWeight: 700, color: 'white', fontSize: '1rem', marginBottom: 4 }}>
            {dragActive ? 'Drop photos here!' : 'Share your event moments'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            {user ? 'Drag & drop or click to upload · JPG, PNG, WebP, GIF · Max 10MB' : 'Log in to upload photos from this event'}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block' }} />
        </div>
      )}

      {/* Photo Grid — Masonry-ish */}
      {!loading && photos.length > 0 && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 8,
          }}
        >
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              onClick={() => setLightbox(i)}
              style={{
                position: 'relative', borderRadius: 12, overflow: 'hidden',
                cursor: 'pointer', aspectRatio: i % 3 === 0 ? '1' : '4/3',
                border: '1.5px solid rgba(123,78,247,0.1)',
                transition: 'transform 0.3s, border-color 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.03)'
                e.currentTarget.style.borderColor = 'rgba(123,78,247,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.borderColor = 'rgba(123,78,247,0.1)'
              }}
            >
              <img
                src={photo.photo_url}
                alt="Event moment"
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Hover overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6))',
                opacity: 0, transition: 'opacity 0.3s',
                display: 'flex', alignItems: 'flex-end', padding: 10,
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(123,78,247,0.4)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    fontSize: '0.6rem', fontWeight: 800, color: 'white',
                  }}>
                    {photo.user_avatar
                      ? <img src={photo.user_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (photo.user_name || 'U')[0].toUpperCase()
                    }
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                    {photo.user_name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ LIGHTBOX ═══ */}
      {lightbox !== null && photos[lightbox] && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* Close */}
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 20, right: 20, zIndex: 10,
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
            width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>

          {/* Delete (if own photo) */}
          {user && photos[lightbox].user_id === user.id && (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(photos[lightbox]) }} style={{
              position: 'absolute', top: 20, right: 72, zIndex: 10,
              background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Trash2 size={16} /></button>
          )}

          {/* Nav arrows */}
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevPhoto() }} style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><ChevronLeft size={24} /></button>
              <button onClick={(e) => { e.stopPropagation(); nextPhoto() }} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><ChevronRight size={24} /></button>
            </>
          )}

          {/* Image */}
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '85vw', maxHeight: '85vh' }}>
            <img
              src={photos[lightbox].photo_url}
              alt="Event photo"
              style={{
                maxWidth: '100%', maxHeight: '80vh', borderRadius: 12,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            />
            {/* Photo info */}
            <div style={{
              marginTop: 12, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(123,78,247,0.3)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  fontSize: '0.65rem', fontWeight: 800, color: 'white'
                }}>
                  {photos[lightbox].user_avatar
                    ? <img src={photos[lightbox].user_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (photos[lightbox].user_name || 'U')[0].toUpperCase()
                  }
                </div>
                <span>{photos[lightbox].user_name}</span>
              </div>
              <span>{lightbox + 1} / {photos.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
