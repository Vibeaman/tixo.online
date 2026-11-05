#!/usr/bin/env node
/*
  Dry run by default. Apply only after checking the references:
  node scripts/recover-payments.cjs --event-title "Gospel Groove (episode 2)"
  node scripts/recover-payments.cjs --event-title "Gospel Groove (episode 2)" --apply
*/
const args = process.argv.slice(2)
const value = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }

(async () => {
const eventTitle = value('--event-title')
const eventIdArg = value('--event-id')
const apply = args.includes('--apply')
if (!eventTitle && !eventIdArg) throw new Error('--event-title or --event-id is required')

const { createClient } = await import('@supabase/supabase-js')
const { createTicketsForReference } = await import('../api/_lib/createTicketsForReference.js')
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
const secret = process.env.PAYSTACK_SECRET_KEY
if (!supabaseUrl || !secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set VITE_SUPABASE_URL, PAYSTACK_SECRET_KEY, and SUPABASE_SERVICE_ROLE_KEY')

const eventQuery = admin.from('events').select('id,title').limit(1)
const { data: events, error: eventError } = eventIdArg ? await eventQuery.eq('id', eventIdArg) : await eventQuery.eq('title', eventTitle)
if (eventError || !events?.length) throw new Error('Exact event not found')
const event = events[0]
const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
const response = await fetch(`https://api.paystack.co/transaction?perPage=100&from=${encodeURIComponent(since)}`, { headers: { Authorization: `Bearer ${secret}` } })
const payload = await response.json()
if (!response.ok || !payload.status) throw new Error('Could not list Paystack transactions')
const candidates = []
for (const tx of payload.data || []) {
  if (tx.status !== 'success') continue
  const metadata = typeof tx.metadata === 'string' ? (() => { try { return JSON.parse(tx.metadata) } catch { return {} } })() : (tx.metadata || {})
  if (metadata.event_id !== event.id) continue
  const { data: rows } = await admin.from('tickets').select('id,email_sent_at').eq('payment_reference', tx.reference).limit(100)
  if (!rows?.length || rows.some(row => !row.email_sent_at)) candidates.push({ tx, rows: rows || [] })
}
console.log(`${apply ? 'APPLY' : 'DRY RUN'} ${event.title} (${event.id})`)
if (!candidates.length) { console.log('No missing tickets or unsent emails found.'); process.exit(0) }
let created = 0; let emailsFailed = 0
for (const { tx, rows } of candidates) {
  if (!apply) { console.log(`${tx.reference} | ${tx.customer?.email || 'no email'} | existing rows: ${rows.length}`); continue }
  try {
    const result = await createTicketsForReference(tx.reference)
    created += result.tickets.length
    emailsFailed += result.emailErrors?.length || 0
    console.log(`${tx.reference} | tickets: ${result.tickets.length} | email: ${result.emailErrors?.length ? 'failed' : 'sent'} | buyer: ${tx.customer?.email || 'unknown'}`)
  } catch (error) {
    console.error(`${tx.reference} | failed: ${error.message}`)
  }
}
console.log(`Totals: candidates=${candidates.length}, tickets=${created}, email failures=${emailsFailed}`)
})().catch(error => { console.error(error.message); process.exit(1) })
