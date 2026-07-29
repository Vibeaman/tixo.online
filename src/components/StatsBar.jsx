import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ScrollReveal } from './Interactive3D'

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const step = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

export default function StatsBar() {
  const [stats, setStats] = useState({ events: 0, tickets: 0, users: 0 })

  useEffect(() => {
    async function fetchStats() {
      try {
        const [evRes, tkRes, usRes] = await Promise.all([
          supabase.from('events').select('id', { count: 'exact', head: true }),
          supabase.from('tickets').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])
        setStats({
          events: evRes.count || 0,
          tickets: tkRes.count || 0,
          users: usRes.count || 0,
        })
      } catch (e) { console.error('Stats fetch error:', e) }
    }
    fetchStats()
  }, [])

  const items = [
    { value: stats.events, label: 'Events', icon: '🎉' },
    { value: stats.tickets, label: 'Tickets', icon: '🎟️' },
    { value: stats.users, label: 'Users', icon: '👥' },
  ]

  return (
    <section style={{ padding: '60px 24px', background: 'transparent' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <ScrollReveal direction="up">
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 6vw, 64px)',
            flexWrap: 'wrap',
          }}>
            {items.map((item) => (
              <div key={item.label} style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 4 }}>
                  {item.icon}
                </div>
                <div style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #E91E8C, #8B5CF6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  <AnimatedCounter target={item.value} />+
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
