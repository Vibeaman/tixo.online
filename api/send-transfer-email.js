export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return res.status(200).json({ sent: false, reason: 'Email not configured' })

  const { to, recipientName, senderName, eventTitle, eventDate, eventTime, eventLocation, tierName, checkInCode } = req.body
  if (!to || !eventTitle) return res.status(400).json({ error: 'Missing required fields' })

  function fmtTime(t) { if (!t) return ''; const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}` }
  function fmtDate(d) { if (!d) return ''; return new Date(d + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }

  const fromAddress = process.env.EMAIL_FROM || 'Tixo <tickets@tixo.online>'

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
  <div style="text-align:center;padding:32px 0 24px">
    <h1 style="margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#ec4899,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Tixo</h1>
  </div>
  <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:28px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">🎁</div>
      <h2 style="margin:0;color:#fff;font-size:22px;font-weight:700">You've Received a Ticket!</h2>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">${senderName || 'Someone'} sent you a ticket</p>
    </div>
    <div style="padding:28px 24px">
      <h3 style="margin:0 0 20px;color:#fff;font-size:20px;font-weight:700">${eventTitle}</h3>
      <div style="margin-bottom:20px">
        <div style="display:flex;margin-bottom:12px"><span style="color:#a855f7;font-size:14px;min-width:24px">📅</span><span style="color:#d0d0d0;font-size:14px;margin-left:8px">${fmtDate(eventDate)}</span></div>
        ${eventTime ? `<div style="display:flex;margin-bottom:12px"><span style="color:#a855f7;font-size:14px;min-width:24px">🕐</span><span style="color:#d0d0d0;font-size:14px;margin-left:8px">${fmtTime(eventTime)}</span></div>` : ''}
        ${eventLocation ? `<div style="display:flex;margin-bottom:12px"><span style="color:#a855f7;font-size:14px;min-width:24px">📍</span><span style="color:#d0d0d0;font-size:14px;margin-left:8px">${eventLocation}</span></div>` : ''}
        ${tierName ? `<div style="display:flex;margin-bottom:12px"><span style="color:#a855f7;font-size:14px;min-width:24px">🎫</span><span style="color:#d0d0d0;font-size:14px;margin-left:8px">${tierName}</span></div>` : ''}
      </div>
      ${checkInCode ? `<div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:20px;text-align:center;margin-top:20px">
        <p style="margin:0;color:#c084fc;font-size:14px;font-weight:600">Your Check-in Code</p>
        <p style="margin:12px 0 0;color:#fff;font-size:28px;font-weight:800;letter-spacing:4px">${checkInCode}</p>
        <p style="margin:12px 0 0;color:#999;font-size:13px">Show this code or sign up on <a href="https://tixo.online" style="color:#ec4899;text-decoration:none;font-weight:600">tixo.online</a> to get your QR ticket.</p>
      </div>` : ''}
    </div>
  </div>
  <div style="text-align:center;padding:28px 0">
    <p style="margin:0;color:#555;font-size:12px">Powered by <a href="https://tixo.online" style="color:#a855f7;text-decoration:none;font-weight:600">Tixo.online</a></p>
  </div>
</div></body></html>`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress, to: [to], subject: `🎁 ${senderName || 'Someone'} sent you a ticket for ${eventTitle}!`, html })
    })
    const result = await response.json()
    if (!response.ok) return res.status(200).json({ sent: false, reason: result.message })
    return res.status(200).json({ sent: true, id: result.id })
  } catch (err) {
    return res.status(200).json({ sent: false, reason: 'Server error' })
  }
}
