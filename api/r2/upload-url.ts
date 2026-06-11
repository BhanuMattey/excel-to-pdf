import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { getPresignedPutUrl, getPresignedUrl } from '../../src/server/r2.js'
import { getSessionUser } from '../_auth.js'

// Same whitelist as api/r2/upload.ts.
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/octet-stream': 'zip',
}

const ALLOWED_EXTS = new Set(['pdf', 'xls', 'xlsx', 'doc', 'docx', 'zip'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const sessionUser = await getSessionUser(req)
  if (!sessionUser) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { filename, contentType } = (req.body ?? {}) as { filename?: string; contentType?: string }
  if (typeof filename !== 'string' || typeof contentType !== 'string') {
    res.status(400).json({ error: 'filename and contentType are required' })
    return
  }

  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_TYPES[contentType] || !ALLOWED_EXTS.has(ext)) {
    res.status(415).json({ error: 'File type not allowed' })
    return
  }

  try {
    // Key the object by the MIME-derived canonical extension, matching upload.ts.
    const key = `conversions/${randomUUID()}.${ALLOWED_TYPES[contentType]}`
    const uploadUrl = await getPresignedPutUrl(key, contentType)
    const url = await getPresignedUrl(key)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    res.status(200).json({ key, uploadUrl, url, expiresAt })
  } catch (err) {
    console.error('[api/r2/upload-url]', err)
    res.status(500).json({ error: 'Failed to create upload URL' })
  }
}
