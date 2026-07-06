// Vercel Serverless Function — POST /api/create-subaccount
// Creates a Paystack subaccount for an organizer and saves to Supabase

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hibklbygzkpegxzgcatv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, business_name, bank_code, bank_name, account_number, account_name } = req.body

  if (!user_id || !bank_code || !account_number || !business_name) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack secret key not configured' })

  try {
    // Check if user already has a subaccount
    const { data: existing } = await supabase
      .from('payout_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // If subaccount already exists on Paystack, update it
    if (existing?.subaccount_code) {
      const updateRes = await fetch(
        `https://api.paystack.co/subaccount/${existing.subaccount_code}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business_name,
            settlement_bank: bank_code,
            account_number,
            percentage_charge: 5.0 // Tixo keeps 5%
          })
        }
      )
      const updatePayload = await updateRes.json()

      if (!updatePayload.status) {
        return res.status(400).json({ error: updatePayload.message || 'Failed to update subaccount' })
      }

      // Update in Supabase
      const { error: dbError } = await supabase
        .from('payout_profiles')
        .update({
          bank_code,
          bank_name: bank_name || '',
          account_number,
          account_name: account_name || '',
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)

      if (dbError) {
        console.error('DB update error:', dbError)
        return res.status(500).json({ error: 'Subaccount updated on Paystack but failed to save locally' })
      }

      return res.status(200).json({
        subaccount_code: existing.subaccount_code,
        message: 'Payout profile updated successfully'
      })
    }

    // Create new subaccount on Paystack
    const paystackRes = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_name,
        settlement_bank: bank_code,
        account_number,
        percentage_charge: 5.0, // Tixo keeps 5%
        description: `Tixo organizer payout — ${business_name}`
      })
    })

    const payload = await paystackRes.json()

    if (!payload.status) {
      return res.status(400).json({ error: payload.message || 'Failed to create subaccount' })
    }

    const subaccountCode = payload.data.subaccount_code

    // Upsert payout profile in Supabase
    const { error: dbError } = await supabase
      .from('payout_profiles')
      .upsert({
        user_id,
        bank_code,
        bank_name: bank_name || '',
        account_number,
        account_name: account_name || '',
        subaccount_code: subaccountCode,
        is_verified: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (dbError) {
      console.error('DB insert error:', dbError)
      return res.status(500).json({ error: 'Subaccount created on Paystack but failed to save locally' })
    }

    return res.status(200).json({
      subaccount_code: subaccountCode,
      message: 'Payout profile created successfully'
    })
  } catch (err) {
    console.error('Create subaccount error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
