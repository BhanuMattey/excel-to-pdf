import { createAuthClient } from 'better-auth/react'
import { sentinelClient } from '@better-auth/infra/client'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:3000',
  plugins: [
    sentinelClient(),
  ],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
