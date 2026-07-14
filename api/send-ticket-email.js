// Vercel Serverless Function — POST /api/send-ticket-email
// Sends a beautifully designed ticket confirmation email via Resend

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

  const {
    to, buyerName, eventTitle, eventDate, eventTime, eventLocation,
    tickets, totalAmount, paymentReference, eventType, virtualLink,
    paymentDate, eventImage, eventSlug
  } = req.body

  if (!to || !eventTitle) {
    return res.status(400).json({ error: 'Missing required fields (to, eventTitle)' })
  }

  // --- Helpers ---
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

  function fmtPaymentDate(d) {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) + ' at ' +
      dt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  function qrUrl(code) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=168-85-247&bgcolor=18-18-26&data=${encodeURIComponent(code)}`
  }

  const isFree = !totalAmount || Number(totalAmount) === 0
  const ticketCount = (tickets || []).length
  const eventUrl = `https://tixo.online/event/${eventSlug || ''}`

  // --- Build individual ticket cards with QR codes ---
  const ticketCards = (tickets || []).map((t, i) => {
    const code = t.checkInCode || ''
    const tierName = t.tierName || 'General Admission'
    const attendee = t.attendeeName || buyerName || ''
    const price = t.totalPrice > 0 ? '₦' + Number(t.totalPrice).toLocaleString() : 'Free'
    const priceColor = t.totalPrice > 0 ? '#ec4899' : '#4ade80'

    return `
    <!-- Ticket Card ${i + 1} -->
    <div style="background:#1a1a2e;border:1px solid rgba(168,85,247,0.25);border-radius:16px;overflow:hidden;margin-bottom:16px">
      <!-- Ticket header strip -->
      <div style="background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(236,72,153,0.15));padding:14px 20px;border-bottom:1px dashed rgba(168,85,247,0.3);display:flex">
        <div style="flex:1">
          <p style="margin:0;color:#c084fc;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">Ticket ${ticketCount > 1 ? `#${i + 1}` : ''}</p>
          <p style="margin:4px 0 0;color:#fff;font-size:16px;font-weight:700">${tierName}</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;color:${priceColor};font-size:18px;font-weight:800">${price}</p>
        </div>
      </div>
      
      <!-- Ticket body with QR -->
      <div style="padding:20px;text-align:center">
        ${attendee ? `<p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px">Attendee: <span style="color:#fff;font-weight:600">${attendee}</span></p>` : ''}
        ${code ? `
        <div style="background:#12121a;border-radius:12px;padding:16px;display:inline-block;margin-bottom:12px">
          <img src="${qrUrl(code)}" alt="QR Ticket" width="160" height="160" style="display:block;border-radius:8px" />
        </div>
        <p style="margin:0;color:#a855f7;font-size:14px;font-weight:700;letter-spacing:2px;font-family:monospace">${code}</p>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.3);font-size:11px">Show this QR code at the event entrance</p>
        ` : ''}
      </div>
    </div>`
  }).join('')

  // --- Build the full email HTML ---
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:0">

  <!-- ===== HEADER BANNER ===== -->
  <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:20px 24px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:3px;font-weight:800">🎫 Booking Confirmation</h1>
  </div>

  <!-- ===== MAIN CARD ===== -->
  <div style="background:#12121a;padding:0">

    <!-- Greeting -->
    <div style="padding:32px 28px 24px">
      <h2 style="margin:0 0 12px;color:#fff;font-size:24px;font-weight:800">Experience Confirmed! 🎉</h2>
      <p style="margin:0;color:rgba(255,255,255,0.65);font-size:15px;line-height:1.6">
        Hello <strong style="color:#fff">${buyerName || 'there'}</strong>, we're glad to have you on board. Your booking was successful and your ticket${ticketCount > 1 ? 's' : ''} for
        <a href="${eventUrl}" style="color:#ec4899;text-decoration:none;font-weight:700">${eventTitle}</a> ${ticketCount > 1 ? 'are' : 'is'} ready.
      </p>
    </div>

    ${eventImage ? `
    <!-- Event Image / Flyer -->
    <div style="padding:0 28px 24px">
      <div style="border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
        <a href="${eventUrl}" style="display:block">
          <img src="${eventImage}" alt="${eventTitle}" width="544" style="display:block;width:100%;height:auto;max-height:320px;object-fit:cover" />
        </a>
      </div>
    </div>
    ` : ''}

    <!-- ===== EVENT DETAILS ===== -->
    <div style="padding:0 28px 28px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);width:40px;vertical-align:top">
            <span style="font-size:18px">📅</span>
          </td>
          <td style="padding:14px 0 14px 12px;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600">Date & Time</p>
            <p style="margin:4px 0 0;color:#fff;font-size:15px;font-weight:600">${fmtDate(eventDate)}${eventTime ? ` • ${fmtTime(eventTime)}` : ''}</p>
          </td>
        </tr>
        ${eventLocation ? `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);width:40px;vertical-align:top">
            <span style="font-size:18px">📍</span>
          </td>
          <td style="padding:14px 0 14px 12px;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600">Location</p>
            <p style="margin:4px 0 0;color:#fff;font-size:15px;font-weight:600">${eventLocation}</p>
          </td>
        </tr>` : ''}
        ${eventType === 'virtual' || eventType === 'hybrid' ? `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);width:40px;vertical-align:top">
            <span style="font-size:18px">💻</span>
          </td>
          <td style="padding:14px 0 14px 12px;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600">${eventType === 'virtual' ? 'Virtual Event' : 'Hybrid Event'}</p>
            ${virtualLink ? `<p style="margin:4px 0 0"><a href="${virtualLink}" style="color:#ec4899;font-size:15px;font-weight:600;text-decoration:none">Join Online →</a></p>` : '<p style="margin:4px 0 0;color:#fff;font-size:15px;font-weight:600">Link will be shared before the event</p>'}
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:14px 0;width:40px;vertical-align:top">
            <span style="font-size:18px">🎟️</span>
          </td>
          <td style="padding:14px 0 14px 12px;vertical-align:top">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600">Tickets</p>
            <p style="margin:4px 0 0;color:#fff;font-size:15px;font-weight:600">${ticketCount} ticket${ticketCount > 1 ? 's' : ''} • ${isFree ? '<span style="color:#4ade80">Free</span>' : '₦' + Number(totalAmount).toLocaleString()}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- ===== TICKET CARDS WITH QR CODES ===== -->
    <div style="padding:0 28px">
      <h3 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;display:flex;align-items:center">
        <span style="display:inline-block;width:4px;height:20px;background:linear-gradient(180deg,#a855f7,#ec4899);border-radius:2px;margin-right:10px"></span>
        Your Ticket${ticketCount > 1 ? 's' : ''}
      </h3>
      ${ticketCards}
    </div>

    ${!isFree ? `
    <!-- ===== PAYMENT RECEIPT ===== -->
    <div style="padding:0 28px 28px">
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:20px">
        <h4 style="margin:0 0 16px;color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">Payment Receipt</h4>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px">Amount Paid</td>
            <td style="padding:8px 0;text-align:right;color:#ec4899;font-size:16px;font-weight:800">₦${Number(totalAmount).toLocaleString()}</td>
          </tr>
          ${paymentReference ? `
          <tr>
            <td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px">Reference</td>
            <td style="padding:8px 0;text-align:right;color:rgba(255,255,255,0.7);font-size:13px;font-family:monospace">${paymentReference}</td>
          </tr>` : ''}
          ${paymentDate ? `
          <tr>
            <td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px">Date</td>
            <td style="padding:8px 0;text-align:right;color:rgba(255,255,255,0.7);font-size:13px">${fmtPaymentDate(paymentDate)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 0;color:rgba(255,255,255,0.5);font-size:13px">Status</td>
            <td style="padding:8px 0;text-align:right"><span style="background:rgba(74,222,128,0.15);color:#4ade80;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">✓ Paid</span></td>
          </tr>
        </table>
      </div>
    </div>` : ''}

    <!-- ===== CTA BUTTON ===== -->
    <div style="padding:0 28px 32px;text-align:center">
      <a href="https://tixo.online/dashboard" style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:15px">View My Tickets</a>
      <p style="margin:12px 0 0;color:rgba(255,255,255,0.3);font-size:12px">Access your full tickets with downloadable QR codes on your dashboard</p>
    </div>

  </div>

  <!-- ===== FOOTER ===== -->
  <div style="background:#0a0a12;padding:28px;text-align:center">
    <p style="margin:0 0 4px;font-size:18px;font-weight:800;background:linear-gradient(135deg,#ec4899,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Tixo</p>
    <p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px">Nigeria's event ticketing platform 🎟️</p>
    <p style="margin:12px 0 0;color:rgba(255,255,255,0.15);font-size:11px"><a href="https://tixo.online" style="color:rgba(255,255,255,0.3);text-decoration:none">tixo.online</a></p>
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
        from: process.env.EMAIL_FROM || 'Tixo <tickets@tixo.online>',
        to: [to],
        subject: `🎫 Your Ticket${ticketCount > 1 ? 's' : ''} for ${eventTitle} — Confirmed!`,
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
