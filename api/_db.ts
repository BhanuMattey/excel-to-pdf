import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// pg driver doesn't support channel_binding — strip it if present
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
  const connectionString = cleanDatabaseUrl(raw)
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  return pool
}

export function createDb(pool: Pool) {
  return drizzle(pool)
}
