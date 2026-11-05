import { createClient } from '@supabase/supabase-js'
import { createTicketsForReference } from './_lib/createTicketsForReference.js'

function getClients() {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) throw new Error('Supabase service configuration is missing')
  const authKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || service
  return {
    admin: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }),
    auth: createClient(url, authKey, { auth: { persistSession: false, autoRefreshToken: false } })
  }
}

function parseMetadata(metadata) {
  if (typeof metadata !== 'string') return metadata || {}
  try { return JSON.parse(metadata) } catch { return {} }
}

async function reconcileUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) throw Object.assign(new Error('Authentication required'), { statusCode: 401 })
  const { admin, auth } = getClients()
  const { data: authData, error: authError } = await auth.auth.getUser(token)
  if (authError || !authData.user) throw Object.assign(new Error('Invalid session'), { statusCode: 401 })
  const user = authData.user
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const response = await fetch(`https://api.paystack.co/transaction?perPage=100&from=${encodeURIComponent(since)}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } })
  const payload = await response.json()
  if (!response.ok || !payload.status) throw new Error('Could not list Paystack transactions')
  let recovered = 0
  const references = []
  for (const tx of payload.data || []) {
    if (tx.status !== 'success') continue
    const metadata = parseMetadata(tx.metadata)
    const matchesUser = metadata.user_id === user.id || (!metadata.user_id && tx.customer?.email?.toLowerCase() === user.email?.toLowerCase())
    if (!matchesUser) continue
    const { data: existing } = await admin.from('tickets').select('id,email_sent_at').eq('payment_reference', tx.reference).limit(100)
    if (existing?.length && existing.every(ticket => ticket.email_sent_at)) continue
    const result = await createTicketsForReference(tx.reference)
    if (result.status === 'success') { recovered += result.tickets.length; references.push(tx.reference) }
  }
  return { recovered, references }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (req.body?.reconcile) return res.status(200).json(await reconcileUser(req))
    const { reference } = req.body || {}
    if (!reference) return res.status(400).json({ error: 'Missing payment reference' })
    const result = await createTicketsForReference(reference)
    if (result.status === 'pending') return res.status(200).json({ status: 'pending', reference })
    if (result.status === 'failed') return res.status(400).json(result)
    return res.status(200).json({ status: 'success', reference, tickets: result.tickets, emailErrors: result.emailErrors })
  } catch (error) {
    console.error('Payment confirmation failed:', error.message)
    return res.status(error.statusCode || 500).json({ status: 'error', error: error.statusCode === 401 ? error.message : 'Payment confirmation is temporarily unavailable' })
  }
}
