import React, { useRef, useState, useEffect, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════
   TILT 3D — DRAMATIC mouse-following 3D card tilt
   Much more intense with shine reflection + depth shadow
   ═══════════════════════════════════════════════════════════ */
export function Tilt3D({ children, intensity = 20, glowColor = 'rgba(255,255,255,0.08)', className = '', style = {} }) {
  const ref = useRef(null)
  const [transform, setTransform] = useState('')
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const rafRef = useRef(null)

  const handleMove = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const tiltX = (0.5 - y) * intensity
    const tiltY = (x - 0.5) * intensity

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setTransform(`perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.05,1.05,1.05)`)
      setGlowPos({ x: x * 100, y: y * 100 })
    })
  }, [intensity])

  const handleLeave = useCallback(() => {
    setTransform('perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)')
    setIsHovered(false)
  }, [])

  const handleEnter = useCallback(() => setIsHovered(true), [])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        ...style,
        transform: transform || 'perspective(600px) rotateX(0deg) rotateY(0deg)',
        transition: isHovered ? 'none' : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow spotlight */}
      {isHovered && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', borderRadius: 'inherit',
          background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 55%)`,
          opacity: 1,
        }} />
      )}
      {/* Shine reflection sweep */}
      {isHovered && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', borderRadius: 'inherit',
          background: `linear-gradient(${105 + (glowPos.x - 50) * 0.5}deg, transparent 30%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 55%, transparent 70%)`,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 3 }}>{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   GLOW CARD — Animated glowing border that rotates
   ═══════════════════════════════════════════════════════════ */
export function GlowCard({ children, className = '', style = {}, glowColor1 = '#8B5CF6', glowColor2 = '#A78BFA', borderRadius = 16 }) {
  return (
    <div className={`glow-card-wrapper ${className}`} style={{ ...style, position: 'relative', borderRadius, padding: 2 }}>
      <div className="glow-card-border" style={{
        position: 'absolute', inset: -1, borderRadius: borderRadius + 1, zIndex: 0,
        background: `conic-gradient(from var(--glow-angle, 0deg), ${glowColor1}, ${glowColor2}, transparent, ${glowColor1})`,
        animation: 'glowSpin 3s linear infinite',
        opacity: 0.7,
        filter: 'blur(3px)',
      }} />
      <div style={{ position: 'relative', zIndex: 1, borderRadius, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL — DRAMATIC entrance animations
   ═══════════════════════════════════════════════════════════ */
export function ScrollReveal({ children, direction = 'up', delay = 0, duration = 0.8, distance = 60, className = '', style = {}, rotate = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el) } },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dirs = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    scale: { x: 0, y: 0 },
  }
  const d = dirs[direction] || dirs.up
  const scaleStart = direction === 'scale' ? 0.85 : 0.95

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translate3d(0,0,0) scale(1) rotate(0deg)'
          : `translate3d(${d.x}px,${d.y}px,0) scale(${scaleStart}) rotate(${rotate}deg)`,
        transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   FLOATING PARTICLES — Bigger, glowing, interactive
   ═══════════════════════════════════════════════════════════ */
export function FloatingParticles({ count = 35, color = 'rgba(255,255,255,0.15)', minSize = 2, maxSize = 7, speed = 1 }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth
      canvas.height = canvas.parentElement.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: minSize + Math.random() * (maxSize - minSize),
      speedX: (Math.random() - 0.5) * speed * 0.6,
      speedY: (Math.random() - 0.5) * speed * 0.6,
      opacity: 0.3 + Math.random() * 0.6,
      pulse: Math.random() * Math.PI * 2,
      hue: Math.random() * 40 - 20, // color variation
    }))

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      particlesRef.current.forEach((p, pi) => {
        p.x += p.speedX
        p.y += p.speedY
        p.pulse += 0.025

        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        // Mouse attraction zone then repulsion
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const force = (150 - dist) / 150 * 1.2
          p.x += (dx / dist) * force
          p.y += (dy / dist) * force
        }

        const pulsedSize = p.size * (0.7 + 0.3 * Math.sin(p.pulse))
        const opacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse))

        // Glowing particle
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulsedSize * 3)
        gradient.addColorStop(0, `rgba(167,139,250,${opacity})`)
        gradient.addColorStop(0.4, `rgba(255,255,255,${opacity * 0.3})`)
        gradient.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, pulsedSize * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, pulsedSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,180,255,${opacity})`
        ctx.fill()

        // Connections
        particlesRef.current.forEach((p2, j) => {
          if (pi >= j) return
          const d = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (d < 130) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(167,139,250,${0.15 * (1 - d / 130)})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        })
      })

      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    canvas.addEventListener('mousemove', handleMouse)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouse)
    }
  }, [count, color, minSize, maxSize, speed])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'all' }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════
   MAGNETIC BUTTON — Dramatic follow-mouse effect
   ═══════════════════════════════════════════════════════════ */
export function MagneticButton({ children, strength = 0.4, className = '', style = {}, ...props }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMove = useCallback((e) => {
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setPos({ x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength })
  }, [strength])

  const handleLeave = useCallback(() => setPos({ x: 0, y: 0 }), [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{
        ...style,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: pos.x === 0 ? 'transform 0.5s cubic-bezier(0.23,1,0.32,1)' : 'none',
        display: 'inline-flex',
      }}
      {...props}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   FLOATING 3D SHAPES — Decorative animated shapes
   ═══════════════════════════════════════════════════════════ */
export function FloatingShapes({ count = 6 }) {
  const shapes = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 30 + Math.random() * 60,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * -20,
    type: ['circle', 'square', 'triangle'][i % 3],
    opacity: 0.04 + Math.random() * 0.06,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {shapes.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            border: `2px solid rgba(255,255,255,${s.opacity * 2})`,
            borderRadius: s.type === 'circle' ? '50%' : s.type === 'square' ? '8px' : '0',
            background: `rgba(255,255,255,${s.opacity * 0.5})`,
            animation: `floatShape ${s.duration}s ease-in-out ${s.delay}s infinite`,
            clipPath: s.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PARALLAX MOUSE — Elements that follow mouse with parallax
   ═══════════════════════════════════════════════════════════ */
export function ParallaxMouse({ children, speed = 0.02, className = '', style = {} }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouse = (e) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      setOffset({
        x: (e.clientX - cx) * speed,
        y: (e.clientY - cy) * speed,
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [speed])

  return (
    <div
      className={className}
      style={{
        ...style,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: 'transform 0.3s ease-out',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   RIPPLE BUTTON — Click ripple effect
   ═══════════════════════════════════════════════════════════ */
export function RippleButton({ children, className = '', style = {}, onClick, ...props }) {
  const [ripples, setRipples] = useState([])

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800)
    onClick?.(e)
  }

  return (
    <div
      className={className}
      style={{ ...style, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripples.map(r => (
        <span
          key={r.id}
          style={{
            position: 'absolute', left: r.x, top: r.y,
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'rippleExpand 0.8s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MORPH BLOB — Animated morphing background blob
   ═══════════════════════════════════════════════════════════ */
export function MorphBlob({ size = 400, color = 'rgba(255,255,255,0.06)', style = {} }) {
  return (
    <div style={{
      ...style,
      width: size, height: size,
      borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
      background: `radial-gradient(circle, ${color}, transparent 70%)`,
      animation: 'morphBlob 8s ease-in-out infinite',
      filter: 'blur(40px)',
      pointerEvents: 'none',
    }} />
  )
}
