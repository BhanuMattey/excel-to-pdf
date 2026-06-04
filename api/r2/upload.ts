import type { IncomingMessage, ServerResponse } from 'http'
import multer from 'multer'
import { randomUUID } from 'crypto'
import { uploadToR2, getPresignedUrl } from '../_r2.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

type RequestWithFile = IncomingMessage & {
  file?: Express.Multer.File
  method?: string
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
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

  try {
    await runUpload(req, res)

    if (!req.file) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'No file provided' }))
      return
    }

    const ext = req.file.originalname.split('.').pop() || 'xlsx'
    const key = `conversions/${randomUUID()}.${ext}`
    const contentType = req.file.mimetype || 'application/octet-stream'

    await uploadToR2(key, req.file.buffer, contentType)
    const url = await getPresignedUrl(key)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ key, url, expiresAt }))
  } catch (err) {
    console.error('[api/r2/upload]', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Upload failed' }))
  }
}
