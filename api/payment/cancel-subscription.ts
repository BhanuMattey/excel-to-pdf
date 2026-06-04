import type { VercelRequest, VercelResponse } from '@vercel/node'
import { profiles } from '../../src/db/schema'
import { eq } from 'drizzle-orm'
import { createDb } from '../_db'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = req.body as { subscription_id: string; user_id?: string; user_email?: string }
  if (!body.user_id) {
    return res.status(400).json({ detail: 'Missing user_id' })
  }

  const rzpRes = await fetch(`https://api.razorpay.com/v1/subscriptions/${body.subscription_id}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({ cancel_at_cycle_end: 1 }),
  })

  if (!rzpRes.ok) {
    const err = await rzpRes.json() as { error?: { description?: string } }
    return res.status(502).json({ detail: err?.error?.description || 'Cancellation failed' })
  }

  const d = createDb()
  try {
    await d.update(profiles).set({ subscriptionStatus: 'cancelled', updatedAt: new Date() })
      .where(eq(profiles.id, body.user_id))
    return res.json({ success: true })
  } catch (err) {
    console.error('[payment/cancel-subscription]', err)
    return res.status(500).json({ detail: 'Cancellation failed' })
  }
}
