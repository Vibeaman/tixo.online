import React, { useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { motion, AnimatePresence } from 'framer-motion'
import TxpService from '../services/TxpService'

/* ── helpers ─────────────────────────────────────────────── */
const rand = (min, max) => Math.random() * (max - min) + min
const randInt = (min, max) => Math.floor(rand(min, max))

/* ── sub-components ──────────────────────────────────────── */

function CoinParticle({ index }) {
  const angle = rand(0, Math.PI * 2)
  const dist = rand(120, 300)
  const x = Math.cos(angle) * dist
  const y = Math.sin(angle) * rand(150, 400) * -1 + rand(-50, 100)
  const rotate = randInt(-360, 360)
  const delay = rand(0, 0.15)
  const size = rand(22, 36)

  return (
    <motion.span
      className="absolute text-center select-none"
      style={{ fontSize: size, left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0.3, rotate: 0 }}
      animate={{ x, y, opacity: 0, scale: rand(0.6, 1.2), rotate }}
      transition={{ duration: rand(1.6, 2.2), delay, ease: 'easeOut' }}
    >
      🪙
    </motion.span>
  )
}

function SparkleParticle({ index }) {
  const x = rand(-180, 180)
  const y = rand(-200, 80)
  const delay = rand(0, 0.5)
  const size = rand(18, 30)

  return (
    <motion.span
      className="absolute select-none"
      style={{ fontSize: size, left: '50%', top: '45%' }}
      initial={{ x, y, opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 0.8, 0] }}
      transition={{ duration: rand(1.2, 2), delay, ease: 'easeInOut' }}
    >
      ✨
    </motion.span>
  )
}

function CenterBadge({ amount, reason }) {
  const label = TxpService.reasonLabel(reason)

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.1, 1], opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, duration: 0.6 }}
    >
      <motion.div
        className="flex flex-col items-center gap-1"
        animate={{ opacity: [1, 1, 1, 0], scale: [1, 1, 1, 0.7] }}
        transition={{ duration: 2.5, times: [0, 0.3, 0.7, 1], ease: 'easeInOut' }}
      >
        {/* glow */}
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-purple-500/20 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
        />

        <p className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg leading-tight relative z-10">
          +{Number(amount || 0).toLocaleString()} TXP
        </p>
        <p className="text-gray-300 text-sm font-medium tracking-wide relative z-10">
          {label}
        </p>
      </motion.div>
    </motion.div>
  )
}

/* ── main overlay ────────────────────────────────────────── */

function TxpCelebrationOverlay({ amount, reason, onDone }) {
  const coins = useMemo(() => Array.from({ length: 18 }, (_, i) => i), [])
  const sparkles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])

  useEffect(() => {
    const timer = setTimeout(onDone, 2600)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {coins.map((i) => (
        <CoinParticle key={`c${i}`} index={i} />
      ))}
      {sparkles.map((i) => (
        <SparkleParticle key={`s${i}`} index={i} />
      ))}
      <CenterBadge amount={amount} reason={reason} />
    </div>
  )
}

/* ── imperative trigger ──────────────────────────────────── */

export function triggerTxpCelebration(amount, reason) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)

  const cleanup = () => {
    root.unmount()
    container.remove()
  }

  root.render(<TxpCelebrationOverlay amount={amount} reason={reason} onDone={cleanup} />)
}

export default TxpCelebrationOverlay
