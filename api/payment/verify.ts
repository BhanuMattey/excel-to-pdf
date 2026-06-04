import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHmac } from 'crypto'
import { payments, profiles } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'
import { createDb } from '../_db.js'

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = req.body as {
    razorpay_order_id?: string
    razorpay_subscription_id?: string
    razorpay_payment_id: string
    razorpay_signature: string
    plan_id: string
    user_email: string
    user_id?: string
  }

  if (!body.user_id) {
    return res.status(400).json({ detail: 'Missing user_id' })
  }

  const sigBase = body.razorpay_subscription_id
    ? `${body.razorpay_payment_id}|${body.razorpay_subscription_id}`
    : `${body.razorpay_order_id}|${body.razorpay_payment_id}`

  const expected = createHmac('sha256', RAZORPAY_KEY_SECRET).update(sigBase).digest('hex')
  if (expected !== body.razorpay_signature) return res.status(400).json({ detail: 'Invalid payment signature' })

  const d = createDb()
  try {
    const recordId = body.razorpay_subscription_id || body.razorpay_order_id || ''
    await d.update(payments).set({
      userId: body.user_id,
      status: 'paid',
      razorpayPaymentId: body.razorpay_payment_id,
      razorpaySignature: body.razorpay_signature,
      updatedAt: new Date(),
    }).where(eq(payments.id, recordId))

    const isYearly = body.plan_id.includes('yearly')
    const renewalDate = new Date()
    if (isYearly) renewalDate.setFullYear(renewalDate.getFullYear() + 1)
    else renewalDate.setMonth(renewalDate.getMonth() + 1)

    const basePlan = body.plan_id.split('_')[0]
    const existing = await d.select().from(profiles).where(eq(profiles.id, body.user_id))
    const update = {
      plan: basePlan,
      planId: body.plan_id,
      subscriptionId: body.razorpay_subscription_id ?? null,
      subscriptionStatus: 'active',
      renewalDate,
      updatedAt: new Date(),
    }
    if (existing.length > 0) {
      await d.update(profiles).set(update).where(eq(profiles.id, body.user_id))
    } else {
      await d.insert(profiles).values({ id: body.user_id, ...update })
    }

    return res.json({ success: true, plan: basePlan, renewal_date: renewalDate.toISOString() })
  } catch (err) {
    console.error('[payment/verify]', err)
    return res.status(500).json({ detail: 'Payment verification failed' })
  }
}
