import type { VercelRequest, VercelResponse } from '@vercel/node'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq } from 'drizzle-orm'
import { conversions } from '../../src/db/schema'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const userId = req.query.user_id as string
  if (!userId) return res.status(400).json({ error: 'user_id required' })
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  const d = drizzle(pool)
  try {
    const rows = await d.select({ id: conversions.id }).from(conversions).where(eq(conversions.userId, userId))
    return res.json({ count: rows.length })
  } catch (err) {
    console.error('[conversions/count]', err)
    return res.status(500).json({ error: 'DB error' })
  } finally {
    await pool.end()
  }
}
