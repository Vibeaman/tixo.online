import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Search, Loader2, X } from 'lucide-react'

export default function LocationAutocomplete({ value, onChange, placeholder = 'Search for a venue or address...', className = '' }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const wrapperRef = useRef(null)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  // Sync external value changes
  useEffect(() => { setQuery(value || '') }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q) => {
    if (!q || q.length < 3) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      const formatted = data.map(item => {
        const addr = item.address || {}
        const parts = []
        // Build a clean display name
        const name = addr.amenity || addr.building || addr.leisure || addr.tourism || addr.shop || ''
        if (name) parts.push(name)
        if (addr.road) parts.push(addr.road)
        if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village)
        if (addr.state) parts.push(addr.state)
        if (addr.country) parts.push(addr.country)
        return {
          id: item.place_id,
          display: parts.length > 0 ? parts.join(', ') : item.display_name,
          full: item.display_name,
          type: item.type,
          lat: item.lat,
          lon: item.lon
        }
      })
      setResults(formatted)
      setOpen(formatted.length > 0)
      setHighlighted(-1)
    } catch (err) {
      console.warn('Location search failed:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val) // Keep form state in sync as they type
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 350)
  }

  const selectResult = (result) => {
    setQuery(result.display)
    onChange(result.display)
    setOpen(false)
    setResults([])
  }

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      selectResult(results[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const clearInput = () => {
    setQuery('')
    onChange('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  const getTypeIcon = (type) => {
    return <MapPin size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={placeholder}
          className={className}
          style={{
            paddingLeft: 40,
            paddingRight: query ? 70 : 16,
          }}
        />
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading && <Loader2 size={16} style={{ color: 'rgba(255,255,255,0.4)', animation: 'spin 1s linear infinite' }} />}
          {query && !loading && (
            <button onClick={clearInput} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
              <X size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          marginTop: 4, borderRadius: 12, overflow: 'hidden',
          background: 'rgba(20, 20, 35, 0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
          maxHeight: 280, overflowY: 'auto'
        }}>
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => selectResult(r)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                width: '100%', padding: '10px 14px',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: highlighted === i ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'background 0.15s ease'
              }}
            >
              {getTypeIcon(r.type)}
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500, margin: 0, lineHeight: 1.3,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {r.display}
                </p>
              </div>
            </button>
          ))}
          <div style={{ padding: '6px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>Powered by OpenStreetMap</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
