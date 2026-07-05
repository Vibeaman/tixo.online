/**
 * PaystackService — Paystack Popup integration for Tixo.online
 *
 * Flow:
 * 1. initializePayment() opens the Paystack popup
 * 2. User pays via card / bank transfer / USSD
 * 3. On success, verifyPayment() calls our server-side API to confirm
 * 4. Only after server verification do we create tickets
 */

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_3cd1086ee7351c0c336705230fdd0ce24da17bb4'

let scriptLoaded = false
function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (scriptLoaded || window.PaystackPop) {
      scriptLoaded = true
      return resolve()
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => { scriptLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(script)
  })
}

const PaystackService = {
  /**
   * Opens the Paystack payment popup.
   */
  async initializePayment({ email, amount, name, metadata, onSuccess, onClose, reference }) {
    await loadPaystackScript()

    if (!window.PaystackPop) {
      throw new Error('Paystack failed to initialize')
    }

    const ref = reference || `tixo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amount * 100), // Naira → kobo
      currency: 'NGN',
      ref,
      firstname: name?.split(' ')[0] || undefined,
      lastname: name?.split(' ').slice(1).join(' ') || undefined,
      metadata: {
        custom_fields: [
          { display_name: 'Platform', variable_name: 'platform', value: 'Tixo.online' },
          ...(metadata?.event_title ? [{
            display_name: 'Event', variable_name: 'event', value: metadata.event_title
          }] : [])
        ],
        ...metadata
      },
      callback: (response) => {
        if (onSuccess) onSuccess(response)
      },
      onClose: () => {
        if (onClose) onClose()
      }
    })

    handler.openIframe()
  },

  /**
   * Verifies a payment server-side via our Vercel API route.
   */
  async verifyPayment(reference) {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    })

    const result = await response.json()

    if (!response.ok || !result.verified) {
      throw new Error(result.error || 'Payment verification failed')
    }

    return result
  },

  /**
   * Full payment flow: popup → verify → return result.
   * Main method to call from checkout.
   */
  pay({ email, amount, name, metadata }) {
    return new Promise((resolve, reject) => {
      this.initializePayment({
        email,
        amount,
        name,
        metadata,
        onSuccess: async (response) => {
          try {
            const verification = await this.verifyPayment(response.reference)
            resolve({ ...verification, reference: response.reference })
          } catch (err) {
            reject(new Error(`Payment made but verification failed: ${err.message}. Reference: ${response.reference}`))
          }
        },
        onClose: () => {
          reject(new Error('Payment cancelled'))
        }
      })
    })
  }
}

export default PaystackService
