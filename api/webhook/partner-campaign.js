// Vercel Serverless Function — POST /api/webhook/partner-campaign
// Phase 11: Partner Campaigns
//
// Lets an approved partner platform trigger a one-off TXP reward for a Tixo
// user when a campaign-defined action happens on the partner's side (e.g. a
// signup or a purchase on the partner's platform).
//
// AUTH: the partner sends the campaign's webhook_secret in the
//   `x-webhook-secret` request header (not the body -- keeps it out of any
//   request-body logging and matches the header-based auth style already
//   used for the Paystack webhook's `x-paystack-signature`).
//
// REQUEST BODY (application/json):
//   {
//     "user_identifier": "user@example.com",  // Tixo user's email OR user UUID
//     "external_reference": "partner-txn-123" // partner's own id, required for idempotency
//   }
//
// RESPONSE (200): { success: true, alreadyClaimed: boolean, awarded_txp: number }
// RESPONSE (4xx/5xx): { error: "..." }

import TxpService from '../../src/services/TxpService.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const webhookSecret = req.headers['x-webhook-secret']
  if (!webhookSecret) {
    return res.status(401).json({ error: 'Missing x-webhook-secret header' })
  }

  const { user_identifier, external_reference } = req.body || {}
  if (!user_identifier) {
    return res.status(400).json({ error: 'Missing user_identifier' })
  }

  try {
    const campaign = await TxpService.getCampaignByWebhookSecret(webhookSecret)
    if (!campaign) {
      console.error('partner-campaign webhook: invalid secret')
      return res.status(401).json({ error: 'Invalid webhook secret' })
    }

    if (!campaign.is_active) {
      return res.status(403).json({ error: 'Campaign is not active' })
    }

    const now = new Date()
    if (campaign.start_date && now < new Date(campaign.start_date)) {
      return res.status(403).json({ error: 'Campaign has not started yet' })
    }
    if (campaign.end_date && now > new Date(campaign.end_date)) {
      return res.status(403).json({ error: 'Campaign has ended' })
    }

    const user = await TxpService.findUserByIdentifier(user_identifier)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const result = await TxpService.awardPartnerCampaignClaim(campaign, user.id, external_reference || null)

    return res.status(200).json({
      success: true,
      alreadyClaimed: !!result.alreadyClaimed,
      awarded_txp: result.alreadyClaimed ? 0 : campaign.reward_amount,
    })
  } catch (err) {
    console.error('partner-campaign webhook error:', err)
    return res.status(500).json({ error: 'Server error processing campaign reward' })
  }
}
