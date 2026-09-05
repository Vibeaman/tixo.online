import React, { useEffect, useState } from 'react'
import { Megaphone, AlertTriangle, AlertOctagon, CheckCircle2, X } from 'lucide-react'
import AnnouncementService from '../services/AnnouncementService'

const LEVEL_STYLES = {
  info: { bg: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500', Icon: Megaphone },
  success: { bg: 'bg-gradient-to-r from-green-500 to-emerald-500', Icon: CheckCircle2 },
  warning: { bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', Icon: AlertTriangle },
  critical: { bg: 'bg-gradient-to-r from-red-500 to-rose-600', Icon: AlertOctagon },
}

const DISMISS_KEY_PREFIX = 'tixo_announcement_dismissed_'

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    AnnouncementService.getActive()
      .then(data => {
        if (cancelled || !data) return
        setAnnouncement(data)
        setDismissed(sessionStorage.getItem(DISMISS_KEY_PREFIX + data.id) === '1')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!announcement || dismissed) return null

  const { bg, Icon } = LEVEL_STYLES[announcement.level] || LEVEL_STYLES.info

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY_PREFIX + announcement.id, '1')
    setDismissed(true)
  }

  const content = (
    <span className="inline-flex items-center gap-2 px-4">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-semibold whitespace-nowrap">
        {announcement.message}
        {announcement.link_url && (
          <a
            href={announcement.link_url}
            className="underline underline-offset-2 ml-2 font-bold"
            target={announcement.link_url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
          >
            {announcement.link_label || 'Learn more'}
          </a>
        )}
      </span>
    </span>
  )

  return (
    <div className={`${bg} text-white sticky top-0 z-[60] overflow-hidden`}>
      <div className="flex items-center py-2">
        <div className="marquee-track flex flex-shrink-0 min-w-full">
          {content}
          {content}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-80 hover:opacity-100 pr-4 pl-2"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <style>{`
        @keyframes tixo-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: tixo-marquee 18s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </div>
  )
}
