import type { VercelRequest, VercelResponse } from '@vercel/node'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq } from 'drizzle-orm'
import { conversions } from '../../src/db/schema'

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
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })
  const id = req.query.id as string
  const { status, output_url, r2_key, expires_at } = req.body as Record<string, unknown>
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const d = drizzle(pool)
  try {
    const [row] = await d.update(conversions).set({
      status: status as string,
      outputUrl: (output_url as string) ?? null,
      r2Key: (r2_key as string) ?? null,
      expiresAt: expires_at ? new Date(expires_at as string) : null,
      updatedAt: new Date(),
    }).where(eq(conversions.id, id)).returning()
    if (!row) return res.status(404).json({ error: 'Not found' })
    return res.json(toSnake(row))
  } catch (err) {
    console.error('[conversions/patch]', err)
    return res.status(500).json({ error: 'DB error' })
  } finally {
    await pool.end()
  }
}
