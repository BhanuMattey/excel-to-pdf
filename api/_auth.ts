import type { IncomingMessage } from 'http'
import type { VercelRequest } from '@vercel/node'

export interface SessionUser {
  id: string
  email: string
}

function extractToken(req: IncomingMessage | VercelRequest): string | null {
  const auth = (req.headers as Record<string, string | string[] | undefined>).authorization
  if (auth) {
    const val = Array.isArray(auth) ? auth[0] : auth
    if (val?.toLowerCase().startsWith('bearer ')) return val.slice(7).trim()
  }
  return null
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(base64, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Validates the session from the Bearer JWT issued by Neon Auth.
 * The JWT payload contains id, email, and exp — no DB or network call needed.
 */
export async function getSessionUser(
  req: IncomingMessage | VercelRequest
): Promise<SessionUser | null> {
  const token = extractToken(req)
  if (!token) return null

  // Short session tokens (non-JWT) — look up in DB
  if (!token.includes('.')) {
    return lookupSessionToken(token)
  }

  // JWT path — decode payload directly (no network call needed)
  const payload = decodeJwtPayload(token)
  if (!payload) return null

  const exp = payload.exp as number | undefined
  if (exp && exp * 1000 < Date.now()) return null

  const id = (payload.sub ?? payload.id) as string | undefined
  const email = payload.email as string | undefined
  if (!id || !email) return null

  return { id, email }
}

async function lookupSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { Pool } = await import('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
    const result = await pool.query<{ userId: string; expiresAt: Date; email: string }>(
      `SELECT s."userId", s."expiresAt", u.email
       FROM neon_auth.session s
       JOIN neon_auth."user" u ON u.id = s."userId"
       WHERE s.token = $1
       LIMIT 1`,
      [token]
    )
    await pool.end()
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    if (new Date(row.expiresAt) < new Date()) return null
    return { id: row.userId, email: row.email }
  } catch (err) {
    console.error('[_auth] DB error:', err)
    return null
  }
}
