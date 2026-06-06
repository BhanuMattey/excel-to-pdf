import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { conversions } from '../../src/db/schema.js'
import { createDb } from '../../src/server/db.js'
import { getSessionUser } from '../_auth.js'

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || ''

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
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  // Accept either:
  // 1. A valid user session (the browser client updating its own conversion), or
  // 2. The internal shared secret (the Python backend updating job status).
  const internalHeader = req.headers['x-internal-secret']
  const internalSecret = Array.isArray(internalHeader) ? internalHeader[0] : internalHeader

  let authorizedUserId: string | null = null

  if (INTERNAL_SECRET && internalSecret === INTERNAL_SECRET) {
    // Internal service call — allow unconditionally, no user scoping needed.
    authorizedUserId = '__internal__'
  } else {
    const sessionUser = await getSessionUser(req)
    if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })
    authorizedUserId = sessionUser.id
  }

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!id) return res.status(400).json({ error: 'id is required' })

  const body = req.body as {
    status?: string
    output_url?: string | null
    r2_key?: string | null
    expires_at?: string | null
  }

  if (!body.status) return res.status(400).json({ error: 'status is required' })

  const d = createDb()
  try {
    // For browser callers, verify the conversion belongs to the requesting user.
    if (authorizedUserId !== '__internal__') {
      const [existing] = await d.select({ userId: conversions.userId })
        .from(conversions)
        .where(eq(conversions.id, id))
        .limit(1)

      if (!existing) return res.status(404).json({ error: 'Conversion not found' })
      if (existing.userId !== authorizedUserId) return res.status(403).json({ error: 'Forbidden' })
    }

    const [row] = await d.update(conversions).set({
      status: body.status,
      outputUrl: body.output_url ?? null,
      r2Key: body.r2_key ?? null,
      expiresAt: body.expires_at ? new Date(body.expires_at) : null,
      updatedAt: new Date(),
    }).where(eq(conversions.id, id)).returning()

    if (!row) return res.status(404).json({ error: 'Conversion not found' })
    return res.json(toSnake(row))
  } catch (err) {
    console.error('[conversions/:id]', err)
    return res.status(500).json({ error: 'Failed to update conversion' })
  }
}
