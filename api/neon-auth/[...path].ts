import type { VercelRequest, VercelResponse } from '@vercel/node'

const NEON_AUTH_BASE = 'https://ep-icy-resonance-aqkewacl.neonauth.c-8.us-east-1.aws.neon.tech/neondb/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParam = req.query.path
  const pathSegments = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : []
  const pathStr = pathSegments.join('/')

  const reqUrl = new URL(req.url ?? '/', `https://${req.headers.host}`)
  const target = `${NEON_AUTH_BASE}/${pathStr}${reqUrl.search}`

  const forwardHeaders: Record<string, string> = {}
  const skipHeaders = new Set([
    'host', 'connection', 'transfer-encoding', 'te', 'trailer', 'upgrade',
    // Strip these — Neon checks Origin/Referer and rejects cross-origin proxied calls
    'origin', 'referer',
  ])

  for (const [key, val] of Object.entries(req.headers)) {
    if (!val || skipHeaders.has(key.toLowerCase())) continue
    forwardHeaders[key] = Array.isArray(val) ? val.join(', ') : val
  }

  // Set origin to the Neon auth domain so it looks like a same-origin server call
  forwardHeaders['origin'] = 'https://ep-icy-resonance-aqkewacl.neonauth.c-8.us-east-1.aws.neon.tech'

  // fetch() rejects Node's Buffer type (Buffer<ArrayBufferLike> is not BodyInit),
  // so re-wrap as a plain Uint8Array.
  let body: Uint8Array<ArrayBuffer> | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })
    const buf = Buffer.concat(chunks)
    if (buf.length > 0) body = new Uint8Array(buf)
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers: forwardHeaders,
    body,
  })

  res.status(upstream.status)

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === 'transfer-encoding' || lower === 'connection') return
    res.setHeader(key, value)
  })

  const responseBody = await upstream.arrayBuffer()
  res.end(Buffer.from(responseBody))
}
