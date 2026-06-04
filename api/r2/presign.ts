import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPresignedUrl } from '../../server/r2'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const key = req.query.key as string
  if (!key) return res.status(400).json({ error: 'key is required' })
  try {
    const url = await getPresignedUrl(key)
    return res.json({ url })
  } catch (err) {
    console.error('[r2/presign]', err)
    return res.status(500).json({ error: 'Failed to generate URL' })
  }
}
