import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { conversions } from '../../src/db/schema'
import { createPool, createDb } from '../_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pool = createPool()
  const d = createDb(pool)
  const id = req.query.id as string
  try {
    if (req.method === 'PATCH') {
      const { status, output_url, r2_key, expires_at } = req.body as Record<string, unknown>
      const [row] = await d.update(conversions)
        .set({
          status: status as string,
          outputUrl: (output_url as string) ?? null,
          r2Key: (r2_key as string) ?? null,
          expiresAt: expires_at ? new Date(expires_at as string) : null,
          updatedAt: new Date(),
        })
        .where(eq(conversions.id, id))
        .returning()
      if (!row) return res.status(404).json({ error: 'Not found' })
      return res.json({
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
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[conversions/id]', msg)
    return res.status(500).json({ error: 'DB error', detail: msg })
  } finally {
    await pool.end()
  }
}
