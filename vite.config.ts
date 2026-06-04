import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { toNodeHandler } from 'better-auth/node'
import multer from 'multer'
import { randomUUID, createHmac } from 'crypto'
import type { IncomingMessage, ServerResponse } from 'http'
import { config as loadDotenv } from 'dotenv'

// Load .env so server-side vars (R2_*, DATABASE_URL, etc.) are available
// in the Vite plugin middleware — Vite only auto-exposes VITE_* to the browser.
loadDotenv({ path: '.env' })
loadDotenv({ path: '.env.local', override: true })

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID     || process.env.VITE_RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

function validateRazorpayCredentials() {
  const missing = [
    !RAZORPAY_KEY_ID && 'RAZORPAY_KEY_ID',
    !RAZORPAY_KEY_SECRET && 'RAZORPAY_KEY_SECRET',
  ].filter(Boolean)

  if (missing.length) {
    return `Razorpay credentials not configured on server: missing ${missing.join(', ')}`
  }

  if (!/^rzp_(test|live)_/.test(RAZORPAY_KEY_ID)) {
    return 'Invalid Razorpay Key ID. It must start with rzp_test_ or rzp_live_.'
  }

  if (RAZORPAY_KEY_SECRET.startsWith('rzp_')) {
    return 'Invalid Razorpay Key Secret. You pasted a Key ID into RAZORPAY_KEY_SECRET; use the matching secret from Razorpay Dashboard.'
  }

  return null
}

// plan_id format: pro_{cycle}_INR. INR amounts are in paise.
const PLAN_AMOUNTS: Record<string, number> = {
  pro_monthly_INR: 50000,  // ₹500
  pro_yearly_INR:  360000, // ₹3,600
}

// Human-readable display amounts (not x100)
const PLAN_DISPLAY_AMOUNTS: Record<string, number> = {
  pro_monthly_INR: 500,
  pro_yearly_INR:  3600,
}

const PLAN_CURRENCIES: Record<string, string> = {
  pro_monthly_INR: 'INR',
  pro_yearly_INR:  'INR',
}

// Billing period for Razorpay Subscription plan
const PLAN_PERIOD: Record<string, string> = {
  pro_monthly_INR: 'monthly',
  pro_yearly_INR:  'yearly',
}

const PLAN_NAMES: Record<string, string> = {
  pro_monthly_INR: 'Professional Monthly (INR)',
  pro_yearly_INR:  'Professional Yearly (INR)',
}

// Cache of Razorpay plan IDs we've created (plan_id → razorpay_plan_id)
const rzpPlanIdCache: Record<string, string> = {}

// Get or create a Razorpay Plan for subscription billing
async function getOrCreateRazorpayPlan(planId: string): Promise<string> {
  if (rzpPlanIdCache[planId]) return rzpPlanIdCache[planId]

  const amount = PLAN_AMOUNTS[planId]
  const currency = PLAN_CURRENCIES[planId]
  const period = PLAN_PERIOD[planId]

  // Check if we already have a plan stored in env
  const envKey = `RAZORPAY_PLAN_ID_${planId.toUpperCase()}`
  const envPlanId = process.env[envKey]
  if (envPlanId) {
    rzpPlanIdCache[planId] = envPlanId
    return envPlanId
  }

  // Create a new Razorpay plan
  const res = await fetch('https://api.razorpay.com/v1/plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      period: period === 'yearly' ? 'yearly' : 'monthly',
      interval: 1,
      item: {
        name: PLAN_NAMES[planId],
        amount,
        currency,
        description: PLAN_NAMES[planId],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json() as { error?: { description?: string } }
    throw new Error(err?.error?.description || 'Failed to create Razorpay plan')
  }

  const plan = await res.json() as { id: string }
  rzpPlanIdCache[planId] = plan.id
  console.log(`[razorpay] Created plan ${planId} → ${plan.id} (set ${envKey}=${plan.id} in .env to cache)`)
  return plan.id
}

// Read full request body as a string
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Dev-only plugin: mounts better-auth + R2 endpoints inside Vite's server.
// Both /api/auth/* and /api/r2/* are handled on port 3000 — no second process.
function localApiPlugin() {
  return {
    name: 'local-api-dev',
    configureServer(server: {
      middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void }
    }) {
      const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''

        // ── better-auth ──────────────────────────────────────────────────────
        if (url.startsWith('/api/auth')) {
          try {
            const { auth } = await import('./server/auth')
            return toNodeHandler(auth)(req as never, res as never)
          } catch (err) {
            console.error('[auth-plugin]', err)
            return next()
          }
        }

        // ── R2 upload ─────────────────────────────────────────────────────────
        if (url.startsWith('/api/r2/upload') && req.method === 'POST') {
          return new Promise<void>((resolve) => {
            upload.single('file')(req as never, res as never, async () => {
              try {
                const file = (req as never as { file?: Express.Multer.File }).file
                if (!file) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: 'No file provided' }))
                  return resolve()
                }
                const { uploadToR2, getPresignedUrl } = await import('./server/r2')
                const ext = file.originalname.split('.').pop() ?? 'xlsx'
                const key = `conversions/${randomUUID()}.${ext}`
                console.log(`[r2/upload] uploading ${file.originalname} → ${key} (${file.size} bytes)`)
                await uploadToR2(key, file.buffer, file.mimetype || 'application/octet-stream')
                const fileUrl = await getPresignedUrl(key)
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
                console.log(`[r2/upload] success → key=${key}`)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ key, url: fileUrl, expiresAt }))
              } catch (err) {
                console.error('[r2/upload]', err)
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Upload failed' }))
              }
              resolve()
            })
          })
        }

        // ── R2 presign (refresh download URL) ────────────────────────────────
        if (url.startsWith('/api/r2/presign') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const key = new URL(url, 'http://localhost').searchParams.get('key') ?? ''
            if (!key) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing key param' }))
              return
            }
            const { getPresignedUrl } = await import('./server/r2')
            const presignedUrl = await getPresignedUrl(key)
            res.end(JSON.stringify({ url: presignedUrl }))
          } catch (err) {
            console.error('[r2/presign]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Presign failed' }))
          }
          return
        }

        // ── R2 health check ───────────────────────────────────────────────────
        if (url === '/api/r2/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { uploadToR2, deleteFromR2 } = await import('./server/r2')
            const testKey = `health-check/${randomUUID()}.txt`
            await uploadToR2(testKey, Buffer.from('ok'), 'text/plain')
            await deleteFromR2(testKey)
            res.end(JSON.stringify({ status: 'ok', bucket: process.env.R2_BUCKET_NAME }))
          } catch (err) {
            console.error('[r2/health]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ status: 'error', error: err instanceof Error ? err.message : String(err) }))
          }
          return
        }

        // ── Conversion CRUD ───────────────────────────────────────────────────
        if (url.startsWith('/api/conversions')) {
          try {
            const { drizzle } = await import('drizzle-orm/node-postgres')
            const { Pool } = await import('pg')
            const { conversions } = await import('./src/db/schema')
            const { eq, desc } = await import('drizzle-orm')

            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
            const db = drizzle(pool)

            // Map Drizzle camelCase keys → snake_case for the client
            type DbRow = typeof conversions.$inferSelect
            const toSnake = (row: DbRow) => ({
              id: row.id,
              user_id: row.userId,
              file_name: row.fileName,
              status: row.status,
              r2_key: row.r2Key,
              output_url: row.outputUrl,
              file_size: row.fileSize,
              expires_at: row.expiresAt?.toISOString() ?? null,
              created_at: row.createdAt?.toISOString() ?? null,
              updated_at: row.updatedAt?.toISOString() ?? null,
            })

            res.setHeader('Content-Type', 'application/json')

            // POST /api/conversions — create
            if (req.method === 'POST' && url === '/api/conversions') {
              const body = JSON.parse(await readBody(req))
              const id = randomUUID()
              const [row] = await db.insert(conversions).values({
                id,
                userId: body.user_id ?? null,
                fileName: body.file_name,
                fileSize: body.file_size ?? null,
                status: body.status ?? 'processing',
              }).returning()
              res.end(JSON.stringify(toSnake(row)))
              await pool.end()
              return
            }

            // PATCH /api/conversions/:id — update
            const patchMatch = url.match(/^\/api\/conversions\/([^/?]+)$/)
            if (req.method === 'PATCH' && patchMatch) {
              const body = JSON.parse(await readBody(req))
              const [row] = await db.update(conversions).set({
                status: body.status,
                outputUrl: body.output_url ?? null,
                r2Key: body.r2_key ?? null,
                expiresAt: body.expires_at ? new Date(body.expires_at) : null,
                updatedAt: new Date(),
              }).where(eq(conversions.id, patchMatch[1])).returning()
              res.end(JSON.stringify(row ? toSnake(row) : {}))
              await pool.end()
              return
            }

            // GET /api/conversions/count
            if (req.method === 'GET' && url.startsWith('/api/conversions/count')) {
              const userId = new URL(url, 'http://localhost').searchParams.get('user_id') ?? ''
              const rows = await db.select({ id: conversions.id }).from(conversions)
                .where(eq(conversions.userId, userId))
              res.end(JSON.stringify({ count: rows.length }))
              await pool.end()
              return
            }

            // GET /api/conversions?user_id=...
            if (req.method === 'GET') {
              const userId = new URL(url, 'http://localhost').searchParams.get('user_id') ?? ''
              const rows = await db.select().from(conversions)
                .where(eq(conversions.userId, userId))
                .orderBy(desc(conversions.createdAt))
              res.end(JSON.stringify(rows.map(toSnake)))
              await pool.end()
              return
            }

            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            await pool.end()
          } catch (err) {
            console.error('[conversions]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'DB error' }))
          }
          return
        }

        // ── Payment: create Razorpay subscription ────────────────────────────
        if (url === '/api/payment/create-order' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const body = JSON.parse(await readBody(req))
            const planId: string = body.plan_id ?? ''
            const amount = PLAN_AMOUNTS[planId]
            if (!amount) {
              res.statusCode = 400
              res.end(JSON.stringify({ detail: `Unknown plan_id: ${planId}` }))
              return
            }
            const credentialError = validateRazorpayCredentials()
            if (credentialError) {
              res.statusCode = 500
              res.end(JSON.stringify({ detail: credentialError }))
              return
            }

            // Get or create Razorpay Plan (needed for subscriptions)
            let rzpPlanId: string
            try {
              rzpPlanId = await getOrCreateRazorpayPlan(planId)
            } catch (planErr) {
              console.error('[payment/create-order] plan creation failed, falling back to one-time order', planErr)
              rzpPlanId = ''
            }

            const { drizzle } = await import('drizzle-orm/node-postgres')
            const { Pool } = await import('pg')
            const { payments } = await import('./src/db/schema')
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
            const db = drizzle(pool)

            if (rzpPlanId) {
              // ── Razorpay Subscription ────────────────────────────────────────
              const rzpRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
                },
                body: JSON.stringify({
                  plan_id: rzpPlanId,
                  total_count: 12,        // max 12 cycles; user can cancel anytime
                  quantity: 1,
                  customer_notify: 1,     // Razorpay emails the customer
                  notify_info: {
                    notify_email: body.user_email ?? '',
                  },
                }),
              })

              if (!rzpRes.ok) {
                const err = await rzpRes.json() as { error?: { description?: string } }
                await pool.end()
                res.statusCode = 502
                res.end(JSON.stringify({ detail: err?.error?.description || 'Razorpay subscription creation failed' }))
                return
              }

              const sub = await rzpRes.json() as { id: string; status: string; short_url?: string }

              await db.insert(payments).values({
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
              await pool.end()

              res.end(JSON.stringify({
                success: true,
                type: 'subscription',
                order: {
                  subscription_id: sub.id,
                  key_id: RAZORPAY_KEY_ID,
                  amount,
                  currency: PLAN_CURRENCIES[planId] ?? 'INR',
                  plan_name: PLAN_NAMES[planId] ?? planId,
                },
              }))
            } else {
              // ── Fallback: one-time order ─────────────────────────────────────
              const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
                },
                body: JSON.stringify({ amount, currency: PLAN_CURRENCIES[planId] ?? 'INR', receipt: randomUUID() }),
              })

              if (!rzpRes.ok) {
                const err = await rzpRes.json() as { error?: { description?: string } }
                await pool.end()
                res.statusCode = 502
                res.end(JSON.stringify({ detail: err?.error?.description || 'Razorpay order creation failed' }))
                return
              }

              const order = await rzpRes.json() as { id: string; amount: number; currency: string }

              await db.insert(payments).values({
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
              await pool.end()

              res.end(JSON.stringify({
                success: true,
                type: 'order',
                order: {
                  order_id: order.id,
                  key_id: RAZORPAY_KEY_ID,
                  amount: order.amount,
                  currency: order.currency,
                  plan_name: PLAN_NAMES[planId] ?? planId,
                },
              }))
            }
          } catch (err) {
            console.error('[payment/create-order]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ detail: 'Order creation failed' }))
          }
          return
        }

        // ── Payment: verify signature ─────────────────────────────────────────
        if (url === '/api/payment/verify' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const body = JSON.parse(await readBody(req)) as {
              razorpay_order_id?: string
              razorpay_subscription_id?: string
              razorpay_payment_id: string
              razorpay_signature: string
              plan_id: string
              user_email: string
              user_id?: string
              payment_type?: string
            }

            // Verify HMAC: subscription uses subscription_id, order uses order_id
            const sigBase = body.razorpay_subscription_id
              ? `${body.razorpay_payment_id}|${body.razorpay_subscription_id}`
              : `${body.razorpay_order_id}|${body.razorpay_payment_id}`

            const expectedSig = createHmac('sha256', RAZORPAY_KEY_SECRET)
              .update(sigBase)
              .digest('hex')

            if (expectedSig !== body.razorpay_signature) {
              res.statusCode = 400
              res.end(JSON.stringify({ detail: 'Invalid payment signature' }))
              return
            }

            const { drizzle } = await import('drizzle-orm/node-postgres')
            const { Pool } = await import('pg')
            const { payments, profiles } = await import('./src/db/schema')
            const { eq } = await import('drizzle-orm')
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
            const db = drizzle(pool)

            const recordId = body.razorpay_subscription_id || body.razorpay_order_id || ''

            await db.update(payments).set({
              status: 'paid',
              razorpayPaymentId: body.razorpay_payment_id,
              razorpaySignature: body.razorpay_signature,
              updatedAt: new Date(),
            }).where(eq(payments.id, recordId))

            // Calculate next renewal date
            const planId = body.plan_id
            const isYearly = planId.includes('yearly')
            const renewalDate = new Date()
            if (isYearly) renewalDate.setFullYear(renewalDate.getFullYear() + 1)
            else renewalDate.setMonth(renewalDate.getMonth() + 1)

            // Upsert profile plan with subscription info
            const basePlan = planId.split('_')[0] // always 'pro'
            const existing = await db.select().from(profiles).where(eq(profiles.id, body.user_email))
            const profileUpdate = {
              plan: basePlan,
              planId,
              subscriptionId: body.razorpay_subscription_id ?? null,
              subscriptionStatus: 'active',
              renewalDate,
              updatedAt: new Date(),
            }
            if (existing.length > 0) {
              await db.update(profiles).set(profileUpdate).where(eq(profiles.id, body.user_email))
            } else {
              await db.insert(profiles).values({ id: body.user_email, ...profileUpdate })
            }
            await pool.end()

            res.end(JSON.stringify({ success: true, plan: basePlan, renewal_date: renewalDate.toISOString() }))
          } catch (err) {
            console.error('[payment/verify]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ detail: 'Payment verification failed' }))
          }
          return
        }

        // ── Profile: get plan/subscription status ────────────────────────────
        if (url.startsWith('/api/profile') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const email = new URL(url, 'http://localhost').searchParams.get('email') ?? ''
            if (!email) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'email required' }))
              return
            }
            const { drizzle } = await import('drizzle-orm/node-postgres')
            const { Pool } = await import('pg')
            const { profiles, payments } = await import('./src/db/schema')
            const { eq, desc } = await import('drizzle-orm')
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
            const db = drizzle(pool)

            const [profile] = await db.select().from(profiles).where(eq(profiles.id, email))
            const paymentHistory = await db.select().from(payments)
              .where(eq(payments.userEmail, email))
              .orderBy(desc(payments.createdAt))

            // Determine pro status from payments table directly
            const paidPayments = paymentHistory.filter(p => p.status === 'paid')
            const hasPaidPayment = paidPayments.length > 0
            const latestPaidPayment = paidPayments[0] ?? null

            // Auto-upgrade profile in DB if paid but profile not yet marked pro
            if (hasPaidPayment && profile && profile.plan !== 'pro') {
              try {
                await db.update(profiles).set({
                  plan: 'pro',
                  planId: latestPaidPayment?.planId ?? profile.planId,
                  subscriptionId: latestPaidPayment?.razorpaySubscriptionId ?? profile.subscriptionId,
                  subscriptionStatus: profile.subscriptionStatus ?? 'active',
                  updatedAt: new Date(),
                }).where(eq(profiles.id, email))
              } catch { /* non-fatal */ }
            }

            await pool.end()
            res.end(JSON.stringify({
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
            }))
          } catch (err) {
            console.error('[profile]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch profile' }))
          }
          return
        }

        // ── Payment: cancel subscription ──────────────────────────────────────
        if (url === '/api/payment/cancel-subscription' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const body = JSON.parse(await readBody(req)) as { subscription_id: string; user_email: string }
            const credentialError = validateRazorpayCredentials()
            if (credentialError) {
              res.statusCode = 500
              res.end(JSON.stringify({ detail: credentialError }))
              return
            }

            const rzpRes = await fetch(`https://api.razorpay.com/v1/subscriptions/${body.subscription_id}/cancel`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
              },
              body: JSON.stringify({ cancel_at_cycle_end: 1 }),
            })

            if (!rzpRes.ok) {
              const err = await rzpRes.json() as { error?: { description?: string } }
              res.statusCode = 502
              res.end(JSON.stringify({ detail: err?.error?.description || 'Cancellation failed' }))
              return
            }

            const { drizzle } = await import('drizzle-orm/node-postgres')
            const { Pool } = await import('pg')
            const { profiles } = await import('./src/db/schema')
            const { eq } = await import('drizzle-orm')
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
            const db = drizzle(pool)

            await db.update(profiles).set({ subscriptionStatus: 'cancelled', updatedAt: new Date() })
              .where(eq(profiles.id, body.user_email))
            await pool.end()

            res.end(JSON.stringify({ success: true }))
          } catch (err) {
            console.error('[payment/cancel-subscription]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ detail: 'Cancellation failed' }))
          }
          return
        }

        // ── R2 presign (refresh URL for existing key) ─────────────────────────
        if (url.startsWith('/api/r2/presign') && req.method === 'GET') {
          try {
            const key = new URL(url, 'http://localhost').searchParams.get('key')
            if (!key) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'key is required' }))
              return
            }
            const { getPresignedUrl } = await import('./server/r2')
            const fileUrl = await getPresignedUrl(key)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ url: fileUrl }))
          } catch (err) {
            console.error('[r2/presign]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to generate URL' }))
          }
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    port: 3000,
    proxy: {
      // /api/auth and /api/r2 are handled by localApiPlugin above (same port).
      // Everything else under /api goes to the Python backend.
      '/api': {
        target: 'http://153.75.250.227:8000',
        changeOrigin: true,
        bypass(req) {
          const url = req.url || ''
          // Let the local plugin handle these — don't proxy them to Python backend
          if (
            url.startsWith('/api/auth') ||
            url.startsWith('/api/r2') ||
            url.startsWith('/api/conversions') ||
            url.startsWith('/api/payment') ||
            url.startsWith('/api/profile')
          ) return url
          return null
        },
      },
    },
  },
})
