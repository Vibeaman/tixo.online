// Vercel Serverless Function — POST /api/verify-payment
// Verifies a Paystack transaction server-side before tickets are created.
// The secret key NEVER touches the frontend.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { reference } = req.body
  if (!reference) return res.status(400).json({ error: 'Missing payment reference' })

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack secret key not configured' })

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    )

    const payload = await paystackRes.json()

    if (!payload.status) {
      return res.status(400).json({ verified: false, error: 'Verification request failed' })
    }

    const { data } = payload

    if (data.status === 'success') {
      return res.status(200).json({
        verified: true,
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

    return res.status(400).json({
      verified: false,
      error: `Payment not successful. Status: ${data.status}`,
      gateway_response: data.gateway_response
    })
  } catch (err) {
    console.error('Paystack verification error:', err)
    return res.status(500).json({ verified: false, error: 'Server error during verification' })
  }
}
