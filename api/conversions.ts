import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { conversions } from '../src/db/schema.js'
import { createDb } from '../src/server/db.js'
import { getSessionUser } from './_auth.js'

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
      // Require authentication for creating conversion records.
      const sessionUser = await getSessionUser(req)
      if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })

      const body = req.body as { file_name?: string; file_size?: number; status?: string }
      if (!body.file_name) return res.status(400).json({ error: 'file_name is required' })

      const [row] = await d.insert(conversions).values({
        id: randomUUID(),
        userId: sessionUser.id,
        fileName: body.file_name,
        fileSize: body.file_size ?? null,
        status: body.status ?? 'processing',
      }).returning()

      return res.json(toSnake(row))
    }

    if (req.method === 'GET') {
      // Require authentication; use session user ID, ignore query param.
      const sessionUser = await getSessionUser(req)
      if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })

      const rows = await d.select()
        .from(conversions)
        .where(eq(conversions.userId, sessionUser.id))
        .orderBy(desc(conversions.createdAt))

      return res.json(rows.map(toSnake))
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[conversions]', err)
    return res.status(500).json({ error: 'Failed to process conversions request' })
  }
}
