import React, { useState, useRef, useEffect } from 'react'
import { Share2, X, Copy, Check, MessageCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const PLATFORMS = [
  {
    name: 'WhatsApp',
    icon: () => (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
    getUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    name: 'X (Twitter)',
    icon: () => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#ffffff',
    getUrl: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Facebook',
    icon: () => (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#1877F2',
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'Telegram',
    icon: () => (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#0088cc',
    getUrl: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
]

export default function ShareButton({ event, variant = 'icon' }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)

  const url = typeof window !== 'undefined' ? `${window.location.origin}/api/event-meta/${event?.id}` : ''
  const text = event ? `Check out "${event.title}" on Tixo! 🎫` : 'Check out this event on Tixo!'

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title || 'Tixo Event', text, url })
      } catch {}
    } else {
      setOpen(true)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2500)
  }

  function handlePlatformClick(platform) {
    window.open(platform.getUrl(url, text), '_blank', 'width=600,height=400')
    setOpen(false)
  }

  if (variant === 'button') {
    return (
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button
          onClick={handleNativeShare}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'white', padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
            fontWeight: 700, fontSize: '0.85rem', backdropFilter: 'blur(8px)',
            transition: 'all 0.2s'
          }}
        >
          <Share2 size={16} /> Share Event
        </button>
        {open && <ShareMenu platforms={PLATFORMS} onPlatformClick={handlePlatformClick} onCopy={handleCopy} copied={copied} onClose={() => setOpen(false)} />}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', color: 'white',
          width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s'
        }}
      >
        <Share2 size={18} />
      </button>
      {open && <ShareMenu platforms={PLATFORMS} onPlatformClick={handlePlatformClick} onCopy={handleCopy} copied={copied} onClose={() => setOpen(false)} />}
    </div>
  )
}

function ShareMenu({ platforms, onPlatformClick, onCopy, copied, onClose }) {
  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 8,
      background: '#12121a', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, padding: 16, width: 240, zIndex: 50,
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>Share Event</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {platforms.map(p => (
          <button
            key={p.name}
            onClick={() => onPlatformClick(p)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '12px 8px', cursor: 'pointer',
              color: p.color, transition: 'all 0.2s', fontSize: '0.7rem', fontWeight: 600
            }}
          >
            <p.icon />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.name}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onCopy}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 10, padding: '10px', cursor: 'pointer',
          color: copied ? '#4ade80' : 'rgba(255,255,255,0.7)',
          fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s'
        }}
      >
        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
      </button>
    </div>
  )
}
