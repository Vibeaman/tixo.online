import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://tixo.online'
function escapeXml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
function urlEntry(path, lastmod, changefreq, priority) {
  return `<url><loc>${BASE_URL}${path}</loc>${lastmod ? `<lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>` : ''}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}
export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  const staticPages = [
    ['/', 'daily', '1.0'], ['/events', 'hourly', '0.9'], ['/about', 'monthly', '0.5'],
    ['/privacy', 'yearly', '0.3'], ['/terms', 'yearly', '0.3'], ['/create', 'monthly', '0.8'],
  ]
  let entries = staticPages.map(([path, freq, priority]) => urlEntry(path, null, freq, priority))
  if (url && key) {
    const { data: events } = await createClient(url, key).from('events').select('id, slug, updated_at, created_at').eq('status', 'published')
    for (const event of events || []) {
      const modified = event.updated_at || event.created_at
      entries.push(urlEntry(`/events/${encodeURIComponent(event.id)}`, modified, 'weekly', '0.8'))
      if (event.slug) entries.push(urlEntry(`/${encodeURIComponent(event.slug)}`, modified, 'weekly', '0.8'))
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  return res.status(200).send(xml)
}
