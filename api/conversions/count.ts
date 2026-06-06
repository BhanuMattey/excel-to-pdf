import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { conversions } from '../../src/db/schema.js'
import { createDb } from '../../src/server/db.js'
import { getSessionUser } from '../_auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const sessionUser = await getSessionUser(req)
  if (!sessionUser) return res.status(401).json({ error: 'Unauthorized' })

  const d = createDb()
  try {
    const rows = await d.select({ id: conversions.id })
      .from(conversions)
      .where(eq(conversions.userId, sessionUser.id))

    return res.json({ count: rows.length })
  } catch (err) {
    console.error('[conversions/count]', err)
    return res.status(500).json({ error: 'Failed to fetch conversion count' })
  }
}
