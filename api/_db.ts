import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

function cleanDatabaseUrl(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.delete('channel_binding')
    return u.toString()
  } catch {
    return url
  }
}

export function createDb() {
  const raw = process.env.DATABASE_URL || ''
  if (!raw) throw new Error('DATABASE_URL env var is not set')
  const connectionString = cleanDatabaseUrl(raw)
  const sql = neon(connectionString)
  return drizzle(sql)
}
