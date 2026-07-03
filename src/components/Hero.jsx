import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'

function AnimatedCounter({ target, suffix = '+', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let current = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

export default function Hero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(query ? `/events?q=${encodeURIComponent(query)}` : '/events')
  }

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Party GIF background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/party.gif)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      {/* Dark purple gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(180deg, rgba(18,13,53,0.82) 0%, rgba(18,13,53,0.68) 40%, rgba(18,13,53,0.92) 100%)'
      }} />

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        maxWidth: 1200, margin: '0 auto', padding: '140px 24px 40px', width: '100%', textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.6rem, 7vw, 4.8rem)', fontWeight: 900,
          lineHeight: 1.06, letterSpacing: '-0.03em'
        }}>
          Your event life,<br />
          <span style={{ color: 'var(--purple-light)', fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: 'rgba(157,122,250,0.3)', textUnderlineOffset: 6 }}>simplified.</span>
        </h1>

        <p style={{
          marginTop: 20, fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
          color: 'rgba(255,255,255,0.6)', maxWidth: 560,
          marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7
        }}>
          Discover epic events. Host sell-outs. Sell tickets &amp; merch. Reward your people. Build Tribes. All in one place.
        </p>

        {/* Two CTA buttons — rigitix style stacked */}
        <div style={{
          marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12,
          alignItems: 'center', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', width: '100%'
        }}>
          <button className="btn btn-white" style={{ width: '100%' }} onClick={() => navigate('/create')}>
            <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>PLAN AN EVENT</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
          <button className="btn btn-purple" style={{ width: '100%' }} onClick={() => navigate('/events')}>
            <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>EXPLORE EVENTS</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>

        {/* Compact search */}
        <form onSubmit={handleSearch} style={{
          marginTop: 32, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
          display: 'flex', alignItems: 'stretch',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, overflow: 'hidden'
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
            <Search size={16} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input type="text" placeholder="Search events, artists, venues…" value={query} onChange={e => setQuery(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'white', width: '100%', fontSize: '0.88rem', padding: '14px 0' }}
            />
          </div>
          <button type="submit" style={{
            background: 'var(--purple)', border: 'none', color: 'white', padding: '0 20px',
            fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            SEARCH <ArrowRight size={14} />
          </button>
        </form>
      </div>

      {/* Stats bar */}
      <div style={{
        position: 'relative', zIndex: 2,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '28px 24px',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          maxWidth: 700, margin: '0 auto',
          display: 'flex', justifyContent: 'space-around', textAlign: 'center'
        }}>
          {[
            { value: 106, label: 'EVENTS' },
            { value: 19950, label: 'TICKETS' },
            { value: 5355, label: 'USERS' },
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: 'white' }}>
                <AnimatedCounter target={stat.value} />
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
