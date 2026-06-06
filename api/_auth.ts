import type { IncomingMessage } from 'http'
import type { VercelRequest } from '@vercel/node'

const SESSION_COOKIE = 'better-auth.session_token'
const NEON_AUTH_BASE = 'https://ep-icy-resonance-aqkewacl.neonauth.c-8.us-east-1.aws.neon.tech/neondb/auth'

function extractToken(req: IncomingMessage | VercelRequest): string | null {
  const auth = (req.headers as Record<string, string | string[] | undefined>).authorization
  if (auth) {
    const val = Array.isArray(auth) ? auth[0] : auth
    if (val?.toLowerCase().startsWith('bearer ')) return val.slice(7).trim()
  }
  return null
}

function getForwardedCookie(req: IncomingMessage | VercelRequest): string | null {
  const cookieHeader = (req.headers as Record<string, string | string[] | undefined>).cookie
  if (!cookieHeader) return null
  const raw = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader
  // Check if the cookie header contains the session cookie (signed value)
  if (raw.includes(SESSION_COOKIE)) return raw
  return null
}

export interface SessionUser {
  id: string
  email: string
}

/**
 * Validates the session by calling Neon Auth's /get-session endpoint server-side.
 * Two strategies:
 *  1. Cookie present: forward the full signed cookie header to Neon Auth (works when cookie is set)
 *  2. Bearer token only (Brave cookie blocked): construct a cookie from the raw token and try
 */
export async function getSessionUser(
  req: IncomingMessage | VercelRequest
): Promise<SessionUser | null> {
  // Strategy 1: forward the actual signed cookie from the browser
  const forwardedCookie = getForwardedCookie(req)
  if (forwardedCookie) {
    const user = await callNeonGetSession(forwardedCookie)
    if (user) return user
  }

  // Strategy 2: Bearer token fallback — construct cookie from raw token
  const bearerToken = extractToken(req)
  if (bearerToken) {
    // Try passing the raw token as cookie (works if Neon Auth doesn't verify signature strictly)
    const user = await callNeonGetSession(`${SESSION_COOKIE}=${encodeURIComponent(bearerToken)}`)
    if (user) return user
  }

  return null
}

async function callNeonGetSession(cookieHeader: string): Promise<SessionUser | null> {
  try {
    const resp = await fetch(`${NEON_AUTH_BASE}/get-session`, {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'origin': NEON_AUTH_BASE,
        'content-type': 'application/json',
      },
    })

    if (!resp.ok) return null

    const data = await resp.json() as {
      user?: { id?: string; email?: string }
    } | null

    if (!data) return null
    const id = data?.user?.id
    const email = data?.user?.email
    if (!id || !email) return null

    return { id, email }
  } catch {
    return null
  }
}
