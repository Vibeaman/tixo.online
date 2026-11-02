// Vercel Serverless Function — POST /api/verify-payment
// Verifies a Paystack transaction server-side before tickets are created.
// The secret key NEVER touches the frontend.

const REFERENCE_PATTERN = /^[A-Za-z0-9._:-]{1,120}$/
const PENDING_STATUSES = new Set(['pending', 'ongoing', 'processing'])

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { reference } = req.body || {}
  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ error: 'Missing payment reference' })
  }
  if (!REFERENCE_PATTERN.test(reference)) {
    return res.status(400).json({ error: 'Invalid payment reference' })
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack secret key not configured' })

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    )

    const payload = await paystackRes.json()

    if (!payload.status || !payload.data) {
      return res.status(400).json({ verified: false, error: 'Verification request failed' })
    }

    const { data } = payload
    const status = String(data.status || '').toLowerCase()

    if (status === 'success') {
      return res.status(200).json({
        verified: true,
        pending: false,
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        channel: data.channel,
        customer: {
          email: data.customer?.email,
          name: data.customer?.first_name
            ? `${data.customer.first_name} ${data.customer.last_name || ''}`.trim()
            : null
        },
        metadata: data.metadata,
        paid_at: data.paid_at
      })
    }

    if (PENDING_STATUSES.has(status)) {
      return res.status(200).json({
        verified: false,
        pending: true,
        status,
        reference: data.reference || reference,
        message: 'Payment is still being confirmed'
      })
    }

    return res.status(400).json({
      verified: false,
      pending: false,
      status,
      error: `Payment not successful. Status: ${data.status || 'unknown'}`,
      gateway_response: data.gateway_response
    })
  } catch (err) {
    console.error('Paystack verification error:', err)
    return res.status(500).json({ verified: false, error: 'Server error during verification' })
  }
}
