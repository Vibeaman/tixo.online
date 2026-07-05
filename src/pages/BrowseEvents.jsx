import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, MapPin, Calendar, Ticket, ArrowRight, Filter, X } from 'lucide-react'
import EventService from '../services/EventService'

const CATEGORIES = ['All','Music','Tech','Art','Food','Sports','Comedy','Festivals','Community','Party']
const EVENT_TYPES = ['All', 'In Person', 'Virtual', 'Hybrid']

export default function BrowseEvents() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('date')
  const [location, setLocation] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [eventType, setEventType] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const q = searchParams.get('q')
        const data = q ? await EventService.search(q) : await EventService.getAll()
        setEvents(data)
        if (q) setSearch(q)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [searchParams])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search) count++
    if (category !== 'All') count++
    if (location) count++
    if (dateFrom) count++
    if (dateTo) count++
    if (eventType !== 'All') count++
    return count
  }, [search, category, location, dateFrom, dateTo, eventType])

  const filtered = useMemo(() => {
    let list = [...events]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e => e.title.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q))
    }

    if (category !== 'All') {
      list = list.filter(e => e.category?.toLowerCase() === category.toLowerCase())
    }

    if (location) {
      const loc = location.toLowerCase()
      list = list.filter(e => e.location?.toLowerCase().includes(loc))
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      list = list.filter(e => {
        const d = new Date(e.date)
        return d >= from
      })
    }

    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      list = list.filter(e => {
        const d = new Date(e.date)
        return d <= to
      })
    }

    if (eventType !== 'All') {
      const typeVal = eventType.toLowerCase()
      list = list.filter(e => {
        const et = (e.event_type || '').toLowerCase().replace(/[-_]/g, ' ')
        return et === typeVal
      })
    }

    if (sort === 'date') list.sort((a, b) => new Date(a.date) - new Date(b.date))
    else if (sort === 'popular') list.sort((a, b) => (b.watchers || 0) - (a.watchers || 0))
    else if (sort === 'price') list.sort((a, b) => {
      const pa = a.ticket_tiers?.[0]?.price || 0
      const pb = b.ticket_tiers?.[0]?.price || 0
      return pa - pb
    })

    return list
  }, [events, search, category, sort, location, dateFrom, dateTo, eventType])

  function handleSearch(e) {
    e.preventDefault()
    navigate(`/events?q=${encodeURIComponent(search)}`)
  }

  function clearAllFilters() {
    setSearch('')
    setCategory('All')
    setLocation('')
    setDateFrom('')
    setDateTo('')
    setEventType('All')
    setSort('date')
    navigate('/events')
  }

  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Browse Events</h1>
          <p className="text-gray-400 text-lg">Discover amazing events happening across Africa</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                placeholder="Search events, venues, cities..." />
            </div>
            <button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Search</button>
          </form>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 md:hidden"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">{filtersOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {activeFilterCount > 0 && (
              <span className="bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>
            )}
          </button>

          {/* Collapsible filter section */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} md:block space-y-4`}>
            {/* Location & Date Range Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                  placeholder="Filter by location..."
                />
              </div>
              <div className="flex gap-3 flex-1">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 [color-scheme:dark]"
                    placeholder="From"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 [color-scheme:dark]"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            {/* Event Type Pills */}
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(t => (
                <button key={t} onClick={() => setEventType(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${eventType === t ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Categories & Sort Row */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none">
                  <option value="date">Sort by Date</option>
                  <option value="popular">Most Popular</option>
                  <option value="price">Lowest Price</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 border border-white/10 rounded-full mb-4">
              <Search className="w-7 h-7 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No events found</p>
            {activeFilterCount > 0 && (
              <p className="text-gray-500 text-sm mb-4">
                {activeFilterCount} {activeFilterCount === 1 ? 'filter is' : 'filters are'} currently active
              </p>
            )}
            <button onClick={clearAllFilters} className="inline-flex items-center gap-2 mt-2 bg-white/5 border border-white/10 hover:bg-white/10 text-pink-400 hover:text-pink-300 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-semibold">{filtered.length}</span> {filtered.length === 1 ? 'event' : 'events'}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-pink-400 text-sm transition-colors">
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(event => (
                <div key={event.id} onClick={() => navigate(`/events/${event.id}`)}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer group">
                  <div className="relative h-48 overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">{event.category}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-pink-400 transition-colors">{event.title}</h3>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm"><Calendar className="w-4 h-4" />{event.date}</div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm"><MapPin className="w-4 h-4" />{event.location}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pink-400 font-bold">₦{(event.ticket_tiers?.[0]?.price || 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-sm text-gray-400"><Ticket className="w-4 h-4" />Get Tickets <ArrowRight className="w-4 h-4" /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
