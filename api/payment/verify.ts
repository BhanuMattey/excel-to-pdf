import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHmac } from 'crypto'
import { payments, profiles } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'
import { createDb } from '../../src/server/db.js'
import { getSessionUser } from '../_auth.js'

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

const ALLOWED_PLAN_IDS = new Set(['pro_monthly_INR', 'pro_yearly_INR'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // user_id must come from the verified session, not the request body.
  const sessionUser = await getSessionUser(req)
  if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })

  const body = req.body as {
    razorpay_order_id?: string
    razorpay_subscription_id?: string
    razorpay_payment_id: string
    razorpay_signature: string
    plan_id: string
    user_email?: string
  }

  if (!ALLOWED_PLAN_IDS.has(body.plan_id)) {
    return res.status(400).json({ detail: `Unknown plan_id: ${body.plan_id}` })
  }

  const sigBase = body.razorpay_subscription_id
    ? `${body.razorpay_payment_id}|${body.razorpay_subscription_id}`
    : `${body.razorpay_order_id}|${body.razorpay_payment_id}`

  const expected = createHmac('sha256', RAZORPAY_KEY_SECRET).update(sigBase).digest('hex')
  if (expected !== body.razorpay_signature) return res.status(400).json({ detail: 'Invalid payment signature' })

  const d = createDb()
  try {
    const recordId = body.razorpay_subscription_id || body.razorpay_order_id || ''

    // Ensure the payment record belongs to the session user before updating it.
    const [existingPayment] = await d.select({ userId: payments.userId })
      .from(payments)
      .where(eq(payments.id, recordId))
      .limit(1)

    if (!existingPayment) return res.status(404).json({ detail: 'Payment record not found' })
    if (existingPayment.userId && existingPayment.userId !== sessionUser.id) {
      return res.status(403).json({ detail: 'Forbidden' })
    }

    await d.update(payments).set({
      userId: sessionUser.id,
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
    const [existing] = await d.select().from(profiles).where(eq(profiles.id, sessionUser.id))
    const update = {
      plan: basePlan,
      planId: body.plan_id,
      subscriptionId: body.razorpay_subscription_id ?? null,
      subscriptionStatus: 'active',
      renewalDate,
      updatedAt: new Date(),
    }
    if (existing) {
      await d.update(profiles).set(update).where(eq(profiles.id, sessionUser.id))
    } else {
      await d.insert(profiles).values({ id: sessionUser.id, ...update })
    }

    return res.json({ success: true, plan: basePlan, renewal_date: renewalDate.toISOString() })
  } catch (err) {
    console.error('[payment/verify]', err)
    return res.status(500).json({ detail: 'Payment verification failed' })
  }
}
