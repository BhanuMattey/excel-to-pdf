import type { VercelRequest, VercelResponse } from '@vercel/node'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq, desc } from 'drizzle-orm'
import { profiles, payments } from '../../src/db/schema'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const email = req.query.email as string
  if (!email) return res.status(400).json({ error: 'email required' })

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const d = drizzle(pool)
  try {
    const [profile] = await d.select().from(profiles).where(eq(profiles.id, email))
    const paymentHistory = await d.select().from(payments)
      .where(eq(payments.userEmail, email))
      .orderBy(desc(payments.createdAt))

    const paidPayments = paymentHistory.filter(p => p.status === 'paid')
    const hasPaidPayment = paidPayments.length > 0
    const latestPaidPayment = paidPayments[0] ?? null

    if (hasPaidPayment && profile && profile.plan !== 'pro') {
      await d.update(profiles).set({
        plan: 'pro',
        planId: latestPaidPayment?.planId ?? profile.planId,
        subscriptionId: latestPaidPayment?.razorpaySubscriptionId ?? profile.subscriptionId,
        subscriptionStatus: profile.subscriptionStatus ?? 'active',
        updatedAt: new Date(),
      }).where(eq(profiles.id, email))
    }

    return res.json({
      profile: profile ?? { id: email, plan: 'free', planId: null, subscriptionId: null, subscriptionStatus: null, renewalDate: null },
      hasPaidPayment,
      latestPaidPayment: latestPaidPayment ? {
        plan_id: latestPaidPayment.planId,
        status: latestPaidPayment.status,
        display_amount: latestPaidPayment.displayAmount,
        amount: latestPaidPayment.amount,
        currency: latestPaidPayment.currency,
      } : null,
      payments: paymentHistory.map(p => ({
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
    })
  } catch (err) {
    console.error('[profile]', err)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  } finally {
    await pool.end()
  }
}
