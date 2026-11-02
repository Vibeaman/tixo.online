/**
 * PaystackService — Paystack Popup integration for Tixo.online
 *
 * Flow:
 * 1. initializePayment() opens the Paystack popup
 * 2. User pays via card / bank transfer / USSD
 * 3. On callback, verifyPayment() calls our server-side API to confirm
 * 4. Pending bank transfers are checked every 4 seconds for up to 90 seconds
 * 5. Only after server verification do we create tickets
 */

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_cc68339c362cba7e41e098cbbb2e993a145b1092'
const PAYMENT_POLL_INTERVAL_MS = 4000
const PAYMENT_POLL_TIMEOUT_MS = 90_000

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

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const PaystackService = {
  /**
   * Opens the Paystack payment popup.
   */
  async initializePayment({ email, amount, name, metadata, onSuccess, onClose, reference, subaccount }) {
    await loadPaystackScript()

    if (!window.PaystackPop) {
      throw new Error('Paystack failed to initialize')
    }

    const ref = reference || `tixo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    const config = {
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
      callback: response => {
        if (onSuccess) onSuccess(response)
      },
      onClose: () => {
        if (onClose) onClose()
      }
    }

    // Add subaccount for split payments (95% organizer / 5% Tixo)
    if (subaccount) {
      config.subaccount = subaccount
      // Tixo (main account) bears all Paystack transaction fees
      config.bearer = 'account'
    }

    const handler = window.PaystackPop.setup(config)
    handler.openIframe()
  },

  /**
   * Verifies a payment server-side via our Vercel API route.
   * Pending transfer responses are returned to the caller instead of thrown.
   */
  async verifyPayment(reference) {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    })

    const result = await response.json()

    if (result.pending) return result
    if (!response.ok || !result.verified) {
      throw new Error(result.error || 'Payment verification failed')
    }

    return result
  },

  /**
   * Full payment flow: popup → verify → poll pending transfers → return result.
   */
  pay({ email, amount, name, metadata, subaccount, onPending }) {
    return new Promise((resolve, reject) => {
      let settled = false
      let callbackStarted = false

      const fail = error => {
        if (settled) return
        settled = true
        reject(error)
      }

      const confirmPayment = async response => {
        if (settled || callbackStarted) return
        callbackStarted = true
        const reference = response?.reference

        if (!reference) {
          fail(new Error('Payment made but verification failed: Paystack returned no reference'))
          return
        }

        const deadline = Date.now() + PAYMENT_POLL_TIMEOUT_MS
        try {
          while (!settled) {
            const verification = await this.verifyPayment(reference)

            if (verification.verified) {
              settled = true
              resolve({ ...verification, reference })
              return
            }

            if (!verification.pending) {
              fail(new Error(verification.error || 'Payment verification failed'))
              return
            }

            if (onPending) onPending({ reference, status: verification.status })
            if (Date.now() >= deadline) break
            await wait(Math.min(PAYMENT_POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())))
          }

          fail(new Error(`Payment is still being confirmed. Reference: ${reference}. Your ticket will arrive by email once the transfer confirms.`))
        } catch (err) {
          if (err.message?.startsWith('Payment is still being confirmed.')) {
            fail(err)
          } else {
            fail(new Error(`Payment made but verification failed: ${err.message}. Reference: ${reference}`))
          }
        }
      }

      this.initializePayment({
        email,
        amount,
        name,
        metadata,
        subaccount,
        onSuccess: confirmPayment,
        onClose: () => {
          // Paystack can close its iframe after invoking callback. Do not turn
          // a callback that is still verifying into a false cancellation.
          if (!callbackStarted) fail(new Error('Payment cancelled'))
        }
      }).catch(fail)
    })
  }
}

export default PaystackService
