import React from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Coins, Sparkles } from 'lucide-react'
import TxpService from '../services/TxpService'
import { triggerTxpCelebration } from './TxpCelebration'

/**
 * Custom toast body shown via toast.custom() whenever the current user
 * earns Tixo Points. Slides/fades in and out using the `visible` prop
 * react-hot-toast provides to custom renderers.
 */
export function TxpToast({ visible, amount, reason, toastId }) {
  const label = TxpService.reasonLabel(reason)

  return (
    <div
      className={`max-w-sm w-full pointer-events-auto flex rounded-2xl bg-gray-900/95 border border-gray-800 shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
      }`}
    >
      {/* Gradient accent bar */}
      <div className="w-1.5 flex-shrink-0 bg-gradient-to-b from-pink-500 via-purple-500 to-cyan-500" />

      <div className="flex-1 p-4 flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Coins className="w-5 h-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
            +{Number(amount || 0).toLocaleString()} TXP
          </p>
          <p className="text-gray-300 text-xs mt-0.5 truncate flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            {label}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              to="/wallet"
              onClick={() => toast.dismiss(toastId)}
              className="text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
            >
              View Wallet →
            </Link>
            <Link
              to="/earn"
              onClick={() => toast.dismiss(toastId)}
              className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
            >
              How to earn more →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Fire a custom TXP-earned toast. Call this right after a TxpService award
 * call succeeds for the CURRENT user (not for a referrer who isn't on the page).
 *
 * @param {number} amount - Points earned (positive number)
 * @param {string} reason - Reason string, e.g. 'ticket_purchase', 'referral_registered'
 */
export function showTxpToast(amount, reason) {
  if (!amount || amount <= 0) return null
  triggerTxpCelebration(amount, reason)
  return toast.custom(
    (t) => <TxpToast visible={t.visible} amount={amount} reason={reason} toastId={t.id} />,
    { duration: 5000, position: 'top-right' }
  )
}

export default TxpToast
