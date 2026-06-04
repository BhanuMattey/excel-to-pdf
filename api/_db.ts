import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

function cleanDatabaseUrl(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.delete('channel_binding')
    return u.toString()
  } catch {
    return url
  }
}

export function createPool() {
  const raw = process.env.DATABASE_URL || ''
  if (!raw) throw new Error('DATABASE_URL env var is not set')
  const connectionString = cleanDatabaseUrl(raw)
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  // Bypass RLS for server-side queries — neondb_owner is a superuser so SET LOCAL works
  pool.on('connect', (client) => {
    client.query('SET SESSION AUTHORIZATION DEFAULT; SET row_security = off;').catch(() => {})
  })
  return pool
}

export function createDb(pool: Pool) {
  return drizzle(pool)
}
