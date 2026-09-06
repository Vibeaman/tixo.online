import React from 'react'
import { isPlaceholderImage, getPoster } from '../utils/eventPoster'

/**
 * Renders an event's artwork, or a generated on-brand poster when the event
 * has none. Fills its parent (which should be position: relative).
 */
export default function EventPoster({ event, hovered = false, rounded = 0, compact = false }) {
  const usePlaceholder = isPlaceholderImage(event?.image)

  if (!usePlaceholder) {
    return (
      <img
        src={event.image}
        alt={event.title || 'Event'}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: rounded,
          transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
          transform: hovered ? 'scale(1.12)' : 'scale(1)',
        }}
      />
    )
  }

  const poster = getPoster(event)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: rounded,
        background: poster.background,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '14px 16px' : '20px 22px',
        transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      {/* soft glow orbs so the panel isn't a flat block of colour */}
      <div style={{
        position: 'absolute', width: '70%', paddingBottom: '70%', borderRadius: '50%',
        top: '-28%', right: '-18%',
        background: `radial-gradient(circle, ${poster.accent}26 0%, transparent 70%)`,
      }} />
      <div style={{
        position: 'absolute', width: '60%', paddingBottom: '60%', borderRadius: '50%',
        bottom: '-26%', left: '-16%',
        background: `radial-gradient(circle, ${poster.accent}1f 0%, transparent 70%)`,
      }} />

      <div style={{
        fontSize: compact ? '1.6rem' : '2.1rem',
        lineHeight: 1,
        marginBottom: compact ? 8 : 12,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))',
      }}>
        {poster.emoji}
      </div>

      <div style={{
        position: 'relative',
        color: 'rgba(255,255,255,0.95)',
        fontWeight: 800,
        fontSize: compact ? '0.85rem' : '1rem',
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textShadow: '0 2px 10px rgba(0,0,0,0.4)',
      }}>
        {event?.title || 'Untitled event'}
      </div>

      {event?.category && (
        <div style={{
          position: 'relative',
          marginTop: compact ? 8 : 12,
          color: poster.accent,
          fontSize: '0.6rem',
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          border: `1px solid ${poster.accent}59`,
          borderRadius: 999,
          padding: '3px 10px',
          backdropFilter: 'blur(4px)',
        }}>
          {event.category}
        </div>
      )}
    </div>
  )
}
