import { pgTable, text, integer, bigint, timestamp, doublePrecision } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// App-specific tables only.
// Auth identities are managed by Neon Auth.

export const conversions = pgTable('conversions', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  fileName: text('file_name').notNull(),
  status: text('status').notNull().default('processing'),
  // Cloudflare R2 storage
  r2Key: text('r2_key'),           // object key in R2 bucket
  outputUrl: text('output_url'),   // presigned download URL (regenerated on demand)
  fileSize: bigint('file_size', { mode: 'number' }), // original PDF size in bytes
  expiresAt: timestamp('expires_at'), // 24h after creation — file deleted from R2 after this
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  plan: text('plan').default('free'),
  conversionCount: integer('conversion_count').default(0),
  // Razorpay subscription tracking
  subscriptionId: text('subscription_id'),
  subscriptionStatus: text('subscription_status'), // created | authenticated | active | paused | cancelled | completed | expired
  planId: text('plan_id'),         // e.g. pro_monthly_INR
  renewalDate: timestamp('renewal_date'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type Conversion = typeof conversions.$inferSelect
export type NewConversion = typeof conversions.$inferInsert
export type Profile = typeof profiles.$inferSelect

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),              // razorpay order_id or subscription_id
  userId: text('user_id'),
  userEmail: text('user_email').notNull(),
  planId: text('plan_id').notNull(),
  amount: integer('amount').notNull(),       // paise/cents (Razorpay unit)
  displayAmount: doublePrecision('display_amount'), // human-readable amount (e.g. 500.00 for ₹500)
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('created'), // created | paid | failed
  paymentType: text('payment_type').notNull().default('one_time'), // one_time | subscription
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),
  razorpaySubscriptionId: text('razorpay_subscription_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type Payment = typeof payments.$inferSelect

export const conversionsRelations = relations(conversions, ({ one }) => ({
  profile: one(profiles, { fields: [conversions.userId], references: [profiles.id] }),
}))
