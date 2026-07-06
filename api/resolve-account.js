// Vercel Serverless Function — POST /api/resolve-account
// Resolves a bank account number to the account holder name via Paystack

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { account_number, bank_code } = req.body
  if (!account_number || !bank_code) {
    return res.status(400).json({ error: 'Missing account_number or bank_code' })
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack secret key not configured' })

  try {
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    )
    const payload = await response.json()

    if (!payload.status) {
      return res.status(400).json({ error: payload.message || 'Could not resolve account' })
    }

    return res.status(200).json({
      account_name: payload.data.account_name,
      account_number: payload.data.account_number,
      bank_id: payload.data.bank_id
    })
  } catch (err) {
    console.error('Resolve account error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
