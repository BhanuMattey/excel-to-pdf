import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { payments, profiles } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'
import { createDb } from '../../src/server/db.js'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

const PLAN_AMOUNTS: Record<string, number> = {
  pro_monthly_INR: 49900,
  pro_yearly_INR: 359900,
}
const PLAN_DISPLAY_AMOUNTS: Record<string, number> = {
  pro_monthly_INR: 499,
  pro_yearly_INR: 3599,
}
const PLAN_CURRENCIES: Record<string, string> = {
  pro_monthly_INR: 'INR',
  pro_yearly_INR: 'INR',
}
const PLAN_PERIOD: Record<string, string> = {
  pro_monthly_INR: 'monthly',
  pro_yearly_INR: 'yearly',
}
const PLAN_NAMES: Record<string, string> = {
  pro_monthly_INR: 'Professional Monthly (INR)',
  pro_yearly_INR: 'Professional Yearly (INR)',
}

const rzpAuth = () => `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = req.body as { plan_id?: string; user_id?: string; user_email?: string }
  const planId = body.plan_id ?? ''
  const amount = PLAN_AMOUNTS[planId]
  if (!amount) return res.status(400).json({ detail: `Unknown plan_id: ${planId}` })

  const d = createDb()

  try {
    // Try subscription first
    const envKey = `RAZORPAY_PLAN_ID_${planId.toUpperCase()}`
    let rzpPlanId = process.env[envKey] || ''

    if (!rzpPlanId) {
      const planRes = await fetch('https://api.razorpay.com/v1/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: rzpAuth() },
        body: JSON.stringify({
          period: PLAN_PERIOD[planId] === 'yearly' ? 'yearly' : 'monthly',
          interval: 1,
          item: { name: PLAN_NAMES[planId], amount, currency: PLAN_CURRENCIES[planId], description: PLAN_NAMES[planId] },
        }),
      })
      if (planRes.ok) {
        const plan = await planRes.json() as { id: string }
        rzpPlanId = plan.id
      }
    }

    if (rzpPlanId) {
      const subRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: rzpAuth() },
        body: JSON.stringify({
          plan_id: rzpPlanId,
          total_count: 12,
          quantity: 1,
          customer_notify: 1,
          notify_info: { notify_email: body.user_email ?? '' },
        }),
      })
      if (!subRes.ok) {
        const err = await subRes.json() as { error?: { description?: string } }
        return res.status(502).json({ detail: err?.error?.description || 'Subscription creation failed' })
      }
      const sub = await subRes.json() as { id: string }
      await d.insert(payments).values({
        id: sub.id,
        userId: body.user_id ?? null,
        userEmail: body.user_email ?? '',
        planId,
        amount,
        displayAmount: PLAN_DISPLAY_AMOUNTS[planId],
        currency: PLAN_CURRENCIES[planId] ?? 'INR',
        status: 'created',
        paymentType: 'subscription',
        razorpaySubscriptionId: sub.id,
      })
      return res.json({
        success: true,
        type: 'subscription',
        order: { subscription_id: sub.id, key_id: RAZORPAY_KEY_ID, amount, currency: PLAN_CURRENCIES[planId], plan_name: PLAN_NAMES[planId] },
      })
    }

    // Fallback: one-time order
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: rzpAuth() },
      body: JSON.stringify({ amount, currency: PLAN_CURRENCIES[planId] ?? 'INR', receipt: randomUUID() }),
    })
    if (!orderRes.ok) {
      const err = await orderRes.json() as { error?: { description?: string } }
      return res.status(502).json({ detail: err?.error?.description || 'Order creation failed' })
    }
    const order = await orderRes.json() as { id: string; amount: number; currency: string }
    await d.insert(payments).values({
      id: order.id,
      userId: body.user_id ?? null,
      userEmail: body.user_email ?? '',
      planId,
      amount: order.amount,
      displayAmount: PLAN_DISPLAY_AMOUNTS[planId],
      currency: order.currency,
      status: 'created',
      paymentType: 'one_time',
    })
    return res.json({
      success: true,
      type: 'order',
      order: { order_id: order.id, key_id: RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency, plan_name: PLAN_NAMES[planId] },
    })
  } catch (err) {
    console.error('[payment/create-order]', err)
    return res.status(500).json({ detail: 'Order creation failed' })
  }
}
