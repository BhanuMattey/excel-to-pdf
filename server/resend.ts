import 'dotenv/config'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<void> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
  const FROM_ADDRESS = process.env.RESEND_FROM || 'ExcelfromPDF <onboarding@resend.dev>'

  if (!RESEND_API_KEY) {
    console.log(`[resend] RESEND_API_KEY not set — skipping email to ${to}`)
    console.log(`[resend] Subject: ${subject}`)
    return
  }

  console.log(`[resend] Sending to ${to} from ${FROM_ADDRESS}`)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend API error ${res.status}: ${err}`)
  }

  console.log(`[resend] Email sent to ${to}`)
}
