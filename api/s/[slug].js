// Looks up event by slug, serves OG meta for crawlers, redirects humans to /events/{id}
import { createClient } from '@supabase/supabase-js'

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function ensureAbsoluteUrl(url, supabaseUrl) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // Handle relative Supabase storage paths
  if (url.startsWith('/')) return `${supabaseUrl}${url}`
  return url
}

export default async function handler(req, res) {
  const { slug } = req.query

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.redirect(302, '/')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!event) {
      return res.redirect(302, '/')
    }

    const eventUrl = `/events/${event.id}`

    // Check if this is a bot/crawler
    const ua = (req.headers['user-agent'] || '').toLowerCase()
    const isCrawler = /bot|crawl|spider|facebook|twitter|whatsapp|telegram|slack|discord|linkedin|pinterest|preview/i.test(ua)

    if (!isCrawler) {
      return res.redirect(302, eventUrl)
    }

    const title = escapeHtml(event.title || 'Event on Tixo')
    const description = escapeHtml(
      event.description
        ? event.description.substring(0, 200)
        : 'Discover and book tickets on Tixo'
    )
    // Use the raw image URL — do NOT escapeHtml on URLs (breaks & in query strings)
    const rawImage = ensureAbsoluteUrl(event.image, supabaseUrl)
    const image = rawImage || 'https://tixo.online/og-default.png'
    const canonicalUrl = `https://tixo.online/${slug}`
    const date = event.date
      ? new Date(event.date + 'T00:00:00').toLocaleDateString('en', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : ''
    const location = escapeHtml(event.location || '')
    const fullDesc = escapeHtml(
      `${event.description ? event.description.substring(0, 200) : 'Discover and book tickets on Tixo'}${date ? ' | ' + date : ''}${location ? ' | ' + location : ''}`
    )

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title} | Tixo</title>
<meta name="description" content="${fullDesc}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${fullDesc}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Tixo" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${fullDesc}" />
<meta name="twitter:image" content="${image}" />
</head>
<body>
<script>window.location.href="/events/${event.id}"</script>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    return res.status(200).send(html)
  } catch (err) {
    return res.redirect(302, '/')
  }
}
