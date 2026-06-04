import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { uploadToR2, getPresignedUrl } from '../../server/r2'

export const config = { api: { bodyParser: false } }

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function parseBoundary(contentType: string): string | null {
  const m = contentType.match(/boundary=([^\s;]+)/)
  return m ? m[1] : null
}

function parseMultipart(body: Buffer, boundary: string): { filename: string; mimetype: string; data: Buffer } | null {
  const sep = Buffer.from(`--${boundary}`)
  const parts = []
  let start = 0
  while (start < body.length) {
    const idx = body.indexOf(sep, start)
    if (idx === -1) break
    const end = body.indexOf(sep, idx + sep.length)
    parts.push(body.slice(idx + sep.length, end === -1 ? body.length : end))
    start = end === -1 ? body.length : end
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) continue
    const headers = part.slice(0, headerEnd).toString()
    if (!headers.includes('name="file"')) continue
    const filenameMatch = headers.match(/filename="([^"]+)"/)
    const mimeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/)
    const data = part.slice(headerEnd + 4, part.lastIndexOf('\r\n'))
    return {
      filename: filenameMatch ? filenameMatch[1] : 'file',
      mimetype: mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream',
      data,
    }
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const contentType = req.headers['content-type'] || ''
    const boundary = parseBoundary(contentType)
    if (!boundary) return res.status(400).json({ error: 'Expected multipart/form-data' })

    const body = await readRawBody(req)
    const file = parseMultipart(body, boundary)
    if (!file) return res.status(400).json({ error: 'No file provided' })

    const ext = file.filename.split('.').pop() ?? 'xlsx'
    const key = `conversions/${randomUUID()}.${ext}`
    await uploadToR2(key, file.data, file.mimetype)
    const url = await getPresignedUrl(key)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    return res.json({ key, url, expiresAt })
  } catch (err) {
    console.error('[r2/upload]', err)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
