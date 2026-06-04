import type { IncomingMessage, ServerResponse } from 'http'
import { getPresignedUrl } from '../../src/server/r2.js'

type RequestWithQuery = IncomingMessage & {
  method?: string
  query?: {
    key?: string | string[]
  }
  url?: string
}

function getKey(req: RequestWithQuery) {
  const queryKey = req.query?.key
  if (Array.isArray(queryKey)) return queryKey[0] || ''
  if (queryKey) return queryKey

  const url = new URL(req.url || '/', 'http://localhost')
  return url.searchParams.get('key') || ''
}

export default async function handler(req: RequestWithQuery, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const key = getKey(req)
  if (!key) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'key is required' }))
    return
  }

  try {
    const url = await getPresignedUrl(key)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ url }))
  } catch (err) {
    console.error('[api/r2/presign]', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Failed to generate URL' }))
  }
}
