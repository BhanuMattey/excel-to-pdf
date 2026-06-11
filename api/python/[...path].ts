import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  api: {
    bodyParser: false,
  },
}

const PYTHON_API = 'https://api.excelfrompdf.com/api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // req.url is the full incoming path, e.g. /api/python/splitexcel or /api/python/status/abc
  // Strip the /api/python prefix to get the downstream path.
  const reqUrl = new URL(req.url ?? '/', `https://${req.headers.host}`)
  const stripped = reqUrl.pathname.replace(/^\/api\/python\/?/, '')

  // Fallback: if Vercel passed path as a query param instead of path segments, use that.
  const pathParam = req.query.path
  const fromQuery = Array.isArray(pathParam) ? pathParam.join('/') : pathParam ?? ''
  const pathStr = stripped || fromQuery

  // Strip internal Vercel routing params (...path) before forwarding.
  const forwardParams = new URLSearchParams(reqUrl.search)
  forwardParams.delete('path')
  const search = forwardParams.toString() ? `?${forwardParams.toString()}` : ''
  const target = `${PYTHON_API}/${pathStr}${search}`

  const skipHeaders = new Set([
    'host', 'connection', 'transfer-encoding', 'te', 'trailer', 'upgrade', 'accept-encoding',
  ])

  const forwardHeaders: Record<string, string> = {}
  for (const [key, val] of Object.entries(req.headers)) {
    if (!val || skipHeaders.has(key.toLowerCase())) continue
    forwardHeaders[key] = Array.isArray(val) ? val.join(', ') : val
  }

  // Collect the raw body so multipart/form-data file uploads are forwarded intact.
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
    // Drop hop-by-hop headers and content-encoding — fetch() decompresses the
    // body automatically, so forwarding the encoding header would tell the
    // browser to decompress already-decoded bytes (ERR_CONTENT_DECODING_FAILED).
    if (lower === 'transfer-encoding' || lower === 'connection' || lower === 'content-encoding') return
    res.setHeader(key, value)
  })

  const responseBody = await upstream.arrayBuffer()
  res.end(Buffer.from(responseBody))
}
