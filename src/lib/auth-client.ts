import { authClient } from './neon-client'

export const { signIn, signUp, signOut, useSession, getSession, requestPasswordReset, resetPassword } = authClient
export { authClient }
