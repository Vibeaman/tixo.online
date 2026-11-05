/** Paystack popup plus server-side, retryable payment confirmation. */

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_cc68339c362cba7e41e098cbbb2e993a145b1092'
const PAYMENT_POLL_INTERVAL_MS = 4000
const PAYMENT_POLL_TIMEOUT_MS = 90_000

let scriptLoaded = false
function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (scriptLoaded || window.PaystackPop) { scriptLoaded = true; return resolve() }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => { scriptLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(script)
  })
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function confirmReference(reference) {
  const response = await fetch('/api/confirm-payment', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference })
  })
  let result = {}
  try { result = await response.json() } catch { result = {} }
  if (result.status === 'pending') return result
  if (result.status === 'success') return result
  if (!response.ok || result.status === 'error') {
    const error = new Error(result.error || 'Payment confirmation failed')
    error.transient = response.status >= 500
    throw error
  }
  throw new Error(result.error || 'Payment confirmation failed')
}

const PaystackService = {
  async initializePayment({ email, amount, name, metadata, onSuccess, onClose, reference, subaccount }) {
    await loadPaystackScript()
    if (!window.PaystackPop) throw new Error('Paystack failed to initialize')
    const ref = reference || `tixo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    const config = {
      key: PAYSTACK_PUBLIC_KEY, email, amount: Math.round(amount * 100), currency: 'NGN', ref,
      firstname: name?.split(' ')[0] || undefined,
      lastname: name?.split(' ').slice(1).join(' ') || undefined,
      metadata: { custom_fields: [{ display_name: 'Platform', variable_name: 'platform', value: 'Tixo.online' }], ...metadata },
      callback: response => onSuccess?.(response),
      onClose: () => onClose?.()
    }
    if (subaccount) { config.subaccount = subaccount; config.bearer = 'account' }
    window.PaystackPop.setup(config).openIframe()
  },

  confirmPayment: confirmReference,

  pay({ email, amount, name, metadata, subaccount, onPending, eventId }) {
    return new Promise((resolve, reject) => {
      let settled = false
      let callbackStarted = false
      const fail = error => { if (!settled) { settled = true; reject(error) } }
      const confirm = async response => {
        if (settled || callbackStarted) return
        callbackStarted = true
        const reference = response?.reference
        if (!reference) return fail(new Error('Payment made but verification failed: Paystack returned no reference'))
        if (eventId) localStorage.setItem(`pending_payment_${eventId}`, reference)
        const deadline = Date.now() + PAYMENT_POLL_TIMEOUT_MS
        while (!settled && Date.now() < deadline) {
          try {
            const result = await confirmReference(reference)
            if (result.status === 'success') {
              if (eventId) localStorage.removeItem(`pending_payment_${eventId}`)
              settled = true
              resolve({ ...result, reference })
              return
            }
            onPending?.({ reference })
          } catch (error) {
            if (!error.transient) return fail(new Error(`${error.message}. Reference: ${reference}`))
            onPending?.({ reference, transient: true })
          }
          await wait(Math.min(PAYMENT_POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())))
        }
        fail(new Error(`Payment is still being confirmed. Reference: ${reference}. Your ticket will appear on your dashboard and arrive by email once the transfer confirms.`))
      }
      this.initializePayment({ email, amount, name, metadata, subaccount, onSuccess: confirm, onClose: () => { if (!callbackStarted) fail(new Error('Payment cancelled')) } }).catch(fail)
    })
  }
}

export default PaystackService
