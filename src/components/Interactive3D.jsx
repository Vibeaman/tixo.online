import React, { useRef, useState, useEffect, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════
   TILT 3D — Mouse-following 3D card tilt
   Wrap any card element to add parallax tilt + glow effect
   ═══════════════════════════════════════════════════════════ */
export function Tilt3D({ children, intensity = 12, glowColor = 'rgba(123,78,247,0.15)', className = '', style = {} }) {
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
      setTransform(`perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02,1.02,1.02)`)
      setGlowPos({ x: x * 100, y: y * 100 })
    })
  }, [intensity])

  const handleLeave = useCallback(() => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)')
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
        transform: transform || 'perspective(800px) rotateX(0deg) rotateY(0deg)',
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
          background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 60%)`,
          transition: 'opacity 0.3s',
          opacity: isHovered ? 1 : 0,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL — Animate elements in on scroll
   ═══════════════════════════════════════════════════════════ */
export function ScrollReveal({ children, direction = 'up', delay = 0, duration = 0.7, distance = 40, className = '', style = {} }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el) } },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dirs = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  }
  const d = dirs[direction] || dirs.up

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0,0,0)' : `translate3d(${d.x}px,${d.y}px,0)`,
        transition: `opacity ${duration}s cubic-bezier(0.23,1,0.32,1) ${delay}s, transform ${duration}s cubic-bezier(0.23,1,0.32,1) ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   FLOATING PARTICLES — Animated background particles
   ═══════════════════════════════════════════════════════════ */
export function FloatingParticles({ count = 30, color = 'rgba(123,78,247,0.3)', minSize = 2, maxSize = 6, speed = 1 }) {
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

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: minSize + Math.random() * (maxSize - minSize),
      speedX: (Math.random() - 0.5) * speed * 0.5,
      speedY: (Math.random() - 0.5) * speed * 0.5,
      opacity: 0.2 + Math.random() * 0.5,
      pulse: Math.random() * Math.PI * 2,
    }))

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      particlesRef.current.forEach(p => {
        p.x += p.speedX
        p.y += p.speedY
        p.pulse += 0.02

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        // Mouse repulsion
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          const force = (120 - dist) / 120 * 0.8
          p.x += (dx / dist) * force
          p.y += (dy / dist) * force
        }

        const opacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = color.replace(/[\d.]+\)$/, `${opacity})`)
        ctx.fill()

        // Draw connections
        particlesRef.current.forEach(p2 => {
          if (p === p2) return
          const d = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${0.08 * (1 - d / 100)})`)
            ctx.lineWidth = 0.5
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
      style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'all',
      }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════
   MAGNETIC BUTTON — Subtle follow-mouse magnetic effect
   ═══════════════════════════════════════════════════════════ */
export function MagneticButton({ children, strength = 0.3, className = '', style = {}, ...props }) {
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
   PARALLAX LAYER — Mouse-following parallax background
   ═══════════════════════════════════════════════════════════ */
export function ParallaxContainer({ children, className = '', style = {} }) {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const scrollY = -rect.top * 0.15
      setOffset(prev => ({ ...prev, y: scrollY }))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={ref} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {React.Children.map(children, child => {
        if (child?.props?.['data-parallax-speed']) {
          const speed = parseFloat(child.props['data-parallax-speed'])
          return React.cloneElement(child, {
            style: {
              ...child.props.style,
              transform: `translate3d(0, ${offset.y * speed}px, 0)`,
              willChange: 'transform',
            }
          })
        }
        return child
      })}
    </div>
  )
}
