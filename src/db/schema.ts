import { pgTable, text, integer, bigint, timestamp, doublePrecision, pgPolicy, pgRole } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// App-specific tables only.
// Auth identities are managed by Neon Auth.

export const authenticatedRole = pgRole('authenticated').existing()

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
}, (table) => [
  pgPolicy('conversions_select_own', {
    for: 'select',
    to: authenticatedRole,
    using: sql`(select auth.user_id() = ${table.userId})`,
  }),
  pgPolicy('conversions_insert_own', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`(select auth.user_id() = ${table.userId})`,
  }),
  pgPolicy('conversions_update_own', {
    for: 'update',
    to: authenticatedRole,
    using: sql`(select auth.user_id() = ${table.userId})`,
    withCheck: sql`(select auth.user_id() = ${table.userId})`,
  }),
]).enableRLS()

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
}, (table) => [
  pgPolicy('profiles_select_own', {
    for: 'select',
    to: authenticatedRole,
    using: sql`(select auth.user_id() = ${table.id})`,
  }),
  pgPolicy('profiles_insert_own', {
    for: 'insert',
    to: authenticatedRole,
    withCheck: sql`(select auth.user_id() = ${table.id})`,
  }),
  pgPolicy('profiles_update_own', {
    for: 'update',
    to: authenticatedRole,
    using: sql`(select auth.user_id() = ${table.id})`,
    withCheck: sql`(select auth.user_id() = ${table.id})`,
  }),
]).enableRLS()

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
}, (table) => [
  pgPolicy('payments_select_own', {
    for: 'select',
    to: authenticatedRole,
    using: sql`(select auth.user_id() = ${table.userId})`,
  }),
]).enableRLS()

export type Payment = typeof payments.$inferSelect

export const conversionsRelations = relations(conversions, ({ one }) => ({
  profile: one(profiles, { fields: [conversions.userId], references: [profiles.id] }),
}))
