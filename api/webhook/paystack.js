// Vercel Serverless Function — POST /api/webhook/paystack
// Backup verification: catches payments when browser closes or network drops.

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hibklbygzkpegxzgcatv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function verifySignature(req, secret) {
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex')
  return hash === req.headers['x-paystack-signature']
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return res.status(500).end()

  if (!verifySignature(req, secret)) {
    console.error('Webhook signature verification failed')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const { event, data } = req.body

  if (event === 'charge.success') {
    const { reference, amount, metadata } = data

    // Check if tickets already exist for this reference
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('payment_reference', reference)
      .limit(1)

    if (existing && existing.length > 0) {
      return res.status(200).json({ message: 'Already processed' })
    }

    // Create tickets from webhook metadata (browser closed, network dropped)
    if (metadata?.tickets && metadata?.event_id) {
      try {
        const inserts = metadata.tickets.map(ticket => ({
          event_id: metadata.event_id,
          event_title: metadata.event_title || '',
          tier_name: ticket.tier_name,
          quantity: ticket.quantity || 1,
          total_price: ticket.total_price || 0,
          attendance_mode: metadata.attendance_mode || 'in-person',
          user_id: metadata.user_id || null,
          guest_name: metadata.guest_name || null,
          guest_email: metadata.guest_email || data.customer?.email || null,
          attendee_name: ticket.attendee_name || metadata.guest_name || null,
          payment_reference: reference,
          payment_status: 'verified',
          payment_channel: data.channel,
          paid_amount: amount / 100,
          check_in_code: crypto.randomBytes(4).toString('hex').toUpperCase(),
          checked_in: false,
          is_rsvp: false
        }))

        const { error } = await supabase.from('tickets').insert(inserts)
        if (error) console.error('Webhook ticket creation error:', error)
        else console.log(`Webhook: Created ${inserts.length} tickets for ref ${reference}`)
      } catch (err) {
        console.error('Webhook processing error:', err)
      }
    }
  }

  return res.status(200).json({ message: 'Webhook received' })
}
