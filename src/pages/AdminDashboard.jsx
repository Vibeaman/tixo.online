import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, BarChart3, Calendar, Ticket, Users, DollarSign, Search,
  Menu, X, ArrowLeft, CheckCircle2, Clock, Loader2, Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminService from '../services/AdminService'

const ADMIN_PASSCODE = 'peak'
const ADMIN_SESSION_KEY = 'tixo_admin_unlocked'

function PasscodeGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (code.trim().toLowerCase() === ADMIN_PASSCODE) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
      onUnlock()
    } else {
      setError('Incorrect passcode')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510] px-4">
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-pink-400" />
          </div>
        </div>
        <h1 className="text-white font-bold text-lg text-center mb-1">Admin Access</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Enter the passcode to continue</p>
        <input
          type="password"
          maxLength={4}
          value={code}
          onChange={e => { setCode(e.target.value); setError('') }}
          placeholder="Passcode"
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-center tracking-widest focus:outline-none focus:border-pink-500/50 mb-3"
        />
        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
        <button
          type="submit"
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 rounded-lg transition-colors"
        >
          Unlock
        </button>
      </form>
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
]

function naira(n) {
  return `₦${(Number(n) || 0).toLocaleString()}`
}

function StatCard({ icon: Icon, label, value, color = 'text-pink-400', sub }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-gray-500 text-xs">{label}</span>
      </div>
      <p className="text-white font-bold text-xl">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function BarChartRow({ data, labelKey, valueKey, color = 'bg-pink-500', formatValue }) {
  if (!data || data.length === 0) return <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
  const maxVal = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0
        const pct = (val / maxVal) * 100
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-28 truncate flex-shrink-0">{d[labelKey]}</span>
            <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
              <div
                className={`${color} h-full rounded-full flex items-center justify-end pr-2 transition-all`}
                style={{ width: `${Math.max(pct, 8)}%` }}
              >
                <span className="text-white text-[10px] font-bold">
                  {formatValue ? formatValue(val) : val.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PaymentStatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  let cls = 'bg-gray-500/20 text-gray-400'
  if (s === 'paid' || s === 'verified') cls = 'bg-green-500/20 text-green-400'
  else if (s === 'pending') cls = 'bg-yellow-500/20 text-yellow-400'
  else if (s === 'free') cls = 'bg-blue-500/20 text-blue-400'
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cls}`}>{status || 'unknown'}</span>
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
      />
    </div>
  )
}

function last30DaysRevenue(tickets) {
  const days = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const map = Object.fromEntries(days.map(d => [d, 0]))
  for (const t of tickets) {
    const ts = t.purchased_at || t.created_at
    if (!ts) continue
    const day = ts.slice(0, 10)
    if (day in map) map[day] += Number(t.paid_amount) || 0
  }
  return days.map(d => ({ day: d.slice(5), value: map[d] }))
}

function eventStats(events, tickets) {
  const byEvent = {}
  for (const t of tickets) {
    const key = t.event_id || t.event_title || 'unknown'
    if (!byEvent[key]) byEvent[key] = { ticketsSold: 0, revenue: 0 }
    byEvent[key].ticketsSold += Number(t.quantity) || 1
    byEvent[key].revenue += Number(t.paid_amount) || 0
  }
  return events.map(e => {
    const key = e.id || e.title
    const s = byEvent[key] || byEvent[e.title] || { ticketsSold: 0, revenue: 0 }
    return { ...e, ticketsSold: s.ticketsSold, revenue: s.revenue }
  })
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [eventSearch, setEventSearch] = useState('')
  const [ticketSearch, setTicketSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    AdminService.getStats()
      .then(setStats)
      .catch(err => toast.error(err.message || 'Failed to load admin data'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  const eventsWithStats = useMemo(() => {
    if (!stats) return []
    return eventStats(stats.events, stats.tickets)
  }, [stats])

  const topEvents = useMemo(() => {
    return [...eventsWithStats].sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }, [eventsWithStats])

  const revenueTrend = useMemo(() => {
    if (!stats) return []
    return last30DaysRevenue(stats.tickets)
  }, [stats])

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase()
    if (!q) return eventsWithStats
    return eventsWithStats.filter(e =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.organizer_name || '').toLowerCase().includes(q)
    )
  }, [eventsWithStats, eventSearch])

  const filteredTickets = useMemo(() => {
    const q = ticketSearch.trim().toLowerCase()
    if (!stats) return []
    if (!q) return stats.tickets
    return stats.tickets.filter(t =>
      (t.id || '').toLowerCase().includes(q) ||
      (t.event_title || '').toLowerCase().includes(q) ||
      (t.attendee_name || t.guest_name || '').toLowerCase().includes(q)
    )
  }, [stats, ticketSearch])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!stats) return []
    if (!q) return stats.users
    return stats.users.filter(u =>
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  }, [stats, userSearch])

  if (!isAdmin) {
    return <PasscodeGate onUnlock={() => setIsAdmin(true)} />
  }

  return (
    <div className="min-h-screen bg-[#050510] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white/5 border-r border-white/10 z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-pink-500" />
            <span className="text-white font-extrabold tracking-wide text-sm">TIXO ADMIN</span>
          </div>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm px-3 py-2">
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#050510]/90 backdrop-blur border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-white font-bold text-lg capitalize">{activeTab}</h1>
          </div>
          {loading && <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />}
        </div>

        <div className="p-4 sm:p-6">
          {loading || !stats ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab stats={stats} topEvents={topEvents} revenueTrend={revenueTrend} />
              )}
              {activeTab === 'events' && (
                <EventsTab events={filteredEvents} search={eventSearch} setSearch={setEventSearch} />
              )}
              {activeTab === 'tickets' && (
                <TicketsTab tickets={filteredTickets} search={ticketSearch} setSearch={setTicketSearch} />
              )}
              {activeTab === 'users' && (
                <UsersTab users={filteredUsers} search={userSearch} setSearch={setUserSearch} />
              )}
              {activeTab === 'revenue' && (
                <RevenueTab stats={stats} topEvents={topEvents} revenueTrend={revenueTrend} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ stats, topEvents, revenueTrend }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={naira(stats.totalRevenue)} />
        <StatCard icon={CheckCircle2} label="Paid Revenue" value={naira(stats.paidRevenue)} color="text-green-400" />
        <StatCard icon={Ticket} label="Tickets Sold" value={stats.totalTicketsSold.toLocaleString()} color="text-blue-400" />
        <StatCard icon={Calendar} label="Total Events" value={stats.totalEvents.toLocaleString()} color="text-purple-400" />
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers.toLocaleString()} color="text-yellow-400" />
        <StatCard icon={CheckCircle2} label="Checked In" value={stats.checkedInCount.toLocaleString()} color="text-green-400" />
        <StatCard icon={Ticket} label="Paid Tickets" value={stats.paidTicketsCount.toLocaleString()} color="text-pink-400" />
        <StatCard icon={Clock} label="Free Tickets" value={stats.freeTicketsCount.toLocaleString()} color="text-gray-400" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-4">Revenue — Last 30 Days</h3>
        <MiniLineChart data={revenueTrend} formatValue={naira} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-4">Top 10 Events by Revenue</h3>
          <BarChartRow data={topEvents} labelKey="title" valueKey="revenue" formatValue={naira} />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold text-sm mb-4">Recent Tickets</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.tickets.slice(0, 20).map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{t.event_title || '—'}</p>
                  <p className="text-gray-500 truncate">{t.attendee_name || t.guest_name || 'Guest'}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-pink-400 font-bold">{naira(t.paid_amount)}</p>
                  <PaymentStatusBadge status={t.payment_status} />
                </div>
              </div>
            ))}
            {stats.tickets.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No tickets yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniLineChart({ data, formatValue = (v) => v }) {
  const [active, setActive] = useState(null)

  if (!data || data.length === 0) return <p className="text-gray-500 text-sm text-center py-8">No data yet</p>

  const max = Math.max(...data.map(d => d.value), 1)
  const width = 300
  const height = 120
  const padTop = 10
  const padBottom = 20
  const chartH = height - padTop - padBottom
  const stepX = data.length > 1 ? width / (data.length - 1) : 0

  const coords = data.map((d, i) => ({
    x: stepX * i,
    y: padTop + (chartH - (d.value / max) * chartH),
    ...d,
  }))

  const linePoints = coords.map(c => `${c.x},${c.y}`).join(' ')
  const areaPoints = `0,${height - padBottom} ${linePoints} ${width},${height - padBottom}`

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const nonZero = data.filter(d => d.value > 0)
  const avg = nonZero.length ? total / nonZero.length : 0
  const peak = data.reduce((best, d) => (d.value > best.value ? d : best), data[0])

  const gridLines = [0.25, 0.5, 0.75].map(f => padTop + chartH * f)

  const activePoint = active !== null ? coords[active] : null

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Total</p>
          <p className="text-white font-bold text-sm">{formatValue(total)}</p>
        </div>
        <div className="bg-white/5 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Avg / Active Day</p>
          <p className="text-white font-bold text-sm">{formatValue(avg)}</p>
        </div>
        <div className="bg-white/5 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500 uppercase">Peak Day</p>
          <p className="text-white font-bold text-sm">{formatValue(peak?.value || 0)}</p>
          <p className="text-[10px] text-gray-500">{peak?.day}</p>
        </div>
      </div>

      <div className="relative">
        {activePoint && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full bg-[#0d0d1a] border border-pink-500/40 rounded-lg px-2 py-1 text-[10px] whitespace-nowrap pointer-events-none"
            style={{ left: `${(activePoint.x / width) * 100}%`, top: `${(activePoint.y / height) * 100}%` }}
          >
            <p className="text-gray-400">{activePoint.day}</p>
            <p className="text-pink-400 font-bold">{formatValue(activePoint.value)}</p>
          </div>
        )}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-40 touch-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setActive(null)}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const relX = ((e.clientX - rect.left) / rect.width) * width
            const idx = stepX > 0 ? Math.round(relX / stepX) : 0
            setActive(Math.min(Math.max(idx, 0), data.length - 1))
          }}
          onTouchMove={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const touch = e.touches[0]
            const relX = ((touch.clientX - rect.left) / rect.width) * width
            const idx = stepX > 0 ? Math.round(relX / stepX) : 0
            setActive(Math.min(Math.max(idx, 0), data.length - 1))
          }}
        >
          {gridLines.map((y, i) => (
            <line key={i} x1="0" x2={width} y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#revenueFill)" stroke="none" />
          <polyline points={linePoints} fill="none" stroke="#ec4899" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={active === i ? 3 : c.value > 0 ? 1.6 : 0}
              fill={active === i ? '#fff' : '#ec4899'}
              stroke={active === i ? '#ec4899' : 'none'}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {active !== null && (
            <line x1={coords[active].x} x2={coords[active].x} y1={padTop} y2={height - padBottom} stroke="#ec4899" strokeOpacity="0.3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>{data[0]?.day}</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  )
}

function EventsTab({ events, search, setSearch }) {
  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Search by title or organizer..." />
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-500 text-xs uppercase text-left">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Organizer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Tickets Sold</th>
              <th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-white font-semibold max-w-xs truncate">{e.title}</td>
                <td className="px-4 py-3 text-gray-400">{e.organizer_name || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{e.event_date || e.date || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{e.category || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300 uppercase">
                    {e.status || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-white">{e.ticketsSold.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-pink-400 font-bold">{naira(e.revenue)}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No events found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TicketsTab({ tickets, search, setSearch }) {
  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Search by ID, event or buyer..." />
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-500 text-xs uppercase text-left">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Payment Status</th>
              <th className="px-4 py-3">Checked In</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{(t.id || '').slice(-8)}</td>
                <td className="px-4 py-3 text-white max-w-[10rem] truncate">{t.event_title || '—'}</td>
                <td className="px-4 py-3 text-gray-400">
                  {t.transfer_status === 'transferred' && t.transferred_to_name
                    ? t.transferred_to_name
                    : (t.attendee_name || t.guest_name || 'Guest')}
                  {t.transfer_status === 'transferred' && (
                    <span className="ml-1 text-[10px] text-gray-500">(transferred)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">{t.tier_name || '—'}</td>
                <td className="px-4 py-3 text-right text-white">{t.quantity || 1}</td>
                <td className="px-4 py-3 text-right text-pink-400 font-bold">{naira(t.paid_amount)}</td>
                <td className="px-4 py-3"><PaymentStatusBadge status={t.payment_status} /></td>
                <td className="px-4 py-3">
                  {t.checked_in ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-500" />
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No tickets found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UsersTab({ users, search, setSearch }) {
  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-500 text-xs uppercase text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Admin</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-white font-semibold">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{u.email || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  {u.is_admin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 uppercase">Admin</span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RevenueTab({ stats, topEvents, revenueTrend }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={naira(stats.totalRevenue)} />
        <StatCard icon={CheckCircle2} label="Paid Revenue" value={naira(stats.paidRevenue)} color="text-green-400" />
        <StatCard icon={Ticket} label="Paid Tickets" value={stats.paidTicketsCount.toLocaleString()} color="text-blue-400" />
        <StatCard icon={Clock} label="Free Tickets" value={stats.freeTicketsCount.toLocaleString()} color="text-gray-400" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-4">Revenue by Event (Top 10)</h3>
        <BarChartRow data={topEvents} labelKey="title" valueKey="revenue" formatValue={naira} />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-white font-bold text-sm mb-4">Revenue — Last 30 Days</h3>
        <MiniLineChart data={revenueTrend} formatValue={naira} />
      </div>
    </div>
  )
}
