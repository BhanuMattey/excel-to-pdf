import { createAuthClient } from '@neondatabase/neon-js/auth'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react'

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL

if (!neonAuthUrl) {
  throw new Error('Missing VITE_NEON_AUTH_URL')
}

export const authClient = createAuthClient(neonAuthUrl, {
  adapter: BetterAuthReactAdapter(),
})

export const { signIn, signUp, signOut, useSession, getSession, requestPasswordReset, resetPassword } = authClient
