import type { IncomingMessage } from 'http'
import type { VercelRequest } from '@vercel/node'
import { eq } from 'drizzle-orm'
import { createDb } from '../src/server/db.js'
import { session as sessionTable, user as userTable } from '../src/db/schema.js'

// Cookie name set by Better Auth / Neon Auth by default.
const SESSION_COOKIE = 'better-auth.session_token'

function extractToken(req: IncomingMessage | VercelRequest): string | null {
  const cookieHeader = (req.headers as Record<string, string | string[] | undefined>).cookie
  if (cookieHeader) {
    const raw = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader
    for (const part of raw.split(';')) {
      const eqIdx = part.indexOf('=')
      if (eqIdx === -1) continue
      const name = part.slice(0, eqIdx).trim()
      if (name === SESSION_COOKIE) {
        return decodeURIComponent(part.slice(eqIdx + 1).trim())
      }
    }
  }

  // Fallback: Authorization: Bearer <token>
  const auth = (req.headers as Record<string, string | string[] | undefined>).authorization
  if (auth) {
    const val = Array.isArray(auth) ? auth[0] : auth
    if (val?.toLowerCase().startsWith('bearer ')) return val.slice(7).trim()
  }

  return null
}

export interface SessionUser {
  id: string
  email: string
}

/**
 * Verifies the session token from the incoming request against the database.
 * Returns the authenticated user or null if the token is absent / expired / invalid.
 */
export async function getSessionUser(
  req: IncomingMessage | VercelRequest
): Promise<SessionUser | null> {
  const token = extractToken(req)
  if (!token) return null

  try {
    const db = createDb()
    const rows = await db
      .select({ userId: sessionTable.userId, expiresAt: sessionTable.expiresAt, email: userTable.email })
      .from(sessionTable)
      .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
      .where(eq(sessionTable.token, token))
      .limit(1)

    const row = rows[0]
    if (!row) return null
    if (row.expiresAt < new Date()) return null

    return { id: row.userId, email: row.email }
  } catch {
    return null
  }
}
