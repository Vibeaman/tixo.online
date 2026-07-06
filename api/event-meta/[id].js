// Returns HTML page with OG meta tags for social media crawlers
// Crawlers hit this endpoint, real users get redirected to the SPA
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const { id } = req.query
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return res.redirect(302, `/events/${id}`)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
    
    if (!event) return res.redirect(302, `/events/${id}`)
    
    const title = event.title || 'Event on Tixo'
    const description = event.description ? event.description.substring(0, 200) : 'Discover and book tickets on Tixo'
    const image = event.image || 'https://tixo.online/og-default.png'
    const url = `https://tixo.online/events/${id}`
    const date = event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''
    const location = event.location || ''
    const fullDesc = `${description}${date ? ' | ' + date : ''}${location ? ' | ' + location : ''}`
    
    // Check if this is a bot/crawler
    const ua = (req.headers['user-agent'] || '').toLowerCase()
    const isCrawler = /bot|crawl|spider|facebook|twitter|whatsapp|telegram|slack|discord|linkedin|pinterest|preview/i.test(ua)
    
    if (!isCrawler) {
      return res.redirect(302, `/events/${id}`)
    }
    
    const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${title} | Tixo</title>
<meta name="description" content="${fullDesc}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${fullDesc}" />
<meta property="og:image" content="${image}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Tixo" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${fullDesc}" />
<meta name="twitter:image" content="${image}" />
</head><body><script>window.location.href="${url}"</script></body></html>`
    
    res.setHeader('Content-Type', 'text/html')
    return res.status(200).send(html)
  } catch (err) {
    return res.redirect(302, `/events/${id}`)
  }
}
