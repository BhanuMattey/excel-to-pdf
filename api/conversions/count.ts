import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { conversions } from '../../src/db/schema.js'
import { createDb } from '../../src/server/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const userId = typeof req.query.user_id === 'string'
    ? req.query.user_id
    : typeof req.query.user === 'string'
      ? req.query.user
      : ''

  if (!userId) return res.status(400).json({ error: 'user_id is required' })

  const d = createDb()
  try {
    const rows = await d.select({ id: conversions.id })
      .from(conversions)
      .where(eq(conversions.userId, userId))

    return res.json({ count: rows.length })
  } catch (err) {
    console.error('[conversions/count]', err)
    return res.status(500).json({ error: 'Failed to fetch conversion count' })
  }
}
