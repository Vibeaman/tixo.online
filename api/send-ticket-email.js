// Vercel Serverless Function — POST /api/send-ticket-email
// Sends a ticket confirmation email via Resend after purchase

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('RESEND_API_KEY not configured — skipping email')
    return res.status(200).json({ sent: false, reason: 'Email service not configured' })
  }

  const { to, buyerName, eventTitle, eventDate, eventTime, eventLocation, tickets, totalAmount, paymentReference, eventType, virtualLink, paymentDate } = req.body

  if (!to || !eventTitle) {
    return res.status(400).json({ error: 'Missing required fields (to, eventTitle)' })
  }

  // Format event time for display
  function fmtTime(t) {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hr = parseInt(h)
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
  }

  function fmtDate(d) {
    if (!d) return ''
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const ticketRows = (tickets || []).map(t =>
    `<tr>
      <td style="padding:12px 16px;border-bottom:1px solid #2a2a3a;color:#e0e0e0;font-size:14px">
        ${t.tierName || 'General'}${t.attendeeName ? `<br><span style="color:#888;font-size:12px">${t.attendeeName}</span>` : ''}
        ${t.checkInCode ? `<br><span style="color:#a855f7;font-size:12px;font-weight:600;letter-spacing:1px">🎫 ${t.checkInCode}</span>` : ''}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #2a2a3a;color:#e0e0e0;font-size:14px;text-align:center">${t.quantity || 1}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #2a2a3a;color:#e0e0e0;font-size:14px;text-align:right">${t.totalPrice > 0 ? '₦' + Number(t.totalPrice).toLocaleString() : 'Free'}</td>
    </tr>`
  ).join('')

  // Format payment date
  function fmtPaymentDate(d) {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) + ' at ' +
      dt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const fromAddress = process.env.EMAIL_FROM || 'Tixo <tickets@tixo.online>'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <div style="text-align:center;padding:32px 0 24px">
    <h1 style="margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#ec4899,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Tixo</h1>
  </div>

  <!-- Main Card -->
  <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden">

    <!-- Success Banner -->
    <div style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:28px 24px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">🎉</div>
      <h2 style="margin:0;color:#fff;font-size:22px;font-weight:700">Ticket${(tickets || []).length > 1 ? 's' : ''} Confirmed!</h2>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">You're all set, ${buyerName || 'there'}!</p>
    </div>

    <!-- Event Details -->
    <div style="padding:28px 24px">
      <h3 style="margin:0 0 20px;color:#fff;font-size:20px;font-weight:700">${eventTitle}</h3>

      <div style="margin-bottom:20px">
        <div style="display:flex;margin-bottom:12px">
          <span style="color:#a855f7;font-size:14px;min-width:24px">📅</span>
          <span style="color:#d0d0d0;font-size:14px;margin-left:8px">${fmtDate(eventDate)}</span>
        </div>
        ${eventTime ? `<div style="display:flex;margin-bottom:12px">
          <span style="color:#a855f7;font-size:14px;min-width:24px">🕐</span>
          <span style="color:#d0d0d0;font-size:14px;margin-left:8px">${fmtTime(eventTime)}</span>
        </div>` : ''}
        ${eventLocation ? `<div style="display:flex;margin-bottom:12px">
          <span style="color:#a855f7;font-size:14px;min-width:24px">📍</span>
          <span style="color:#d0d0d0;font-size:14px;margin-left:8px">${eventLocation}</span>
        </div>` : ''}
        ${eventType === 'virtual' || eventType === 'hybrid' ? `<div style="display:flex;margin-bottom:12px">
          <span style="color:#a855f7;font-size:14px;min-width:24px">💻</span>
          <span style="color:#d0d0d0;font-size:14px;margin-left:8px">${eventType === 'virtual' ? 'Virtual Event' : 'Hybrid Event'}${virtualLink ? ` — <a href="${virtualLink}" style="color:#ec4899">Join Link</a>` : ''}</span>
        </div>` : ''}
      </div>

      <!-- Ticket Table -->
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
          <tr style="background:rgba(255,255,255,0.05)">
            <th style="padding:12px 16px;text-align:left;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a">Tier</th>
            <th style="padding:12px 16px;text-align:center;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a">Qty</th>
            <th style="padding:12px 16px;text-align:right;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a">Price</th>
          </tr>
        </thead>
        <tbody>${ticketRows}</tbody>
        ${totalAmount > 0 ? `<tfoot>
          <tr>
            <td colspan="2" style="padding:14px 16px;color:#888;font-size:14px;font-weight:600">Total Paid</td>
            <td style="padding:14px 16px;text-align:right;color:#ec4899;font-size:18px;font-weight:800">₦${Number(totalAmount).toLocaleString()}</td>
          </tr>
        </tfoot>` : ''}
      </table>

      ${paymentReference || paymentDate ? `<div style="text-align:center;margin-top:4px">
        ${paymentReference ? `<p style="margin:0 0 4px;color:#666;font-size:12px">Ref: ${paymentReference}</p>` : ''}
        ${paymentDate ? `<p style="margin:0;color:#666;font-size:12px">Paid on: ${fmtPaymentDate(paymentDate)}</p>` : ''}
      </div>` : ''}
    </div>

    <!-- QR Note -->
    <div style="padding:0 24px 28px;text-align:center">
      <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.2);border-radius:12px;padding:20px">
        <p style="margin:0;color:#c084fc;font-size:14px;font-weight:600">📱 Your QR Ticket</p>
        <p style="margin:8px 0 0;color:#999;font-size:13px">Your unique ticket code${(tickets || []).length > 1 ? 's are' : ' is'} shown above (🎫). Log in to <a href="https://tixo.online/dashboard" style="color:#ec4899;text-decoration:none;font-weight:600">tixo.online/dashboard</a> to view and download your full QR ticket for check-in.</p>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:28px 0">
    <p style="margin:0;color:#555;font-size:12px">Powered by <a href="https://tixo.online" style="color:#a855f7;text-decoration:none;font-weight:600">Tixo.online</a></p>
    <p style="margin:8px 0 0;color:#444;font-size:11px">Nigeria's event ticketing platform 🎟️</p>
  </div>
</div>
</body>
</html>`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: `🎟️ Your Ticket${(tickets || []).length > 1 ? 's' : ''} for ${eventTitle} — Confirmed!`,
        html
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend error:', result)
      return res.status(200).json({ sent: false, reason: result.message || 'Email send failed' })
    }

    return res.status(200).json({ sent: true, id: result.id })
  } catch (err) {
    console.error('Email send error:', err)
    return res.status(200).json({ sent: false, reason: 'Server error' })
  }
}
