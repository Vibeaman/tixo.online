import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Ticket, ArrowRight } from 'lucide-react'
import EventService from '../services/EventService'

export default function CategoryView() {
  const { name } = useParams()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await EventService.getByCategory(name)
        setEvents(data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [name])

  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-4xl font-bold text-white mb-2 capitalize">{name} Events</h1>
        <p className="text-gray-400 mb-10">Browse all {name.toLowerCase()} events on Tixo</p>

        {loading ? (
          <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No {name.toLowerCase()} events yet</p>
            <button onClick={() => navigate('/events')} className="text-pink-400 hover:text-pink-300">Browse all events →</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} onClick={() => navigate(`/events/${event.id}`)}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer group">
                <div className="relative h-48 overflow-hidden">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-pink-400 transition-colors">{event.title}</h3>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm"><Calendar className="w-4 h-4" />{event.date}</div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm"><MapPin className="w-4 h-4" />{event.location}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    {event.ticket_tiers?.every(t => Number(t.price) === 0)
                      ? <span className="text-green-400 font-bold">Free</span>
                      : <span className="text-pink-400 font-bold">₦{(event.ticket_tiers?.[0]?.price || 0).toLocaleString()}</span>
                    }
                    <span className="flex items-center gap-1 text-sm text-gray-400"><Ticket className="w-4 h-4" />Get Tickets <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
