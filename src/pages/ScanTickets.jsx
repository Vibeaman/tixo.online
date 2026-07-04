import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  QrCode, Camera, Search, CheckCircle2, XCircle, Users,
  ArrowLeft, Ticket, Clock, User, ScanLine, AlertCircle, Undo2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuth } from '../context/AuthContext'
import EventService from '../services/EventService'
import TicketService from '../services/TicketService'

// ─── Scan Result Card ────────────────────────────────────────────────────────

function ScanResultCard({ ticket, onCheckIn, onDismiss, checking }) {
  if (!ticket) return null

  const alreadyCheckedIn = !!ticket.checked_in_at
  const eventMismatch = ticket._mismatch

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className={`rounded-2xl border p-5 space-y-4 ${
          eventMismatch
            ? 'bg-red-500/10 border-red-500/30'
            : alreadyCheckedIn
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-green-500/10 border-green-500/30'
        }`}
      >
        {/* Status header */}
        <div className="flex items-center gap-3">
          {eventMismatch ? (
            <>
              <XCircle className="w-6 h-6 text-red-400 shrink-0" />
              <span className="text-red-400 font-semibold text-sm">Wrong Event</span>
            </>
          ) : alreadyCheckedIn ? (
            <>
              <AlertCircle className="w-6 h-6 text-yellow-400 shrink-0" />
              <span className="text-yellow-400 font-semibold text-sm">Already Checked In</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
              <span className="text-green-400 font-semibold text-sm">Valid Ticket</span>
            </>
          )}
        </div>

        {/* Ticket details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <User className="w-4 h-4 text-white/50" />
            <span className="font-medium truncate">
              {ticket.profile?.full_name || ticket.profile?.username || 'Guest'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Ticket className="w-4 h-4 text-white/40" />
            <span>{ticket.tier_name || ticket.ticket_tier?.name || 'General'}</span>
            {ticket.quantity > 1 && (
              <span className="ml-1 bg-purple-600/40 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                x{ticket.quantity}
              </span>
            )}
          </div>
          {alreadyCheckedIn && (
            <div className="flex items-center gap-2 text-yellow-400/80 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Checked in {new Date(ticket.checked_in_at).toLocaleString()}
              </span>
            </div>
          )}
          {eventMismatch && (
            <p className="text-red-400/80 text-xs mt-1">
              This ticket belongs to a different event.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!eventMismatch && !alreadyCheckedIn && (
            <button
              onClick={onCheckIn}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {checking ? 'Checking in…' : 'Check In'}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white/70 py-2.5 px-4 rounded-xl transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Check‑In Confirmed Overlay ──────────────────────────────────────────────

function CheckedInOverlay({ ticket, onContinue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#12121a] border border-green-500/30 rounded-3xl p-8 mx-4 max-w-sm w-full text-center space-y-5 animate-in zoom-in-95 duration-300">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Checked In!</h3>
          <p className="text-white/60 mt-1 text-sm">
            {ticket?.profile?.full_name || 'Guest'} is good to go
          </p>
        </div>
        <button
          onClick={onContinue}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Scan Next
        </button>
      </div>
    </div>
  )
}

// ─── Attendee List View ──────────────────────────────────────────────────────

function AttendeeList({ eventId, userId, onBack }) {
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [checkingId, setCheckingId] = useState(null)

  const fetchAttendees = useCallback(async () => {
    try {
      setLoading(true)
      const data = await TicketService.getEventAttendees(eventId)
      setAttendees(data || [])
    } catch (err) {
      toast.error('Failed to load attendees')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchAttendees()
  }, [fetchAttendees])

  const filtered = attendees.filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = (a.profile?.full_name || a.profile?.username || '').toLowerCase()
    const tier = (a.tier_name || a.ticket_tier?.name || '').toLowerCase()
    const code = (a.check_in_code || '').toLowerCase()
    return name.includes(q) || tier.includes(q) || code.includes(q)
  })

  const checkedInCount = attendees.filter((a) => a.checked_in_at).length

  const handleCheckIn = async (ticket) => {
    try {
      setCheckingId(ticket.id)
      await TicketService.checkIn(ticket.id, userId)
      toast.success(`${ticket.profile?.full_name || 'Guest'} checked in`)
      fetchAttendees()
    } catch (err) {
      toast.error('Check-in failed')
    } finally {
      setCheckingId(null)
    }
  }

  const handleUndoCheckIn = async (ticket) => {
    try {
      setCheckingId(ticket.id)
      await TicketService.undoCheckIn(ticket.id)
      toast.success('Check-in undone')
      fetchAttendees()
    } catch (err) {
      toast.error('Undo failed')
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold truncate">Attendees</h2>
            <p className="text-xs text-white/50">
              {checkedInCount}/{attendees.length} checked in
            </p>
          </div>
          <div className="bg-purple-600/20 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full">
            {attendees.length}
          </div>
        </div>

        {/* Search */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by name, tier, or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-lg mx-auto px-4 pt-3">
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${attendees.length ? (checkedInCount / attendees.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* List */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{search ? 'No matching attendees' : 'No attendees yet'}</p>
          </div>
        ) : (
          filtered.map((ticket) => {
            const name = ticket.profile?.full_name || ticket.profile?.username || 'Guest'
            const tier = ticket.tier_name || ticket.ticket_tier?.name || 'General'
            const isCheckedIn = !!ticket.checked_in_at
            const isBusy = checkingId === ticket.id

            return (
              <div
                key={ticket.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isCheckedIn
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isCheckedIn ? 'bg-green-500/20' : 'bg-white/10'
                  }`}
                >
                  {isCheckedIn ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <User className="w-4 h-4 text-white/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-white/40 truncate">
                    {tier}
                    {ticket.quantity > 1 && ` · x${ticket.quantity}`}
                  </p>
                </div>

                {isCheckedIn ? (
                  <button
                    onClick={() => handleUndoCheckIn(ticket)}
                    disabled={isBusy}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/30 hover:text-yellow-400 transition-colors disabled:opacity-50"
                    title="Undo check-in"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckIn(ticket)}
                    disabled={isBusy}
                    className="text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {isBusy ? '…' : 'Check In'}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Main ScanTickets Component ──────────────────────────────────────────────

export default function ScanTickets() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // View state
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showAttendees, setShowAttendees] = useState(false)

  // Events
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)

  // Scanner
  const [cameraActive, setCameraActive] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const scannerRef = useRef(null)
  const scannerContainerId = 'qr-reader'

  // Scan result
  const [scannedTicket, setScannedTicket] = useState(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [showConfirmed, setShowConfirmed] = useState(false)
  const confirmedTicketRef = useRef(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  // Load organizer events
  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        setEventsLoading(true)
        const data = await EventService.getByOrganizer(user.id)
        setEvents(data || [])
      } catch (err) {
        toast.error('Failed to load events')
      } finally {
        setEventsLoading(false)
      }
    }
    load()
  }, [user])

  // Start / stop QR scanner
  useEffect(() => {
    if (!cameraActive || !selectedEvent) return

    let scanner = null
    let stopped = false

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode(scannerContainerId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleCodeScanned(decodedText)
          },
          () => {
            // ignore scan failure (no QR in frame)
          }
        )
      } catch (err) {
        if (!stopped) {
          console.error('Scanner start failed', err)
          toast.error('Could not access camera')
          setCameraActive(false)
        }
      }
    }

    startScanner()

    return () => {
      stopped = true
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {})
      }
      scannerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, selectedEvent])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCodeScanned = async (code) => {
    if (scanLoading || scannedTicket) return

    // Pause scanner to prevent rapid duplicates
    if (scannerRef.current && scannerRef.current.isScanning) {
      try { await scannerRef.current.pause(true) } catch {}
    }

    try {
      setScanLoading(true)
      const ticket = await TicketService.getByCheckInCode(code)

      if (!ticket) {
        toast.error('Ticket not found')
        resumeScanner()
        setScanLoading(false)
        return
      }

      // Check event match
      const ticketEventId = ticket.event_id || ticket.event?.id
      if (ticketEventId !== selectedEvent.id) {
        ticket._mismatch = true
      }

      setScannedTicket(ticket)
    } catch (err) {
      toast.error('Invalid code or ticket not found')
      resumeScanner()
    } finally {
      setScanLoading(false)
    }
  }

  const resumeScanner = () => {
    if (scannerRef.current) {
      try { scannerRef.current.resume() } catch {}
    }
  }

  const handleCheckIn = async () => {
    if (!scannedTicket || !user) return
    try {
      setCheckingIn(true)
      await TicketService.checkIn(scannedTicket.id, user.id)
      confirmedTicketRef.current = scannedTicket
      setScannedTicket(null)
      setShowConfirmed(true)
      toast.success('Checked in successfully!')
    } catch (err) {
      toast.error('Check-in failed')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleDismissResult = () => {
    setScannedTicket(null)
    resumeScanner()
  }

  const handleContinueScanning = () => {
    setShowConfirmed(false)
    confirmedTicketRef.current = null
    resumeScanner()
  }

  const handleManualLookup = (e) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleCodeScanned(manualCode.trim())
    setManualCode('')
  }

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    setCameraActive(true)
  }

  const handleBackToEvents = () => {
    setCameraActive(false)
    setSelectedEvent(null)
    setScannedTicket(null)
    setShowConfirmed(false)
  }

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!user) return null

  // ── Attendee List View ─────────────────────────────────────────────────────

  if (showAttendees && selectedEvent) {
    return (
      <AttendeeList
        eventId={selectedEvent.id}
        userId={user.id}
        onBack={() => setShowAttendees(false)}
      />
    )
  }

  // ── Event Selection View ───────────────────────────────────────────────────

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Scan Tickets</h1>
              <p className="text-xs text-white/50">Select an event to begin</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
          {eventsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-white/40">
              <QrCode className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No events found</p>
              <p className="text-sm mt-1">Create an event first to start scanning tickets.</p>
            </div>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 rounded-2xl p-4 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {event.banner_url || event.image_url ? (
                    <img
                      src={event.banner_url || event.image_url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0">
                      <Ticket className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                      {event.title || event.name}
                    </h3>
                    <p className="text-sm text-white/50 mt-0.5">
                      {event.date
                        ? new Date(event.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Date TBD'}
                    </p>
                    {event.venue && (
                      <p className="text-xs text-white/30 mt-0.5 truncate">{event.venue}</p>
                    )}
                  </div>
                  <QrCode className="w-5 h-5 text-white/20 group-hover:text-purple-400 transition-colors shrink-0 mt-1" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // ── Scanner View ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Confirmed overlay */}
      {showConfirmed && (
        <CheckedInOverlay
          ticket={confirmedTicketRef.current}
          onContinue={handleContinueScanning}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={handleBackToEvents} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold truncate text-sm">
              {selectedEvent.title || selectedEvent.name}
            </h2>
            <p className="text-xs text-white/50">Scanning tickets</p>
          </div>
          <button
            onClick={() => setShowAttendees(true)}
            className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-purple-400 transition-colors relative"
            title="View attendees"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scanner area */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4 overflow-y-auto">
        {/* Camera toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setCameraActive(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              cameraActive
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => setCameraActive(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              !cameraActive
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Manual
          </button>
        </div>

        {/* Camera view */}
        {cameraActive ? (
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square">
            <div id={scannerContainerId} className="w-full h-full" />
            {/* Overlay scan line animation */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[250px] h-[250px] relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500 rounded-br-lg" />
                {/* Animated scan line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"
                  style={{ top: '50%' }}
                />
              </div>
            </div>
            {scanLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          /* Manual entry */
          <form onSubmit={handleManualLookup} className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="text-center">
                <ScanLine className="w-10 h-10 mx-auto text-purple-400 mb-2" />
                <h3 className="font-semibold text-white">Enter Check-In Code</h3>
                <p className="text-sm text-white/40 mt-1">
                  Type or paste the code from the ticket
                </p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. ABC123XYZ"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim() || scanLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {scanLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Look Up Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Scan result */}
        {scannedTicket && (
          <ScanResultCard
            ticket={scannedTicket}
            onCheckIn={handleCheckIn}
            onDismiss={handleDismissResult}
            checking={checkingIn}
          />
        )}
      </div>
    </div>
  )
}
