import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EventCard from './EventCard'
import EventService from '../services/EventService'
import { ScrollReveal } from './Interactive3D'

export default function TrendingEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await EventService.getFeatured()
        setEvents(data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <section className="py-20 px-4 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <ScrollReveal direction="left">
            <div>
              <span className="text-purple-400 text-sm font-semibold tracking-wider uppercase">🔥 Trending Now</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Events everyone's talking about.</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <button onClick={() => navigate('/events')}
              className="hidden md:block bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full text-sm font-semibold border border-white/10 transition-colors">
              VIEW ALL EVENTS
            </button>
          </ScrollReveal>
        </div>
        {loading ? (
          <div className="text-center py-10"><div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((e, i) => (
              <ScrollReveal key={e.id} direction="up" delay={0.08 * i}>
                <EventCard event={e} />
              </ScrollReveal>
            ))}
          </div>
        )}
        <button onClick={() => navigate('/events')}
          className="md:hidden mt-8 w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-full text-sm font-semibold border border-white/10 transition-colors">
          VIEW ALL EVENTS
        </button>
      </div>
    </section>
  )
}
