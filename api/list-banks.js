// Vercel Serverless Function — GET /api/list-banks
// Returns the list of Nigerian banks from Paystack

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack secret key not configured' })

  try {
    const response = await fetch('https://api.paystack.co/bank?country=nigeria&perPage=100', {
      headers: { Authorization: `Bearer ${secretKey}` }
    })
    const payload = await response.json()

    if (!payload.status) {
      return res.status(400).json({ error: 'Failed to fetch banks' })
    }

    // Return only active banks, sorted by name
    const banks = (payload.data || [])
      .filter(b => b.active)
      .map(b => ({ name: b.name, code: b.code, slug: b.slug }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return res.status(200).json({ banks })
  } catch (err) {
    console.error('List banks error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
