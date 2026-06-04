import type { VercelRequest, VercelResponse } from '@vercel/node'

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

  // @vercel/node reads the body stream into req.body for non-multipart requests,
  // but for multipart/form-data it pipes the raw stream through unparsed.
  // We need to forward the raw body in all cases.
  let body: Buffer | undefined
  const contentType = (req.headers['content-type'] ?? '').toLowerCase()

  if (contentType.includes('multipart/form-data')) {
    // Raw stream — collect chunks directly
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })
    body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
  } else if (req.body != null) {
    // Already parsed by @vercel/node — re-serialize
    body = Buffer.from(
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    )
    if (!forwardHeaders['content-type']) {
      forwardHeaders['content-type'] = 'application/json'
    }
  }

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
