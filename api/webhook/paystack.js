// Vercel Serverless Function — POST /api/webhook/paystack
// Backup verification: catches payments when browser closes or network drops.

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: false }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hibklbygzkpegxzgcatv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)

  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

function verifySignature(rawBody, signature, secret) {
  if (!signature) return false
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && crypto.timingSafeEqual(received, expected)
}

function getMetadata(data) {
  if (!data?.metadata) return null
  if (typeof data.metadata === 'string') {
    try { return JSON.parse(data.metadata) } catch { return null }
  }
  return data.metadata
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return res.status(500).end()

  const rawBody = await readRawBody(req)
  if (!verifySignature(rawBody, req.headers['x-paystack-signature'], secret)) {
    console.error('Webhook signature verification failed')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let payload
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch (err) {
    console.error('Webhook JSON parsing failed:', err.message)
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { event, data } = payload

  if (event === 'charge.success') {
    const { reference, amount } = data || {}
    const metadata = getMetadata(data)

    if (!reference) return res.status(400).json({ error: 'Missing payment reference' })

    // Check if tickets already exist for this reference. This makes the
    // webhook safe when the browser verified and inserted tickets first.
    const { data: existing, error: existingError } = await supabase
      .from('tickets')
      .select('id')
      .eq('payment_reference', reference)
      .limit(1)

    if (existingError) {
      console.error('Webhook duplicate check failed:', existingError.message)
      return res.status(500).json({ error: 'Could not check existing tickets' })
    }

    if (existing && existing.length > 0) {
      return res.status(200).json({ message: 'Already processed' })
    }

    if (!metadata?.tickets || !metadata?.event_id) {
      console.error('Webhook payment metadata missing ticket payload', {
        reference,
        hasTickets: Boolean(metadata?.tickets),
        hasEventId: Boolean(metadata?.event_id)
      })
      return res.status(200).json({ message: 'Webhook received; ticket metadata unavailable' })
    }

    try {
      const inserts = metadata.tickets.map(ticket => ({
        event_id: metadata.event_id,
        event_title: metadata.event_title || '',
        tier_name: ticket.tier_name || ticket.tierName || '',
        quantity: ticket.quantity || 1,
        total_price: ticket.total_price || ticket.totalPrice || 0,
        attendance_mode: metadata.attendance_mode || 'in-person',
        user_id: metadata.user_id || null,
        guest_name: metadata.guest_name || null,
        guest_email: metadata.guest_email || data.customer?.email || null,
        attendee_name: ticket.attendee_name || ticket.attendeeName || metadata.guest_name || null,
        attendee_email: ticket.attendee_email || ticket.attendeeEmail || null,
        payment_reference: reference,
        payment_status: 'verified',
        payment_channel: data.channel || null,
        paid_amount: ticket.total_price || ticket.totalPrice || 0,
        registration_data: metadata.registration_data || null,
        referral_code: metadata.referral_code || null,
        check_in_code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        checked_in: false,
        is_rsvp: false
      }))

      const { error } = await supabase.from('tickets').insert(inserts)
      if (error) {
        // A concurrent frontend/webhook insert can win the race. Re-check the
        // reference before reporting a real failure to Paystack.
        const { data: afterInsert } = await supabase
          .from('tickets')
          .select('id')
          .eq('payment_reference', reference)
          .limit(1)
        if (!afterInsert || afterInsert.length === 0) {
          console.error('Webhook ticket creation error:', error.message)
          return res.status(500).json({ error: 'Ticket creation failed' })
        }
        return res.status(200).json({ message: 'Already processed concurrently' })
      }
      console.log(`Webhook: Created ${inserts.length} tickets for ref ${reference}`)
    } catch (err) {
      console.error('Webhook processing error:', err.message)
      return res.status(500).json({ error: 'Webhook processing failed' })
    }
  }

  return res.status(200).json({ message: 'Webhook received' })
}
