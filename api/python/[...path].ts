import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  api: {
    bodyParser: false,
  },
}

const PYTHON_API = 'https://api.excelfrompdf.com/api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParam = req.query.path
  const segments = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : []
  const pathStr = segments.join('/')

  const reqUrl = new URL(req.url ?? '/', `https://${req.headers.host}`)
  const target = `${PYTHON_API}/${pathStr}${reqUrl.search}`

  const skipHeaders = new Set([
    'host', 'connection', 'transfer-encoding', 'te', 'trailer', 'upgrade',
  ])

  const forwardHeaders: Record<string, string> = {}
  for (const [key, val] of Object.entries(req.headers)) {
    if (!val || skipHeaders.has(key.toLowerCase())) continue
    forwardHeaders[key] = Array.isArray(val) ? val.join(', ') : val
  }

  // Collect the raw body so multipart/form-data file uploads are forwarded intact.
  let body: Buffer | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', resolve)
      req.on('error', reject)
    })
    const buf = Buffer.concat(chunks)
    if (buf.length > 0) body = buf
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
