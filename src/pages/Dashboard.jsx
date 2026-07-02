import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Ticket, CalendarPlus, User, LogOut, ArrowRight, MapPin, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UserService from '../services/UserService'

const tabs = [
  { id: 'tickets', label: 'My Tickets', icon: Ticket },
  { id: 'events', label: 'My Events', icon: CalendarPlus },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function Dashboard() {
  const { user, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('tickets')
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' })

  if (!user) {
    navigate('/login')
    return null
  }

  const myTickets = UserService.getMyTickets()
  const myEvents = UserService.getMyEvents()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleProfileSave = (e) => {
    e.preventDefault()
    updateProfile({ name: profileForm.name })
    import('react-hot-toast').then(m => m.default.success('Profile updated!'))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>
              Hey, <span style={{ color: 'var(--purple-light)' }}>{user.name.split(' ')[0]}</span> 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: 4 }}>{user.email}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/create')} className="btn btn-purple" style={{ fontSize: '0.75rem' }}>
              <span className="btn-label" style={{ padding: '10px 16px' }}><CalendarPlus size={14} /> CREATE EVENT</span>
              <span className="btn-arrow" style={{ padding: '0 12px' }}><ArrowRight size={14} /></span>
            </button>
            <button onClick={handleLogout} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
              padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600,
            }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 32 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 20px', background: 'none', border: 'none', borderBottom: '2px solid',
              borderColor: tab === t.id ? 'var(--purple)' : 'transparent',
              color: tab === t.id ? 'white' : 'rgba(255,255,255,0.4)',
              fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* My Tickets */}
        {tab === 'tickets' && (
          <div>
            {myTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                <Ticket size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontWeight: 700, marginBottom: 8 }}>No tickets yet</p>
                <p style={{ fontSize: '0.88rem', marginBottom: 20 }}>Browse events and grab some tickets!</p>
                <button onClick={() => navigate('/events')} className="btn btn-purple">
                  <span className="btn-label">BROWSE EVENTS</span>
                  <span className="btn-arrow"><ArrowRight size={16} /></span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myTickets.map(t => (
                  <div key={t.id} onClick={() => navigate(`/events/${t.eventId}`)} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 12, transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(123,78,247,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <div>
                      <h3 style={{ fontWeight: 800, marginBottom: 4 }}>{t.eventTitle}</h3>
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
                        {t.tier} × {t.quantity} · Purchased {new Date(t.purchasedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: t.total === 0 ? '#4ade80' : 'var(--purple-light)' }}>
                        {t.total === 0 ? 'FREE' : `₦${t.total.toLocaleString()}`}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#4ade80', fontWeight: 700, marginTop: 2 }}>✓ {t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Events */}
        {tab === 'events' && (
          <div>
            {myEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                <CalendarPlus size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontWeight: 700, marginBottom: 8 }}>No events created</p>
                <p style={{ fontSize: '0.88rem', marginBottom: 20 }}>Ready to host your first event?</p>
                <button onClick={() => navigate('/create')} className="btn btn-purple">
                  <span className="btn-label">CREATE EVENT</span>
                  <span className="btn-arrow"><ArrowRight size={16} /></span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {myEvents.map(e => (
                  <div key={e.id} onClick={() => navigate(`/events/${e.id}`)} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={ev => ev.currentTarget.style.borderColor = 'rgba(123,78,247,0.3)'}
                    onMouseLeave={ev => ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <div style={{ height: 120, overflow: 'hidden' }}>
                      <img src={e.image} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: 16 }}>
                      <h3 style={{ fontWeight: 800, marginBottom: 6 }}>{e.title}</h3>
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>{e.date} · {e.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
              <input type="text" value={profileForm.name} onChange={e => setProfileForm({ name: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input type="email" value={user.email} disabled
                style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}
              />
            </div>
            <button type="submit" className="btn btn-purple" style={{ alignSelf: 'flex-start' }}>
              <span className="btn-label">SAVE CHANGES</span>
              <span className="btn-arrow"><ArrowRight size={16} /></span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
