import { pgTable, pgPolicy, text, integer, bigint, timestamp, doublePrecision } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { authenticatedRole, authUid } from 'drizzle-orm/neon'

export const conversions = pgTable('conversions', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  fileName: text('file_name').notNull(),
  status: text('status').notNull().default('processing'),
  r2Key: text('r2_key'),
  outputUrl: text('output_url'),
  fileSize: bigint('file_size', { mode: 'number' }),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  pgPolicy('conversions_user_policy', {
    as: 'permissive',
    to: authenticatedRole,
    using: sql`${t.userId} = ${authUid()}`,
  }),
]).enableRLS()

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  plan: text('plan').default('free'),
  conversionCount: integer('conversion_count').default(0),
  subscriptionId: text('subscription_id'),
  subscriptionStatus: text('subscription_status'),
  planId: text('plan_id'),
  renewalDate: timestamp('renewal_date'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  pgPolicy('profiles_user_policy', {
    as: 'permissive',
    to: authenticatedRole,
    using: sql`${t.id} = ${authUid()}`,
  }),
]).enableRLS()

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  userEmail: text('user_email').notNull(),
  planId: text('plan_id').notNull(),
  amount: integer('amount').notNull(),
  displayAmount: doublePrecision('display_amount'),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('created'),
  paymentType: text('payment_type').notNull().default('one_time'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),
  razorpaySubscriptionId: text('razorpay_subscription_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  pgPolicy('payments_user_policy', {
    as: 'permissive',
    to: authenticatedRole,
    using: sql`${t.userId} = ${authUid()}`,
  }),
]).enableRLS()

export type Conversion = typeof conversions.$inferSelect
export type NewConversion = typeof conversions.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type Payment = typeof payments.$inferSelect

export const conversionsRelations = relations(conversions, ({ one }) => ({
  profile: one(profiles, { fields: [conversions.userId], references: [profiles.id] }),
}))
