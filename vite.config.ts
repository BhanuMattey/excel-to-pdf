import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
  pro_monthly_INR: 49900,  // ₹499
  pro_yearly_INR:  359900, // ₹3,599
}

// Human-readable display amounts (not x100)
const PLAN_DISPLAY_AMOUNTS: Record<string, number> = {
  pro_monthly_INR: 499,
  pro_yearly_INR:  3599,
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

// Dev-only plugin: mounts local API helpers inside Vite's server.
function localApiPlugin() {
  return {
    name: 'local-api-dev',
    configureServer(server: {
      middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void }
    }) {
      const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''

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
                const { uploadToR2, getPresignedUrl } = await import('./src/server/r2')
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
            const { getPresignedUrl } = await import('./src/server/r2')
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
            const { uploadToR2, deleteFromR2 } = await import('./src/server/r2')
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
        if (url === '/api/contact' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { sendContactEmails } = await import('./src/server/contact-email')
            const result = await sendContactEmails(JSON.parse(await readBody(req)))
            if (!result.ok) {
              res.statusCode = result.status
              res.end(JSON.stringify({ error: result.error }))
              return
            }
            res.end(JSON.stringify({ success: true }))
          } catch (err) {
            console.error('[contact]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to send message' }))
          }
          return
        }

        if (url.startsWith('/api/conversions')) {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { drizzle } = await import('drizzle-orm/node-postgres')
            const { Pool } = await import('pg')
            const { conversions } = await import('./src/db/schema')
            const { eq, desc } = await import('drizzle-orm')
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
            const db = drizzle(pool)
            const toSnake = (row: typeof conversions.$inferSelect) => ({
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

            if (req.method === 'POST' && url === '/api/conversions') {
              const body = JSON.parse(await readBody(req))
              if (!body.user_id || !body.file_name) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'user_id and file_name are required' }))
                await pool.end()
                return
              }
              const [row] = await db.insert(conversions).values({
                id: randomUUID(),
                userId: body.user_id,
                fileName: body.file_name,
                fileSize: body.file_size ?? null,
                status: body.status ?? 'processing',
              }).returning()
              res.end(JSON.stringify(toSnake(row)))
              await pool.end()
              return
            }

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
              if (!row) {
                res.statusCode = 404
                res.end(JSON.stringify({ error: 'Conversion not found' }))
              } else {
                res.end(JSON.stringify(toSnake(row)))
              }
              await pool.end()
              return
            }

            if (req.method === 'GET' && url.startsWith('/api/conversions/count')) {
              const userId = new URL(url, 'http://localhost').searchParams.get('user_id') ?? ''
              if (!userId) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'user_id is required' }))
                await pool.end()
                return
              }
              const rows = await db.select({ id: conversions.id }).from(conversions).where(eq(conversions.userId, userId))
              res.end(JSON.stringify({ count: rows.length }))
              await pool.end()
              return
            }

            if (req.method === 'GET') {
              const userId = new URL(url, 'http://localhost').searchParams.get('user_id') ?? ''
              if (!userId) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'user_id is required' }))
                await pool.end()
                return
              }
              const rows = await db.select().from(conversions).where(eq(conversions.userId, userId)).orderBy(desc(conversions.createdAt))
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
            res.end(JSON.stringify({ error: 'Failed to process conversions request' }))
          }
          return
        }

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

            if (!body.user_id) {
              res.statusCode = 400
              res.end(JSON.stringify({ detail: 'Missing user_id' }))
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
              userId: body.user_id ?? null,
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
            const existing = await db.select().from(profiles).where(eq(profiles.id, body.user_id))
            const profileUpdate = {
              plan: basePlan,
              planId,
              subscriptionId: body.razorpay_subscription_id ?? null,
              subscriptionStatus: 'active',
              renewalDate,
              updatedAt: new Date(),
            }
            if (existing.length > 0) {
              await db.update(profiles).set(profileUpdate).where(eq(profiles.id, body.user_id))
            } else {
              await db.insert(profiles).values({ id: body.user_id, ...profileUpdate })
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
            const userId = new URL(url, 'http://localhost').searchParams.get('user_id') ?? ''
            if (!userId) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'user_id is required' }))
              return
            }

            const { drizzle } = await import('drizzle-orm/node-postgres')
            const { Pool } = await import('pg')
            const { profiles, payments } = await import('./src/db/schema')
            const { eq, desc } = await import('drizzle-orm')
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
            const db = drizzle(pool)

            const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId))
            const paymentHistory = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt))
            const paidPayments = paymentHistory.filter((payment) => payment.status === 'paid')
            const latestPaidPayment = paidPayments[0] ?? null

            if (latestPaidPayment && profile && profile.plan !== 'pro') {
              await db.update(profiles).set({
                plan: 'pro',
                planId: latestPaidPayment.planId ?? profile.planId,
                subscriptionId: latestPaidPayment.razorpaySubscriptionId ?? profile.subscriptionId,
                subscriptionStatus: profile.subscriptionStatus ?? 'active',
                updatedAt: new Date(),
              }).where(eq(profiles.id, userId))
            }

            const paymentToSnake = (row: typeof payments.$inferSelect) => ({
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
            })

            res.end(JSON.stringify({
              profile: {
                id: profile?.id ?? userId,
                plan: profile?.plan === 'pro' ? 'pro' : 'free',
                planId: profile?.planId ?? null,
                subscriptionId: profile?.subscriptionId ?? null,
                subscriptionStatus: profile?.subscriptionStatus ?? null,
                renewalDate: profile?.renewalDate?.toISOString() ?? null,
              },
              hasPaidPayment: paidPayments.length > 0,
              latestPaidPayment: latestPaidPayment ? paymentToSnake(latestPaidPayment) : null,
              payments: paymentHistory.map(paymentToSnake),
            }))
            await pool.end()
          } catch (err) {
            console.error('[profile]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Failed to fetch profile' }))
          }
          return
        }

        if (url === '/api/payment/cancel-subscription' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const body = JSON.parse(await readBody(req)) as { subscription_id: string; user_id?: string; user_email?: string }
            if (!body.user_id) {
              res.statusCode = 400
              res.end(JSON.stringify({ detail: 'Missing user_id' }))
              return
            }
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
              .where(eq(profiles.id, body.user_id))
            await pool.end()

            res.end(JSON.stringify({ success: true }))
          } catch (err) {
            console.error('[payment/cancel-subscription]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ detail: 'Cancellation failed' }))
          }
          return
        }

        // ── Python backend proxy (avoids mixed-content on dev) ───────────────
        if (url.startsWith('/api/python/')) {
          try {
            const { request: httpRequest } = await import('http')
            const PYTHON_HOST = process.env.PYTHON_API_URL?.replace(/^https?:\/\//, '').split(':')[0] || '153.75.250.227'
            const PYTHON_PORT = Number(process.env.PYTHON_API_URL?.split(':')[2] ?? 8000)
            // /api/python/convertexcel → /api/convertexcel (Python expects /api/* routes)
            const targetPath = url.replace('/api/python', '/api')

            await new Promise<void>((resolve, reject) => {
              const proxyReq = httpRequest({
                host: PYTHON_HOST,
                port: PYTHON_PORT,
                path: targetPath,
                method: req.method,
                headers: (() => {
                  const h: Record<string, string | string[]> = {}
                  for (const [k, v] of Object.entries(req.headers)) {
                    if (k.toLowerCase() === 'host') continue
                    if (v != null) h[k] = v
                  }
                  return h
                })(),
              }, (proxyRes) => {
                const skip = new Set(['transfer-encoding', 'connection', 'keep-alive'])
                for (const [k, v] of Object.entries(proxyRes.headers)) {
                  if (!skip.has(k.toLowerCase()) && v != null) res.setHeader(k, v as string)
                }
                res.statusCode = proxyRes.statusCode ?? 200
                proxyRes.pipe(res)
                proxyRes.on('end', resolve)
              })
              proxyReq.on('error', reject)
              req.pipe(proxyReq)
            })
          } catch (err) {
            console.error('[python-proxy]', err)
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Python backend unreachable' }))
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
            const { getPresignedUrl } = await import('./src/server/r2')
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
      // /api/r2 is handled by localApiPlugin above (same port).
      // Everything else under /api goes to the Python backend.
      '/api': {
        target: 'http://153.75.250.227:8000',
        changeOrigin: true,
        bypass(req) {
          const url = req.url || ''
          // Let the local plugin handle these — don't proxy them to Python backend
          if (
            url.startsWith('/api/r2') ||
            url.startsWith('/api/payment') ||
            url.startsWith('/api/contact') ||
            url.startsWith('/api/python')
          ) return url
          return null
        },
      },
    },
  },
})


