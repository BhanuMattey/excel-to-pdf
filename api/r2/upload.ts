import type { IncomingMessage, ServerResponse } from 'http'
import multer from 'multer'
import { randomUUID } from 'crypto'
import { uploadToR2, getPresignedUrl } from '../../src/server/r2.js'
import { getSessionUser } from '../_auth.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

// Allowed MIME types and their canonical extensions.
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
}

// Allowed file extensions (double-checked against the original name).
const ALLOWED_EXTS = new Set(['pdf', 'xls', 'xlsx', 'doc', 'docx'])

// 50 MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

type RequestWithFile = IncomingMessage & {
  file?: Express.Multer.File
  method?: string
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_TYPES[file.mimetype] || !ALLOWED_EXTS.has(ext)) {
      cb(new Error('File type not allowed'))
      return
    }
    cb(null, true)
  },
})

function runUpload(req: RequestWithFile, res: ServerResponse) {
  return new Promise<void>((resolve, reject) => {
    upload.single('file')(req as never, res as never, (err: unknown) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export default async function handler(req: RequestWithFile, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  // Require an authenticated session.
  const sessionUser = await getSessionUser(req)
  if (!sessionUser) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  try {
    await runUpload(req, res)

    if (!req.file) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'No file provided' }))
      return
    }

    const rawExt = req.file.originalname.split('.').pop()?.toLowerCase() || ''
    // Use the MIME-derived canonical extension; fall back to the original extension only
    // if it's in the whitelist (multer fileFilter already enforced this, but be explicit).
    const ext = ALLOWED_TYPES[req.file.mimetype] ?? (ALLOWED_EXTS.has(rawExt) ? rawExt : 'bin')
    const key = `conversions/${randomUUID()}.${ext}`
    const contentType = req.file.mimetype

    await uploadToR2(key, req.file.buffer, contentType)
    const url = await getPresignedUrl(key)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ key, url, expiresAt }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    const isValidationError = msg === 'File type not allowed'
    console.error('[api/r2/upload]', err)
    res.statusCode = isValidationError ? 415 : 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: isValidationError ? msg : 'Upload failed' }))
  }
}
