import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { dash } from '@better-auth/infra'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../auth-schema'
import { sendEmail } from './resend'
import { resetPasswordEmail, verifyEmailTemplate } from './emailTemplates'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const db = drizzle(pool, { schema })

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // set to true once Resend is configured
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Password reset URL for ${user.email}: ${url}`)
      await sendEmail({
        to: user.email,
        subject: 'Reset your ExcelfromPDF password',
        html: resetPasswordEmail(user.name || '', url),
      }).catch(err => console.error('[auth] Failed to send reset email:', err))
    },
  },
  emailVerification: {
    // better-auth writes a token to the `verification` table before calling this hook
    sendVerificationEmail: async ({ user, token }) => {
      const appUrl = process.env.VITE_APP_URL || 'http://localhost:3000'
      const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`
      console.log(`[auth] Verification URL for ${user.email}: ${verifyUrl}`)

      await sendEmail({
        to: user.email,
        subject: 'Verify your ExcelfromPDF account',
        html: verifyEmailTemplate(user.name || '', verifyUrl),
      }).catch(err => console.error('[auth] Failed to send verification email:', err))
    },
    autoSignInAfterVerification: true,
  },
  session: {
    // Sessions are stored in the `session` table: token, user_id, ip_address, user_agent
    expiresIn: 60 * 60 * 12, // 12 hours
    updateAge: 60 * 60 * 12, // do not extend sessions beyond the 12h login window
  },
  plugins: [
    dash(),
  ],
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://excelfrompdf.com',
    'https://www.excelfrompdf.com',
    process.env.VITE_APP_URL || 'http://localhost:3000',
  ],
})
