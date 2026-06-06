import { pgTable, text, integer, bigint, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

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
})

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  plan: text('plan').default('free'),
  conversionCount: integer('conversion_count').default(0),
  subscriptionId: text('subscription_id'),
  subscriptionStatus: text('subscription_status'),
  planId: text('plan_id'),
  renewalDate: timestamp('renewal_date'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

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
})

export type Conversion = typeof conversions.$inferSelect
export type NewConversion = typeof conversions.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type Payment = typeof payments.$inferSelect

export const conversionsRelations = relations(conversions, ({ one }) => ({
  profile: one(profiles, { fields: [conversions.userId], references: [profiles.id] }),
}))
