import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq, desc } from 'drizzle-orm'
import { profiles, payments } from '../src/db/schema.js'
import { createDb } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const d = createDb()

  try {
    if (req.method === 'GET') {
      const userId = req.query.user_id as string
      if (!userId) return res.status(400).json({ error: 'user_id required' })

      const [profile] = await d.select().from(profiles).where(eq(profiles.id, userId))
      const userPayments = await d.select().from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))

      const hasPaidPayment = userPayments.some(p => p.status === 'paid')
      const latestPaidPayment = userPayments.find(p => p.status === 'paid') ?? null

      return res.json({
        profile: profile ? {
          plan: profile.plan ?? 'free',
          planId: profile.planId ?? null,
          subscriptionId: profile.subscriptionId ?? null,
          subscriptionStatus: profile.subscriptionStatus ?? null,
          renewalDate: profile.renewalDate?.toISOString() ?? null,
        } : null,
        payments: userPayments.map(p => ({
          id: p.id,
          plan_id: p.planId,
          amount: p.amount,
          display_amount: p.displayAmount,
          currency: p.currency,
          status: p.status,
          payment_type: p.paymentType,
          razorpay_payment_id: p.razorpayPaymentId,
          razorpay_subscription_id: p.razorpaySubscriptionId,
          created_at: p.createdAt?.toISOString() ?? null,
          updated_at: p.updatedAt?.toISOString() ?? null,
        })),
        hasPaidPayment,
        latestPaidPayment: latestPaidPayment ? {
          id: latestPaidPayment.id,
          plan_id: latestPaidPayment.planId,
          amount: latestPaidPayment.amount,
          display_amount: latestPaidPayment.displayAmount,
          currency: latestPaidPayment.currency,
          status: latestPaidPayment.status,
          payment_type: latestPaidPayment.paymentType,
          razorpay_payment_id: latestPaidPayment.razorpayPaymentId,
          razorpay_subscription_id: latestPaidPayment.razorpaySubscriptionId,
          created_at: latestPaidPayment.createdAt?.toISOString() ?? null,
          updated_at: latestPaidPayment.updatedAt?.toISOString() ?? null,
        } : null,
      })
    }

    if (req.method === 'PATCH') {
      const { user_id, ...updates } = req.body as Record<string, unknown>
      if (!user_id) return res.status(400).json({ error: 'user_id required' })

      const existing = await d.select().from(profiles).where(eq(profiles.id, user_id as string))
      const dbUpdates: Record<string, unknown> = { updatedAt: new Date() }
      if ('plan' in updates) dbUpdates.plan = updates.plan
      if ('plan_id' in updates) dbUpdates.planId = updates.plan_id
      if ('subscription_id' in updates) dbUpdates.subscriptionId = updates.subscription_id
      if ('subscription_status' in updates) dbUpdates.subscriptionStatus = updates.subscription_status
      if ('renewal_date' in updates) dbUpdates.renewalDate = updates.renewal_date ? new Date(updates.renewal_date as string) : null

      if (existing.length > 0) {
        await d.update(profiles).set(dbUpdates).where(eq(profiles.id, user_id as string))
      } else {
        await d.insert(profiles).values({ id: user_id as string, ...dbUpdates })
      }
      return res.json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[profile]', msg)
    return res.status(500).json({ error: 'DB error', detail: msg })
  }
}
