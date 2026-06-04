import type { VercelRequest, VercelResponse } from '@vercel/node'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { conversions } from '../../src/db/schema'

function db() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  return { db: drizzle(pool), pool }
}

type DbRow = typeof conversions.$inferSelect
function toSnake(row: DbRow) {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { db: d, pool } = db()
  try {
    // POST /api/conversions — create
    if (req.method === 'POST') {
      const { user_id, file_name, file_size, status } = req.body as Record<string, unknown>
      if (!file_name) return res.status(400).json({ error: 'file_name required' })
      const [row] = await d.insert(conversions).values({
        id: randomUUID(),
        userId: (user_id as string) ?? null,
        fileName: file_name as string,
        fileSize: (file_size as number) ?? null,
        status: (status as string) ?? 'processing',
      }).returning()
      return res.json(toSnake(row))
    }

    // GET /api/conversions?user_id=...
    if (req.method === 'GET') {
      const userId = req.query.user_id as string
      if (!userId) return res.status(400).json({ error: 'user_id required' })
      const rows = await d.select().from(conversions)
        .where(eq(conversions.userId, userId))
        .orderBy(desc(conversions.createdAt))
      return res.json(rows.map(toSnake))
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[conversions]', err)
    return res.status(500).json({ error: 'DB error' })
  } finally {
    await pool.end()
  }
}
