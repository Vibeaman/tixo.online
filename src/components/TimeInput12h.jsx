import { useState, useEffect } from 'react'

// Converts "HH:mm" (24h) → { hour12, minute, period }
function parse24(val) {
  if (!val) return { hour12: '', minute: '', period: 'AM' }
  const [h, m] = val.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { hour12: String(hour12), minute: String(m).padStart(2, '0'), period }
}

// Converts { hour12, minute, period } → "HH:mm" (24h)
function to24(hour12, minute, period) {
  let h = parseInt(hour12, 10)
  if (isNaN(h) || minute === '') return ''
  if (period === 'AM' && h === 12) h = 0
  else if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export default function TimeInput12h({ name, value, onChange, className = '' }) {
  const parsed = parse24(value)
  const [hour, setHour] = useState(parsed.hour12)
  const [minute, setMinute] = useState(parsed.minute)
  const [period, setPeriod] = useState(parsed.period)

  // Sync if value prop changes externally
  useEffect(() => {
    const p = parse24(value)
    setHour(p.hour12)
    setMinute(p.minute)
    setPeriod(p.period)
  }, [value])

  function emit(h, m, p) {
    const val24 = to24(h, m, p)
    if (val24 && onChange) {
      onChange({ target: { name, value: val24 } })
    }
  }

  const selectClass = 'bg-white/5 border border-white/10 rounded-lg px-2 py-3 text-white focus:outline-none focus:border-white/20 appearance-none text-center'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={hour}
        onChange={e => { setHour(e.target.value); emit(e.target.value, minute, period) }}
        className={`${selectClass} w-[70px]`}
        aria-label="Hour"
      >
        <option value="" disabled>Hr</option>
        {[12,1,2,3,4,5,6,7,8,9,10,11].map(h => (
          <option key={h} value={String(h)}>{h}</option>
        ))}
      </select>

      <span className="text-white text-lg font-bold">:</span>

      <select
        value={minute}
        onChange={e => { setMinute(e.target.value); emit(hour, e.target.value, period) }}
        className={`${selectClass} w-[70px]`}
        aria-label="Minute"
      >
        <option value="" disabled>Min</option>
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        value={period}
        onChange={e => { setPeriod(e.target.value); emit(hour, minute, e.target.value) }}
        className={`${selectClass} w-[72px]`}
        aria-label="AM or PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
