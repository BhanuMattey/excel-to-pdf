import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth'
import { uploadToR2, getPresignedUrl, deleteFromR2 } from './r2'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { conversions } from '../src/db/schema'
import { lt, eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')

const app = express()
const PORT = process.env.PORT || process.env.AUTH_PORT || 3001

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.VITE_APP_URL || 'http://localhost:3000',
  // www subdomain must be explicitly allowed — browsers send preflight from
  // the exact origin and a www→non-www redirect breaks the preflight check
  process.env.VITE_APP_URL ? process.env.VITE_APP_URL.replace('://', '://www.') : null,
].filter(Boolean) as string[]

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))

// better-auth must handle raw body — do NOT put express.json() before it
app.all('/api/auth/*', toNodeHandler(auth))

app.use(express.json())

// ─── DB (used by cleanup worker) ─────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const db = drizzle(pool)

// ─── R2 upload endpoint ───────────────────────────────────────────────────────
// Browser sends the converted file blob here after conversion. We upload to R2
// and return a presigned download URL + the R2 key (saved in DB for deletion).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

app.post('/api/r2/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const ext = req.file.originalname.split('.').pop() ?? 'xlsx'
    const key = `conversions/${randomUUID()}.${ext}`
    const contentType = req.file.mimetype || 'application/octet-stream'

    await uploadToR2(key, req.file.buffer, contentType)
    const url = await getPresignedUrl(key)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    res.json({ key, url, expiresAt })
  } catch (err) {
    console.error('[r2/upload]', err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// ─── R2 presign endpoint (refresh a download URL for an existing key) ─────────
app.get('/api/r2/presign', async (req, res) => {
  const key = req.query.key as string
  if (!key) {
    res.status(400).json({ error: 'key is required' })
    return
  }
  try {
    const url = await getPresignedUrl(key)
    res.json({ url })
  } catch (err) {
    console.error('[r2/presign]', err)
    res.status(500).json({ error: 'Failed to generate URL' })
  }
})

// ─── Conversion CRUD ─────────────────────────────────────────────────────────

// Normalize a DB row (camelCase Drizzle keys) to the snake_case shape the client expects
function toSnake(row: typeof conversions.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    file_name: row.fileName,
    status: row.status,
    r2_key: row.r2Key,
    output_url: row.outputUrl,
    file_size: row.fileSize,
    expires_at: row.expiresAt?.toISOString() ?? null,
    created_at: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

app.post('/api/conversions', async (req, res) => {
  try {
    const { user_id, file_name, file_size, status } = req.body
    if (!file_name) { res.status(400).json({ error: 'file_name required' }); return }
    const id = randomUUID()
    const [row] = await db.insert(conversions).values({
      id,
      userId: user_id ?? null,
      fileName: file_name,
      fileSize: file_size ?? null,
      status: status ?? 'processing',
    }).returning()
    res.json(toSnake(row))
  } catch (err) {
    console.error('[conversions/create]', err)
    res.status(500).json({ error: 'Failed to create conversion' })
  }
})

app.patch('/api/conversions/:id', async (req, res) => {
  try {
    const { status, output_url, r2_key, expires_at } = req.body
    const [row] = await db.update(conversions).set({
      status,
      outputUrl: output_url ?? null,
      r2Key: r2_key ?? null,
      expiresAt: expires_at ? new Date(expires_at) : null,
      updatedAt: new Date(),
    }).where(eq(conversions.id, req.params.id)).returning()
    if (!row) { res.status(404).json({ error: 'Not found' }); return }
    res.json(toSnake(row))
  } catch (err) {
    console.error('[conversions/update]', err)
    res.status(500).json({ error: 'Failed to update conversion' })
  }
})

app.get('/api/conversions/count', async (req, res) => {
  try {
    const userId = req.query.user_id as string
    if (!userId) { res.status(400).json({ error: 'user_id required' }); return }
    const rows = await db.select({ id: conversions.id }).from(conversions)
      .where(eq(conversions.userId, userId))
    res.json({ count: rows.length })
  } catch (err) {
    console.error('[conversions/count]', err)
    res.status(500).json({ error: 'Failed to count conversions' })
  }
})

app.get('/api/conversions', async (req, res) => {
  try {
    const userId = req.query.user_id as string
    if (!userId) { res.status(400).json({ error: 'user_id required' }); return }
    const rows = await db.select().from(conversions)
      .where(eq(conversions.userId, userId))
      .orderBy(desc(conversions.createdAt))
    res.json(rows.map(toSnake))
  } catch (err) {
    console.error('[conversions/list]', err)
    res.status(500).json({ error: 'Failed to fetch conversions' })
  }
})

// ─── Cleanup worker ───────────────────────────────────────────────────────────
// Runs every hour. Deletes R2 objects whose 24h window has passed, then nulls
// r2Key + outputUrl in DB so the history row stays but the file is gone.
async function cleanupExpiredFiles() {
  try {
    const now = new Date()
    const expired = await db
      .select({ id: conversions.id, r2Key: conversions.r2Key })
      .from(conversions)
      .where(lt(conversions.expiresAt, now))
      .then(rows => rows.filter(r => r.r2Key))

    if (!expired.length) return

    console.log(`[cleanup] Removing ${expired.length} expired R2 file(s)`)

    for (const row of expired) {
      await deleteFromR2(row.r2Key!)
      await db
        .update(conversions)
        .set({ r2Key: null, outputUrl: null })
        .where(lt(conversions.expiresAt, now))
    }
  } catch (err) {
    console.error('[cleanup] Error:', err)
  }
}

cleanupExpiredFiles()
setInterval(cleanupExpiredFiles, 60 * 60 * 1000)

// Serve the Vite production build and handle SPA client-side routing.
// In dev this is a no-op because dist/ won't exist; Vite's dev server handles the frontend.
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  // All non-API routes fall through to index.html so React Router works
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
