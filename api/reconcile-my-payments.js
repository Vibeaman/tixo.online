import { createClient } from '@supabase/supabase-js'
import { createTicketsForReference } from './_lib/createTicketsForReference.js'

function clients() {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) throw new Error('Supabase service configuration is missing')
  return {
    admin: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }),
    auth: createClient(url, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || service, { auth: { persistSession: false, autoRefreshToken: false } })
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Authentication required' })
  try {
    const { admin, auth } = clients()
    const { data: authData, error: authError } = await auth.auth.getUser(token)
    if (authError || !authData.user) return res.status(401).json({ error: 'Invalid session' })
    const user = authData.user
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const response = await fetch(`https://api.paystack.co/transaction?perPage=100&from=${encodeURIComponent(since)}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } })
    const payload = await response.json()
    if (!response.ok || !payload.status) throw new Error('Could not list Paystack transactions')
    const candidates = (payload.data || []).filter(tx => {
      const email = tx.customer?.email?.toLowerCase()
      const metadata = typeof tx.metadata === 'string' ? (() => { try { return JSON.parse(tx.metadata) } catch { return {} } })() : (tx.metadata || {})
      return tx.status === 'success' && (metadata.user_id === user.id || (!metadata.user_id && email === user.email?.toLowerCase()))
    })
    let recovered = 0
    const references = []
    for (const tx of candidates) {
      const { data: existing } = await admin.from('tickets').select('id,email_sent_at').eq('payment_reference', tx.reference).limit(100)
      if (existing?.length && existing.every(ticket => ticket.email_sent_at)) continue
      const result = await createTicketsForReference(tx.reference)
      if (result.status === 'success') { recovered += result.tickets.length; references.push(tx.reference) }
    }
    return res.status(200).json({ recovered, references })
  } catch (error) {
    console.error('Dashboard payment reconciliation failed:', error.message)
    return res.status(500).json({ error: 'Payment reconciliation temporarily unavailable' })
  }
}
