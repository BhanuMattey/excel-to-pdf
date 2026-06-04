import { createClient } from '@neondatabase/neon-js'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react'

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL
const neonDataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL

if (!neonAuthUrl) {
  throw new Error('Missing VITE_NEON_AUTH_URL')
}

const authAdapter = BetterAuthReactAdapter({
  fetchOptions: {
    credentials: 'include',
  },
})

export const neon = neonDataApiUrl
  ? createClient({
    auth: {
      adapter: authAdapter,
      url: neonAuthUrl,
    },
    dataApi: {
      url: neonDataApiUrl,
    },
  })
  : null

export const authClient = neon
  ? neon.auth
  : createClient({
    auth: {
      adapter: authAdapter,
      url: neonAuthUrl,
    },
    dataApi: {
      url: 'https://disabled.invalid/rest/v1',
    },
  }).auth
