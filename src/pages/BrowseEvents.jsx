import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import EventService from '../services/EventService'
import EventCard from '../components/EventCard'

const allCategories = ['All', 'Music', 'Tech', 'Art', 'Food', 'Sports', 'Comedy', 'Festivals', 'Community']
const sortOptions = [
  { value: 'date', label: 'Date' },
  { value: 'demand', label: 'Popularity' },
  { value: 'price', label: 'Price (Low → High)' },
]

export default function BrowseEvents() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('cat') || 'All')
  const [sort, setSort] = useState('date')

  const events = useMemo(() => {
    return EventService.search({
      query,
      category: category === 'All' ? '' : category,
      sort,
    })
  }, [query, category, sort])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams(query ? { q: query } : {})
  }

  const selectStyle = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', padding: '10px 14px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Browse <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>Events</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: '0.95rem' }}>
          Discover amazing events happening across Africa
        </p>

        {/* Search + Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
          <form onSubmit={handleSearch} style={{ flex: '1 1 300px', display: 'flex', alignItems: 'stretch', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
              <Search size={16} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <input type="text" placeholder="Search events, artists, venues…" value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'white', width: '100%', fontSize: '0.9rem', padding: '12px 0' }}
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setSearchParams({}) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" style={{ background: 'var(--purple)', border: 'none', color: 'white', padding: '0 20px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
              SEARCH
            </button>
          </form>
          <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
            {sortOptions.map(o => <option key={o.value} value={o.value} style={{ background: '#120D35' }}>{o.label}</option>)}
          </select>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
          {allCategories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{
                padding: '8px 18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                border: '1px solid',
                borderColor: category === c ? 'var(--purple)' : 'rgba(255,255,255,0.1)',
                background: category === c ? 'var(--purple)' : 'rgba(255,255,255,0.04)',
                color: category === c ? 'white' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.2s',
              }}
            >{c}</button>
          ))}
        </div>

        {/* Results */}
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>No events found</p>
            <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>{events.length} event{events.length !== 1 ? 's' : ''} found</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}>
              {events.map(e => (
                <div key={e.id} onClick={() => navigate(`/events/${e.id}`)} style={{ cursor: 'pointer' }}>
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
