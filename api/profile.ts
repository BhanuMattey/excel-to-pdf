import type { VercelRequest, VercelResponse } from '@vercel/node'
import { desc, eq } from 'drizzle-orm'
import { payments, profiles } from '../src/db/schema.js'
import { createDb } from '../src/server/db.js'
import { getSessionUser } from './_auth.js'

function paymentToSnake(row: typeof payments.$inferSelect) {
  return {
    id: row.id,
    plan_id: row.planId,
    amount: row.amount,
    display_amount: row.displayAmount,
    currency: row.currency,
    status: row.status,
    payment_type: row.paymentType,
    razorpay_payment_id: row.razorpayPaymentId,
    razorpay_subscription_id: row.razorpaySubscriptionId,
    created_at: row.createdAt?.toISOString() ?? null,
    updated_at: row.updatedAt?.toISOString() ?? null,
  }
}

function profileToCamel(row: typeof profiles.$inferSelect | null, userId: string) {
  return {
    id: row?.id ?? userId,
    plan: row?.plan === 'pro' ? 'pro' : 'free',
    planId: row?.planId ?? null,
    subscriptionId: row?.subscriptionId ?? null,
    subscriptionStatus: row?.subscriptionStatus ?? null,
    renewalDate: row?.renewalDate?.toISOString() ?? null,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Verify session — userId must come from the authenticated session, not the query string.
  const sessionUser = await getSessionUser(req)
  if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })

  const userId = sessionUser.id

  const d = createDb()
  try {
    const [profile] = await d.select().from(profiles).where(eq(profiles.id, userId))
    const paymentHistory = await d.select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))

    const paidPayments = paymentHistory.filter((payment) => payment.status === 'paid')
    const latestPaidPayment = paidPayments[0] ?? null

    if (latestPaidPayment && profile && profile.plan !== 'pro') {
      await d.update(profiles).set({
        plan: 'pro',
        planId: latestPaidPayment.planId ?? profile.planId,
        subscriptionId: latestPaidPayment.razorpaySubscriptionId ?? profile.subscriptionId,
        subscriptionStatus: profile.subscriptionStatus ?? 'active',
        updatedAt: new Date(),
      }).where(eq(profiles.id, userId))
    }

    return res.json({
      profile: profileToCamel(profile ?? null, userId),
      hasPaidPayment: paidPayments.length > 0,
      latestPaidPayment: latestPaidPayment ? paymentToSnake(latestPaidPayment) : null,
      payments: paymentHistory.map(paymentToSnake),
    })
  } catch (err) {
    console.error('[profile]', err)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
}
