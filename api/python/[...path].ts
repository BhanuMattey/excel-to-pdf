import type { VercelRequest, VercelResponse } from '@vercel/node'

const PYTHON_BASE = process.env.PYTHON_API_URL || 'http://153.75.250.227:8000'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = (req.query.path as string[]) ?? []
  // Proxy strips the /api/python prefix; Python expects /api/* routes
  const targetPath = '/api/' + pathSegments.join('/')

  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue
    if (Array.isArray(v)) v.forEach((val) => search.append(k, val))
    else if (v != null) search.set(k, v)
  }
  const qs = search.toString()
  const targetUrl = `${PYTHON_BASE}${targetPath}${qs ? '?' + qs : ''}`

  // Collect raw body
  const bodyChunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer) => bodyChunks.push(chunk))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const rawBody = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined

  // Forward headers — strip host so the Python server sees its own host
  const forwardHeaders: Record<string, string> = {}
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.toLowerCase() === 'host') continue
    if (Array.isArray(v)) forwardHeaders[k] = v.join(', ')
    else if (v != null) forwardHeaders[k] = v
  }

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: forwardHeaders,
    body: rawBody && rawBody.length > 0 ? rawBody : undefined,
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
