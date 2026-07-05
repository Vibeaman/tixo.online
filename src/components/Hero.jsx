import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search, Sparkles, Zap, Ticket } from 'lucide-react'
import { FloatingParticles, ScrollReveal, MagneticButton, FloatingShapes, MorphBlob, ParallaxMouse } from './Interactive3D'

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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(query ? `/events?q=${encodeURIComponent(query)}` : '/events')
  }

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Party GIF background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/party.gif)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />

      {/* Dark overlay with Tixo gradient tint */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(180deg, rgba(11,11,26,0.88) 0%, rgba(11,11,26,0.6) 40%, rgba(11,11,26,0.95) 100%)'
      }} />

      {/* Gradient accent overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(135deg, rgba(233,30,140,0.05) 0%, transparent 40%, rgba(0,191,255,0.05) 80%)',
      }} />

      {/* Mouse-following gradient spotlight */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.05), transparent 50%)`,
        pointerEvents: 'none',
      }} />

      {/* Morphing blobs */}
      <MorphBlob size={500} color="rgba(233,30,140,0.08)" style={{ position: 'absolute', top: '-10%', right: '-10%', zIndex: 1 }} />
      <MorphBlob size={350} color="rgba(0,191,255,0.06)" style={{ position: 'absolute', bottom: '5%', left: '-8%', zIndex: 1, animationDelay: '-4s' }} />

      {/* Floating shapes */}
      <FloatingShapes count={8} />

      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        <FloatingParticles count={35} color="rgba(167,139,250,0.5)" minSize={2} maxSize={6} speed={0.5} />
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 3, flex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        maxWidth: 1200, margin: '0 auto', padding: '140px 24px 40px', width: '100%', textAlign: 'center'
      }}>
        {/* Floating parallax elements */}
        <ParallaxMouse speed={0.03} style={{ position: 'absolute', top: '15%', left: '8%' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            border: '2px solid rgba(233,30,140,0.3)',
            animation: 'float 6s ease-in-out infinite, rotateSlow 20s linear infinite',
            background: 'rgba(233,30,140,0.05)',
          }} />
        </ParallaxMouse>
        <ParallaxMouse speed={-0.04} style={{ position: 'absolute', top: '25%', right: '10%' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid rgba(0,191,255,0.25)',
            animation: 'float 8s ease-in-out -2s infinite',
            background: 'rgba(0,191,255,0.08)',
          }} />
        </ParallaxMouse>
        <ParallaxMouse speed={0.02} style={{ position: 'absolute', bottom: '30%', left: '15%' }}>
          <Sparkles size={28} style={{ color: 'rgba(167,139,250,0.3)', animation: 'float 7s ease-in-out -1s infinite' }} />
        </ParallaxMouse>
        <ParallaxMouse speed={-0.025} style={{ position: 'absolute', bottom: '35%', right: '12%' }}>
          <Ticket size={24} style={{ color: 'rgba(233,30,140,0.25)', animation: 'float 5s ease-in-out -3s infinite' }} />
        </ParallaxMouse>

        <ScrollReveal direction="scale" delay={0.1} duration={1}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, rgba(233,30,140,0.15), rgba(255,255,255,0.06))',
            border: '1px solid rgba(233,30,140,0.3)',
            borderRadius: 999, padding: '6px 18px', fontSize: '0.78rem', fontWeight: 700,
            color: '#E91E8C', letterSpacing: '0.06em',
            marginBottom: 24, animation: 'tixoGlow 4s ease-in-out infinite',
          }}>
            <Sparkles size={14} /> DISCOVER · BOOK · EXPERIENCE
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.2} distance={80} duration={1}>
          <h1 style={{
            fontSize: 'clamp(2.6rem, 7vw, 5rem)', fontWeight: 900,
            lineHeight: 1.04, letterSpacing: '-0.03em'
          }}>
            Your event life,<br />
            <span className="shimmer-text" style={{
              fontStyle: 'italic',
              fontSize: 'clamp(2.8rem, 7.5vw, 5.2rem)',
            }}>reimagined.</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.4} distance={60}>
          <p style={{
            marginTop: 20, fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: 'rgba(255,255,255,0.6)', maxWidth: 560,
            marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7
          }}>
            Discover epic events. Book instantly. Create sell-outs. All on Africa's freshest event platform.
          </p>
        </ScrollReveal>

        {/* CTA buttons */}
        <ScrollReveal direction="up" delay={0.55} distance={50}>
          <div style={{
            marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12,
            alignItems: 'center', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', width: '100%'
          }}>
            <MagneticButton strength={0.25} style={{ width: '100%' }}>
              <button className="btn btn-white btn-3d" style={{ width: '100%', borderRadius: 12 }} onClick={() => navigate('/create')}>
                <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>HOST AN EVENT</span>
                <span className="btn-arrow"><ArrowRight size={16} /></span>
              </button>
            </MagneticButton>
            <MagneticButton strength={0.25} style={{ width: '100%' }}>
              <button className="btn btn-gradient btn-3d" style={{ width: '100%', borderRadius: 12 }} onClick={() => navigate('/events')}>
                <span className="btn-label" style={{ flex: 1, justifyContent: 'center' }}>EXPLORE EVENTS</span>
                <span className="btn-arrow"><ArrowRight size={16} /></span>
              </button>
            </MagneticButton>
          </div>
        </ScrollReveal>

        {/* Search */}
        <ScrollReveal direction="up" delay={0.7}>
          <form onSubmit={handleSearch} style={{
            marginTop: 32, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
            display: 'flex', alignItems: 'stretch',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 14, overflow: 'hidden',
            backdropFilter: 'blur(16px)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(233,30,140,0.4)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(233,30,140,0.1)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
              <Search size={16} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <input type="text" placeholder="Search events, artists, venues…" value={query} onChange={e => setQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'white', width: '100%', fontSize: '0.88rem', padding: '14px 0' }}
              />
            </div>
            <button type="submit" className="btn-3d" style={{
              background: 'linear-gradient(135deg, #E91E8C, #8B5CF6)', border: 'none', color: 'white', padding: '0 20px',
              fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              SEARCH <ArrowRight size={14} />
            </button>
          </form>
        </ScrollReveal>
      </div>

      {/* Stats bar */}
      <div style={{
        position: 'relative', zIndex: 3,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '28px 24px',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{
          maxWidth: 700, margin: '0 auto',
          display: 'flex', justifyContent: 'space-around', textAlign: 'center'
        }}>
          {[
            { value: 106, label: 'EVENTS', icon: '🎉' },
            { value: 19950, label: 'TICKETS', icon: '🎫' },
            { value: 5355, label: 'USERS', icon: '👥' },
          ].map((stat, i) => (
            <ScrollReveal key={i} direction="up" delay={0.1 + i * 0.15} distance={30}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 900, color: 'white',
                  textShadow: '0 0 30px rgba(233,30,140,0.2)',
                }}>
                  <AnimatedCounter target={stat.value} />
                </div>
                <div style={{
                  fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.12em', marginTop: 4
                }}>
                  {stat.icon} {stat.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
