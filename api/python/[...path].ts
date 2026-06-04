import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { api: { bodyParser: false } }

const PYTHON_BASE = process.env.PYTHON_API_URL || 'http://153.75.250.227:8000'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = (req.query.path as string[]) ?? []
  const targetPath = '/api/' + pathSegments.join('/')

  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue
    if (Array.isArray(v)) v.forEach((val) => search.append(k, val))
    else if (v != null) search.set(k, v)
  }
  const qs = search.toString()
  const targetUrl = `${PYTHON_BASE}${targetPath}${qs ? '?' + qs : ''}`

  // Forward headers — strip host so Python sees its own host
  const forwardHeaders: Record<string, string> = {}
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.toLowerCase() === 'host') continue
    if (Array.isArray(v)) forwardHeaders[k] = v.join(', ')
    else if (v != null) forwardHeaders[k] = v
  }

  // bodyParser is disabled — always read the raw stream
  let body: Buffer | undefined
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', resolve)
    req.on('error', reject)
  })
  if (chunks.length > 0) body = Buffer.concat(chunks)

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: forwardHeaders,
    body: body && body.length > 0 ? body : undefined,
  })

  // Forward response headers (skip ones Vercel manages)
  const skip = new Set(['transfer-encoding', 'connection', 'keep-alive'])
  upstream.headers.forEach((value, key) => {
    if (!skip.has(key.toLowerCase())) res.setHeader(key, value)
  })

  res.status(upstream.status)
  const buf = Buffer.from(await upstream.arrayBuffer())
  res.end(buf)
}
