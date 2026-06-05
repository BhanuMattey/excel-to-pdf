import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { conversions } from '../src/db/schema.js'
import { createDb } from '../src/server/db.js'

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
    created_at: row.createdAt?.toISOString() ?? null,
    updated_at: row.updatedAt?.toISOString() ?? null,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const d = createDb()

  try {
    if (req.method === 'POST') {
      const body = req.body as { user_id?: string; file_name?: string; file_size?: number; status?: string }

      if (!body.user_id) return res.status(400).json({ error: 'user_id is required' })
      if (!body.file_name) return res.status(400).json({ error: 'file_name is required' })

      const [row] = await d.insert(conversions).values({
        id: randomUUID(),
        userId: body.user_id,
        fileName: body.file_name,
        fileSize: body.file_size ?? null,
        status: body.status ?? 'processing',
      }).returning()

      return res.json(toSnake(row))
    }

    if (req.method === 'GET') {
      const userId = typeof req.query.user_id === 'string'
        ? req.query.user_id
        : typeof req.query.user === 'string'
          ? req.query.user
          : ''

      if (!userId) return res.status(400).json({ error: 'user_id is required' })

      const rows = await d.select()
        .from(conversions)
        .where(eq(conversions.userId, userId))
        .orderBy(desc(conversions.createdAt))

      return res.json(rows.map(toSnake))
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[conversions]', err)
    return res.status(500).json({ error: 'Failed to process conversions request' })
  }
}
