import type { VercelRequest, VercelResponse } from '@vercel/node'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq } from 'drizzle-orm'
import { randomUUID, randomBytes } from 'crypto'
import { user as userTable, verification } from '../../auth-schema'
import { sendEmail } from '../../server/resend'
import { resetPasswordEmail } from '../../server/emailTemplates'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body as { email?: string }
  if (!email) return res.status(400).json({ error: 'email is required' })

  // Always respond 200 immediately — prevents email enumeration
  res.status(200).json({ ok: true })

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
    const db = drizzle(pool)

    const [foundUser] = await db
      .select({ id: userTable.id, name: userTable.name })
      .from(userTable)
      .where(eq(userTable.email, email.toLowerCase().trim()))
      .limit(1)

    if (!foundUser) { await pool.end(); return }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.delete(verification).where(eq(verification.identifier, `reset-password:${email}`))
    await db.insert(verification).values({
      id: randomUUID(),
      identifier: `reset-password:${email}`,
      value: token,
      expiresAt,
    })

    const appUrl = process.env.VITE_APP_URL || 'https://www.excelfrompdf.com'
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    await sendEmail({
      to: email,
      subject: 'Reset your ExcelfromPDF password',
      html: resetPasswordEmail(foundUser.name, resetUrl, appUrl),
    })

    await pool.end()
  } catch (err) {
    console.error('[forgot-password]', err)
    // Response already sent — just log
  }
}
