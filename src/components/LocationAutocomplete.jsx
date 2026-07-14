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
      // Photon: Elasticsearch-powered OSM geocoder with better fuzzy matching
      // Biased to Nigeria center (lat=9.08, lon=7.49) for better local results
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lat=9.08&lon=7.49&lang=en`
      const res = await fetch(photonUrl)
      const data = await res.json()

      const formatted = (data.features || []).map((feature, idx) => {
        const props = feature.properties || {}
        const coords = feature.geometry?.coordinates || []
        const parts = []

        // Build clean display name
        const name = props.name || ''
        if (name) parts.push(name)
        if (props.street) parts.push(props.street)
        if (props.city || props.town || props.village) parts.push(props.city || props.town || props.village)
        if (props.state) parts.push(props.state)
        if (props.country) parts.push(props.country)

        return {
          id: `${props.osm_id || idx}-${props.osm_type || 'node'}`,
          display: parts.length > 0 ? [...new Set(parts)].join(', ') : (props.name || q),
          full: parts.join(', '),
          type: props.osm_value || props.type || 'place',
          lat: coords[1],
          lon: coords[0],
          category: props.osm_key || ''
        }
      })

      // Deduplicate by display name
      const seen = new Set()
      const unique = formatted.filter(r => {
        const key = r.display.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setResults(unique)
      setOpen(unique.length > 0)
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
    onChange(val)
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

  const getCategoryIcon = (category) => {
    if (['leisure', 'tourism', 'amenity'].includes(category)) {
      return <MapPin size={14} style={{ color: '#a855f7', flexShrink: 0 }} />
    }
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
          background: 'rgba(20,20,30,0.98)', border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          {results.map((result, i) => (
            <button
              key={result.id}
              onClick={() => selectResult(result)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10,
                background: highlighted === i ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
              }}
            >
              <div style={{ marginTop: 2 }}>{getCategoryIcon(result.category)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {result.display.split(',')[0]}
                </div>
                {result.display.includes(',') && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {result.display.split(',').slice(1).join(',').trim()}
                  </div>
                )}
              </div>
            </button>
          ))}
          <div style={{ padding: '6px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Powered by Photon / OpenStreetMap</span>
          </div>
        </div>
      )}
    </div>
  )
}
