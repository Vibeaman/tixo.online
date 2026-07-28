// Serves dynamic OG meta tags for social-media crawlers (WhatsApp, Twitter, etc.)
// Regular users get the SPA index.html so React Router handles the page normally.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

export default async function handler(req, res) {
  const { id } = req.query

  // Check if this is a bot/crawler
  const ua = (req.headers['user-agent'] || '').toLowerCase()
  const isCrawler = /bot|crawl|spider|facebook|facebookexternalhit|twitter|twitterbot|whatsapp|telegram|telegrambot|slack|slackbot|discord|discordbot|linkedin|linkedinbot|pinterest|pinterestbot|applebot|googlebot|bingbot|preview|snapchat|viber|kakaotalk|line|embedly|quora|outbrain|flipboard|w3c|curl|wget/i.test(ua)

  if (!isCrawler) {
    // Serve the built SPA index.html — React Router will handle /events/:id client-side
    try {
      const indexPath = join(process.cwd(), 'dist', 'index.html')
      const html = readFileSync(indexPath, 'utf8')
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60')
      return res.status(200).send(html)
    } catch {
      // Fallback: redirect to root and let client-side routing handle it
      return res.redirect(302, `/?goto=events/${id}`)
    }
  }

  // --- Crawler path: fetch event data and serve OG meta ---
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return serveFallbackOG(res, id)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', id).single()

    if (!event) return serveFallbackOG(res, id)

    const title = escapeHtml(event.title || 'Event on Tixo')
    const rawDesc = event.description ? event.description.substring(0, 200) : 'Discover and book tickets on Tixo'
    const image = event.image || 'https://tixo.online/og-default.png'
    const url = `https://tixo.online/events/${id}`
    const date = event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''
    const location = event.location || ''

    const descParts = [escapeHtml(rawDesc)]
    if (date) descParts.push(date)
    if (location) descParts.push(escapeHtml(location))
    const fullDesc = descParts.join(' · ')

    return serveOG(res, { title, description: fullDesc, image, url })
  } catch {
    return serveFallbackOG(res, id)
  }
}

function serveOG(res, { title, description, image, url }) {
  const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${title} | Tixo</title>
<meta name="description" content="${description}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Tixo" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
</head><body></body></html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  return res.status(200).send(html)
}

function serveFallbackOG(res, id) {
  return serveOG(res, {
    title: 'Event on Tixo',
    description: 'Discover and book tickets on Tixo – Africa\'s premier event platform',
    image: 'https://tixo.online/og-default.png',
    url: `https://tixo.online/events/${id}`
  })
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
