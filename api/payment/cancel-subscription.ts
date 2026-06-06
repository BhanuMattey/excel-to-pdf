import type { VercelRequest, VercelResponse } from '@vercel/node'
import { profiles } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'
import { createDb } from '../../src/server/db.js'
import { getSessionUser } from '../_auth.js'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // user_id must come from the verified session, not the request body.
  const sessionUser = await getSessionUser(req)
  if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })

  const body = req.body as { subscription_id?: string }
  if (!body.subscription_id) return res.status(400).json({ detail: 'Missing subscription_id' })

  // Verify that the subscription actually belongs to this user before cancelling.
  const d = createDb()
  const [profile] = await d.select({ subscriptionId: profiles.subscriptionId })
    .from(profiles)
    .where(eq(profiles.id, sessionUser.id))
    .limit(1)

  if (!profile || profile.subscriptionId !== body.subscription_id) {
    return res.status(403).json({ detail: 'Forbidden' })
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

  try {
    await d.update(profiles).set({ subscriptionStatus: 'cancelled', updatedAt: new Date() })
      .where(eq(profiles.id, sessionUser.id))
    return res.json({ success: true })
  } catch (err) {
    console.error('[payment/cancel-subscription]', err)
    return res.status(500).json({ detail: 'Cancellation failed' })
  }
}
