import type { VercelRequest, VercelResponse } from '@vercel/node'

const PYTHON_BASE = process.env.PYTHON_API_URL || 'http://153.75.250.227:8000'

export async function proxyPython(
  req: VercelRequest,
  res: VercelResponse,
  pathSegments: string[]
) {
  const targetPath = '/api/' + pathSegments.map(encodeURIComponent).join('/')

  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path' || k === 'jobId') continue
    if (Array.isArray(v)) v.forEach((val) => search.append(k, val))
    else if (v != null) search.set(k, v)
  }
  const qs = search.toString()
  const targetUrl = `${PYTHON_BASE}${targetPath}${qs ? '?' + qs : ''}`

  const forwardHeaders: Record<string, string> = {}
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.toLowerCase() === 'host') continue
    if (Array.isArray(v)) forwardHeaders[k] = v.join(', ')
    else if (v != null) forwardHeaders[k] = v
  }

  const chunks: Uint8Array[] = []
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const bodyBytes = chunks.length > 0
    ? chunks.reduce((acc, c) => {
      const merged = new Uint8Array(acc.length + c.length)
      merged.set(acc)
      merged.set(c, acc.length)
      return merged
    }, new Uint8Array(0))
    : null

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: forwardHeaders,
    body: bodyBytes && bodyBytes.length > 0 ? bodyBytes : null,
  })

  const skip = new Set(['transfer-encoding', 'connection', 'keep-alive'])
  upstream.headers.forEach((value, key) => {
    if (!skip.has(key.toLowerCase())) res.setHeader(key, value)
  })

  res.status(upstream.status)
  res.end(new Uint8Array(await upstream.arrayBuffer()))
}

export const rawBodyConfig = {
  api: {
    bodyParser: false,
  },
}
