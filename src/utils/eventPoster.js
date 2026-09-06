// Branded poster fallback for events without their own artwork.
//
// Historically every image-less event was saved with the same generic Unsplash
// confetti stock photo, so listings turned into a wall of identical pictures.
// We treat that URL (and any empty value) as "no artwork" and render a
// generated, on-brand poster instead — deterministic per event, so the same
// event always looks the same.

const LEGACY_DEFAULTS = [
  'photo-1492684223066-81342ee5ff30', // the old hard-coded Unsplash default
]

export function isPlaceholderImage(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return true
  return LEGACY_DEFAULTS.some(fragment => url.includes(fragment))
}

const PALETTES = [
  { from: '#3B0764', to: '#831843', accent: '#F0ABFC' },
  { from: '#1E1B4B', to: '#4C1D95', accent: '#A5B4FC' },
  { from: '#083344', to: '#155E75', accent: '#67E8F9' },
  { from: '#4A044E', to: '#701A75', accent: '#F5D0FE' },
  { from: '#431407', to: '#7C2D12', accent: '#FDBA74' },
  { from: '#052E16', to: '#14532D', accent: '#86EFAC' },
  { from: '#1E1B4B', to: '#701A75', accent: '#C4B5FD' },
  { from: '#450A0A', to: '#7F1D1D', accent: '#FCA5A5' },
]

const CATEGORY_EMOJI = {
  Music: '🎵',
  Tech: '💡',
  Art: '🎨',
  Food: '🍽️',
  Sports: '🏆',
  Comedy: '🎤',
  Festivals: '🎪',
  Community: '🤝',
  Party: '🎉',
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getPoster(event) {
  const seed = String(event?.id || event?.slug || event?.title || 'tixo')
  const palette = PALETTES[hashString(seed) % PALETTES.length]
  const emoji = CATEGORY_EMOJI[event?.category] || '🎟️'
  return {
    ...palette,
    emoji,
    background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
  }
}
