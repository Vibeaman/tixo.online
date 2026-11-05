// Vercel Serverless Function — POST /api/webhook/paystack
// Raw-body signature verification plus shared, idempotent ticket recovery.

import crypto from 'crypto'
import { createTicketsForReference } from '../_lib/createTicketsForReference.js'

export const config = { api: { bodyParser: false } }

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return res.status(500).json({ error: 'Paystack secret key not configured' })

  const rawBody = await readRawBody(req)
  if (!verifySignature(rawBody, req.headers['x-paystack-signature'], secret)) {
    console.error('Webhook signature verification failed')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let payload
  try { payload = JSON.parse(rawBody.toString('utf8')) } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  if (payload.event !== 'charge.success') return res.status(200).json({ message: 'Event ignored' })
  const reference = payload.data?.reference
  if (!reference) return res.status(400).json({ error: 'Missing payment reference' })

  try {
    const result = await createTicketsForReference(reference)
    if (result.status === 'pending') return res.status(200).json({ message: 'Payment pending' })
    if (result.status === 'failed') return res.status(200).json({ message: 'Payment not successful' })
    if (result.emailErrors?.length) {
      console.error('Webhook ticket email failure:', reference, result.emailErrors)
      // Tickets exist, so Paystack need not resend the charge event. The dashboard
      // reconciliation path will retry email_sent_at=null rows.
    }
    return res.status(200).json({ message: 'Payment reconciled', tickets: result.tickets.length })
  } catch (error) {
    console.error('Webhook reconciliation failed:', reference, error.message)
    return res.status(500).json({ error: 'Ticket reconciliation failed' })
  }
}
