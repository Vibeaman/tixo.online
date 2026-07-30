import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import EventService from '../services/EventService'
import { fadeUp, staggerParent, viewportOnce } from '../utils/animations'

function formatEventDate(date, time) {
  if (!date) return ''
  try {
    const d = new Date(`${date}T${time || '00:00'}:00`)
    let str = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (time) {
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      str += ` · ${timeStr}`
    }
    return str
  } catch {
    return date
  }
}

function getPriceLabel(event) {
  const tiers = event.ticket_tiers
  if (event.is_free || !tiers || tiers.length === 0) return { label: 'Free', free: true }
  const prices = tiers.map(t => Number(t.price) || 0)
  if (prices.every(p => p === 0)) return { label: 'Free', free: true }
  const lowest = Math.min(...prices)
  return { label: `₦${lowest.toLocaleString()}`, free: false }
}

function eventLink(event) {
  return `/events/${event.id}`
}

function EventCardSmall({ event }) {
  const price = getPriceLabel(event)
  return (
    <motion.div variants={fadeUp}>
      <Link
        to={eventLink(event)}
        className="group block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-400/40 transition-all h-full"
      >
        <div className="relative h-44 overflow-hidden">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-pink-900/30" />
          )}
          <span
            className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${
              price.free
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gradient-to-r from-pink-500/80 to-purple-500/80 text-white'
            }`}
          >
            {price.label}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-white font-bold text-base mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
            {event.title}
          </h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{formatEventDate(event.date, event.time)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{event.location || 'Online'}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
      </div>
    </div>
  )
}

function EventSection({ emoji, title, events, loading, emptyMessage }) {
  return (
    <section className="px-4 py-14 md:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <span>{emoji}</span> {title}
          </h2>
          <Link
            to="/events"
            className="text-purple-300 hover:text-purple-200 text-sm font-semibold flex items-center gap-1 transition-colors"
          >
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">{emptyMessage}</p>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {events.map(event => <EventCardSmall key={event.id} event={event} />)}
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default function HomeEvents() {
  const [newest, setNewest] = useState([])
  const [featured, setFeatured] = useState([])
  const [loadingNewest, setLoadingNewest] = useState(true)
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  useEffect(() => {
    let mounted = true

    EventService.getNewest(6)
      .then(data => { if (mounted) setNewest(data || []) })
      .catch(e => console.error('getNewest failed', e))
      .finally(() => { if (mounted) setLoadingNewest(false) })

    EventService.getFeatured()
      .then(data => { if (mounted) setFeatured(data || []) })
      .catch(e => console.error('getFeatured failed', e))
      .finally(() => { if (mounted) setLoadingFeatured(false) })

    return () => { mounted = false }
  }, [])

  const showFeatured = loadingFeatured || featured.length > 0

  return (
    <div className="bg-[#050510]">
      <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeUp}>
        <EventSection
          emoji="🆕"
          title="Newest Events"
          events={newest}
          loading={loadingNewest}
          emptyMessage="No events yet — check back soon!"
        />
      </motion.div>

      {showFeatured && (
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeUp}>
          <EventSection
            emoji="🔥"
            title="Hot & Selling"
            events={featured}
            loading={loadingFeatured}
            emptyMessage=""
          />
        </motion.div>
      )}
    </div>
  )
}
