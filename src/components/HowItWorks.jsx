import React from 'react'
import { ArrowRight } from 'lucide-react'

const steps = [
  { num: '01', title: 'Discover', desc: 'Browse curated events or search by city, genre, or vibe.' },
  { num: '02', title: 'Book', desc: 'Grab tickets in seconds with seamless mobile checkout.' },
  { num: '03', title: 'Experience', desc: 'Show up, scan in, and enjoy unforgettable moments.' },
  { num: '04', title: 'Earn', desc: 'Collect loyalty points and unlock exclusive perks.' },
]

export default function HowItWorks() {
  return (
    <section className="section-dark" style={{ padding: 'clamp(60px, 8vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 56 }}>
          <div>
            <span className="section-tag section-tag-white" style={{ marginBottom: 16 }}>
              ⚡ Simple & Seamless
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 12 }}>
              How it <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>works.</span>
            </h2>
          </div>
          <button className="btn btn-purple self-start md:self-auto">
            <span className="btn-label">GET STARTED</span>
            <span className="btn-arrow"><ArrowRight size={16} /></span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 32
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <span style={{
                fontSize: 'clamp(4rem, 6vw, 6rem)', fontWeight: 900,
                color: 'transparent',
                WebkitTextStroke: '1.5px rgba(123,78,247,0.2)',
                lineHeight: 1, display: 'block', marginBottom: -20, position: 'relative', zIndex: 0
              }}>{s.num}</span>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8, color: 'var(--purple-light)' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
