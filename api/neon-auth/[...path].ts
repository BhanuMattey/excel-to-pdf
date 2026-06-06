import type { VercelRequest, VercelResponse } from '@vercel/node'

const NEON_AUTH_BASE = 'https://ep-icy-resonance-aqkewacl.neonauth.c-8.us-east-1.aws.neon.tech/neondb/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParam = req.query.path
  const pathStr = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam ?? '')

  const search = new URL(req.url ?? '/', `https://${req.headers.host}`).search
  const target = `${NEON_AUTH_BASE}/${pathStr}${search}`

  const forwardHeaders: Record<string, string> = {}
  for (const [key, val] of Object.entries(req.headers)) {
    if (!val) continue
    // Skip hop-by-hop and host (we're targeting a different host)
    if (['host', 'connection', 'transfer-encoding', 'te', 'trailer', 'upgrade'].includes(key)) continue
    forwardHeaders[key] = Array.isArray(val) ? val.join(', ') : val
  }

  let body: BodyInit | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })
    body = Buffer.concat(chunks)
    if ((body as Buffer).length === 0) body = undefined
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers: forwardHeaders,
    body,
    // @ts-expect-error Node 18 fetch supports this
    duplex: 'half',
  })

  // Forward status
  res.status(upstream.status)

  // Forward all response headers including Set-Cookie
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    if (key.toLowerCase() === 'connection') return
    res.setHeader(key, value)
  })

  const responseBody = await upstream.arrayBuffer()
  res.end(Buffer.from(responseBody))
}
