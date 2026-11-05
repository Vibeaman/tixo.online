import { createTicketsForReference } from './_lib/createTicketsForReference.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { reference } = req.body || {}
  if (!reference) return res.status(400).json({ error: 'Missing payment reference' })
  try {
    const result = await createTicketsForReference(reference)
    if (result.status === 'pending') return res.status(200).json({ status: 'pending', reference })
    if (result.status === 'failed') return res.status(400).json(result)
    return res.status(200).json({ status: 'success', reference, tickets: result.tickets, emailErrors: result.emailErrors })
  } catch (error) {
    console.error('Payment confirmation failed:', reference, error.message)
    return res.status(500).json({ status: 'error', error: 'Payment confirmation is temporarily unavailable', reference })
  }
}
