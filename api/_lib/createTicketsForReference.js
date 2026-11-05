import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const PENDING_STATUSES = new Set(['pending', 'ongoing', 'processing'])
const REFERENCE_PATTERN = /^[A-Za-z0-9._:-]{1,120}$/

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Supabase service configuration is missing')
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

function metadataOf(data) {
  if (!data?.metadata) return {}
  if (typeof data.metadata === 'string') {
    try { return JSON.parse(data.metadata) } catch { return {} }
  }
  return data.metadata
}

function customerEmail(data) { return data?.customer?.email || null }
function customerName(data) {
  const c = data?.customer
  return c?.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : null
}

function normaliseItems(metadata) {
  return Array.isArray(metadata.tickets) ? metadata.tickets.map((item, index) => ({
    tierName: String(item.tier_name || item.tierName || '').trim(),
    quantity: Math.max(1, Number(item.quantity) || 1),
    attendeeName: item.attendee_name || item.attendeeName || metadata.guest_name || null,
    attendeeEmail: item.attendee_email || item.attendeeEmail || metadata.guest_email || null,
    index
  })) : []
}

function tierPrice(event, tierName) {
  const tiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers : []
  const tier = tiers.find(t => String(t.name || '').trim().toLowerCase() === tierName.toLowerCase())
  if (!tier) throw new Error(`Ticket tier not found: ${tierName}`)
  const now = new Date()
  const earlyEnd = tier.early_bird_end_date ? new Date(`${tier.early_bird_end_date}T23:59:59`) : null
  const early = tier.early_bird && tier.early_bird_price != null && (!earlyEnd || now <= earlyEnd)
  return Number(early ? tier.early_bird_price : tier.price) || 0
}

function assertAmount({ charged, expected, txpRedemption }) {
  if (txpRedemption) return
  const minimum = Math.max(0, expected - 1)
  const maximum = expected * 1.03 + 150
  if (charged < minimum || charged > maximum) {
    throw new Error(`Payment amount does not match the ticket total for ${expected.toFixed(2)} NGN`)
  }
}

async function verify(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('Paystack secret key is missing')
  if (!REFERENCE_PATTERN.test(reference)) throw new Error('Invalid payment reference')
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` }
  })
  const payload = await response.json()
  if (!response.ok || !payload.status || !payload.data) throw new Error('Paystack verification request failed')
  return payload.data
}

function makeRows({ event, metadata, data, reference, items, customerEmailValue }) {
  const paymentChannel = data.channel || null
  const buyerName = metadata.guest_name || customerName(data)
  const buyerEmail = metadata.guest_email || customerEmailValue
  let ticketIndex = 0
  return items.flatMap(item => {
    const unitPrice = tierPrice(event, item.tierName)
    return Array.from({ length: item.quantity }, (_, offset) => ({
      event_id: event.id,
      event_title: event.title,
      tier_name: item.tierName,
      quantity: 1,
      total_price: unitPrice,
      paid_amount: unitPrice,
      user_id: metadata.user_id || null,
      guest_name: metadata.guest_name || buyerName,
      guest_email: metadata.guest_email || buyerEmail,
      attendee_name: item.attendeeName || buyerName,
      attendee_email: item.attendeeEmail || buyerEmail,
      attendance_mode: metadata.attendance_mode || 'in-person',
      payment_reference: reference,
      payment_status: 'verified',
      payment_channel: paymentChannel,
      check_in_code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      checked_in: false,
      is_rsvp: false,
      registration_data: metadata.registration_data || {},
      referral_code: metadata.referral_code || null,
      purchased_at: data.paid_at || new Date().toISOString(),
      ticket_index: ticketIndex++
    }))
  })
}

async function sendEmail({ ticket, event, reference, buyerName, buyerEmail, data }) {
  const recipient = ticket.attendee_email || buyerEmail
  if (!recipient) throw new Error('No recipient email available')
  const response = await fetch(`${process.env.PUBLIC_SITE_URL || 'https://tixo.online'}/api/send-ticket-email`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipient,
      buyerName: ticket.attendee_name || buyerName || '',
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventType: event.event_type,
      virtualLink: event.virtual_link,
      eventImage: event.image || '',
      eventSlug: event.slug || event.id,
      tickets: [{ tierName: ticket.tier_name, quantity: 1, totalPrice: ticket.total_price, checkInCode: ticket.check_in_code, attendeeName: ticket.attendee_name }],
      totalAmount: ticket.total_price,
      paymentReference: reference,
      paymentDate: data.paid_at || ticket.purchased_at
    })
  })
  if (!response.ok) throw new Error(`Ticket email failed with HTTP ${response.status}`)
  const result = await response.json()
  if (!result.sent) throw new Error(result.reason || 'Ticket email was not sent')
}

export async function createTicketsForReference(reference) {
  if (!reference) throw new Error('Payment reference is required')
  const supabase = getSupabase()
  const data = await verify(reference)
  const status = String(data.status || '').toLowerCase()
  if (PENDING_STATUSES.has(status)) return { status: 'pending', reference }
  if (status !== 'success') return { status: 'failed', reference, gatewayResponse: data.gateway_response }

  const metadata = metadataOf(data)
  if (!metadata.event_id || !normaliseItems(metadata).length) throw new Error(`Payment ${reference} has incomplete ticket metadata`)
  const { data: event, error: eventError } = await supabase.from('events').select('id,title,date,time,location,event_type,virtual_link,image,slug,ticket_tiers').eq('id', metadata.event_id).limit(1).single()
  if (eventError || !event) throw new Error(`Event not found for payment ${reference}`)

  const items = normaliseItems(metadata)
  const expected = items.reduce((sum, item) => sum + tierPrice(event, item.tierName) * item.quantity, 0)
  assertAmount({ charged: Number(data.amount || 0) / 100, expected, txpRedemption: Boolean(metadata.txp_redemption) })

  const { data: existing, error: existingError } = await supabase.from('tickets').select('*').eq('payment_reference', reference).order('ticket_index', { ascending: true })
  if (existingError) throw existingError
  let tickets = existing || []
  if (!tickets.length) {
    const rows = makeRows({ event, metadata, data, reference, items, customerEmailValue: customerEmail(data) })
    const inserted = await supabase.from('tickets').insert(rows).select('*')
    if (inserted.error) {
      const retry = await supabase.from('tickets').select('*').eq('payment_reference', reference).order('ticket_index', { ascending: true })
      if (retry.error || !retry.data?.length) throw inserted.error
      tickets = retry.data
    } else tickets = inserted.data || []
  }

  const buyerEmail = metadata.guest_email || customerEmail(data)
  const buyerName = metadata.guest_name || customerName(data)
  const emailErrors = []
  for (const ticket of tickets) {
    if (ticket.email_sent_at) continue
    try {
      await sendEmail({ ticket, event, reference, buyerName, buyerEmail, data })
      const marked = await supabase.from('tickets').update({ email_sent_at: new Date().toISOString() }).eq('id', ticket.id).is('email_sent_at', null)
      if (marked.error) throw marked.error
      ticket.email_sent_at = new Date().toISOString()
    } catch (error) {
      emailErrors.push(error.message)
    }
  }
  return { status: 'success', reference, tickets, emailErrors }
}

export { assertAmount, normaliseItems, tierPrice }
