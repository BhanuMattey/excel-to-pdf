const SUPPORT_EMAIL = 'support@excelfrompdf.com'

type ContactPayload = {
  name?: string
  email?: string
  subject?: string
  message?: string
}

type EmailPayload = {
  from: string
  to: string | string[]
  subject: string
  html: string
  reply_to?: string
}

const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  support: 'Technical Support',
  billing: 'Billing Question',
  enterprise: 'Enterprise / Team Sales',
  partnership: 'Partnership Opportunity',
  other: 'Other',
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')

  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    if (response.ok) return
    const error = await response.text().catch(() => '')
    throw new Error(error || 'Failed to send email')
  })
}

export async function sendContactEmails(payload: ContactPayload) {
  const name = payload.name?.trim() ?? ''
  const email = payload.email?.trim().toLowerCase() ?? ''
  const subject = payload.subject?.trim() ?? ''
  const message = payload.message?.trim() ?? ''

  if (!name || !email || !subject || !message) {
    return { ok: false, status: 400, error: 'All fields are required' }
  }

  if (!isEmail(email)) {
    return { ok: false, status: 400, error: 'Enter a valid email address' }
  }

  const from = process.env.RESEND_FROM || `ExcelfromPDF <${SUPPORT_EMAIL}>`
  const topic = subjectLabels[subject] ?? subject
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeTopic = escapeHtml(topic)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />')

  await Promise.all([
    sendEmail({
      from,
      to: SUPPORT_EMAIL,
      reply_to: email,
      subject: `Contact form: ${topic}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2 style="margin:0 0 16px">New contact form message</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Topic:</strong> ${safeTopic}</p>
          <div style="margin-top:18px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb">
            ${safeMessage}
          </div>
        </div>
      `,
    }),
    sendEmail({
      from,
      to: email,
      subject: 'We received your message - ExcelfromPDF',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2 style="margin:0 0 12px">Thanks for contacting ExcelfromPDF</h2>
          <p>Hi ${safeName},</p>
          <p>We have received your message about <strong>${safeTopic}</strong>.</p>
          <p>Our team will address your query within 12 hours or at the earliest.</p>
          <div style="margin:20px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb">
            ${safeMessage}
          </div>
          <p>If you need to add more details, reply to this email or write to ${SUPPORT_EMAIL}.</p>
          <p style="margin-top:24px">Regards,<br />ExcelfromPDF Support</p>
        </div>
      `,
    }),
  ])

  return { ok: true, status: 200 }
}

export { SUPPORT_EMAIL }
