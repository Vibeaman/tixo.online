import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function ReferralRedirect() {
  const { code } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (code) {
      localStorage.setItem('tixo_referral_code', code)
    }
    navigate('/signup', { replace: true })
  }, [code, navigate])

  return null
}
