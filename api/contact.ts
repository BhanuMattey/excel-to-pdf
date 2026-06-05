import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendContactEmails } from '../src/server/contact-email.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const result = await sendContactEmails(req.body)
    if (!result.ok) return res.status(result.status).json({ error: result.error })
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[contact]', err)
    return res.status(500).json({ error: 'Failed to send message' })
  }
}
