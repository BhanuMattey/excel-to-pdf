import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { conversionService } from '../services/db'

type UsagePromptType = 'auth' | 'pro'

interface AuthContextValue {
  user: { id: string; email: string; name?: string | null } | null
  loading: boolean
  conversionCount: number
  remainingFreeConversions: number
  hasFreeConversions: boolean
  FREE_CONVERSION_LIMIT: number
  isPro: boolean
  setProStatus: (pro: boolean) => void
  signUp: (email: string, password: string, name: string) => Promise<unknown>
  signIn: (email: string, password: string) => Promise<unknown>
  signOut: () => Promise<void>
  refreshConversionCount: () => Promise<void>
  checkAndIncrementConversions: (count?: number) => boolean
  showAuthPrompt: boolean
  usagePromptType: UsagePromptType | null
  closeAuthPrompt: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Conversion limits:
// - Not logged in: 3 free conversions total, then prompt to sign in.
// - Logged in, 0 anon conversions before login: 5 free conversions.
// - Logged in, did N anon conversions before login: (5 - N) remaining after login.
//   e.g. did 3 anon → 2 more after login; did 1 anon → 4 more after login.
const ANON_LIMIT = parseInt(import.meta.env.VITE_FREE_CONVERSION_LIMIT || '3')
const AUTH_LIMIT = parseInt(import.meta.env.VITE_FREE_CONVERSION_LIMIT_AUTH || '5')
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

// anonConversions: how many conversions were done before login (incremented per conversion)
// anonAtLogin: snapshot of anonConversions taken at the moment the user logs in/signs up
const getAnonCount = () => parseInt(localStorage.getItem('anonConversions') || '0', 10)
const setAnonCount = (n: number) => localStorage.setItem('anonConversions', String(n))
const getAnonAtLogin = () => parseInt(localStorage.getItem('anonAtLogin') || '0', 10)
const setAnonAtLogin = (n: number) => localStorage.setItem('anonAtLogin', String(n))
const getSessionStartedAt = () => parseInt(localStorage.getItem('authSessionStartedAt') || '0', 10)
const setSessionStartedAt = (n: number) => localStorage.setItem('authSessionStartedAt', String(n))

const normalizeAuthError = (message?: string) => {
  if (!message) return 'Authentication failed. Please try again.'
  if (/404|not found/i.test(message))
    return 'Auth server is not reachable. Make sure the dev server is running.'
  return message
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isPending: loading } = authClient.useSession()
  const user = session?.user ?? null

  const [conversionCount, setConversionCount] = useState(0)
  const [anonymousConversionCount, setAnonymousConversionCount] = useState(() => getAnonCount())
  const [usagePromptType, setUsagePromptType] = useState<UsagePromptType | null>(null)

  useEffect(() => {
    if (!user) {
      setConversionCount(0)
      setAnonymousConversionCount(getAnonCount())
      return
    }
    setUsagePromptType(null)
    // Don't reset to 0 before the fetch — avoids the flash to zero on navigation
    conversionService.getConversionCount(user.id)
      .then(setConversionCount)
      .catch(() => {/* keep existing count on transient error */})
  }, [user?.id])

  const signUp = async (email: string, password: string, name: string) => {
    const result = await authClient.signUp.email({ email, password, name })
    if (result.error) throw new Error(normalizeAuthError(result.error.message))
    // Snapshot how many anon conversions were done before signup
    setAnonAtLogin(getAnonCount())
    setSessionStartedAt(Date.now())
    return result
  }

  const signIn = async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password })
    if (result.error) throw new Error(normalizeAuthError(result.error.message))
    if (result.data?.user) {
      // Snapshot how many anon conversions were done before login
      setAnonAtLogin(getAnonCount())
      setSessionStartedAt(Date.now())
      const count = await conversionService.getConversionCount(result.data.user.id).catch(() => 0)
      setConversionCount(count)
    }
    return result
  }

  const signOut = async () => {
    await authClient.signOut()
    setConversionCount(0)
    // Reset anon state so the next session starts fresh
    localStorage.removeItem('anonConversions')
    localStorage.removeItem('anonAtLogin')
    localStorage.removeItem('authSessionStartedAt')
    setAnonymousConversionCount(0)
  }

  useEffect(() => {
    if (loading) return
    if (!user) {
      localStorage.removeItem('authSessionStartedAt')
      return
    }

    let startedAt = getSessionStartedAt()
    if (!startedAt) {
      startedAt = Date.now()
      setSessionStartedAt(startedAt)
    }

    const remainingMs = startedAt + SESSION_TTL_MS - Date.now()
    if (remainingMs <= 0) {
      signOut().catch(() => {})
      return
    }

    const timeoutId = window.setTimeout(() => {
      signOut().catch(() => {})
    }, remainingMs)

    return () => window.clearTimeout(timeoutId)
  }, [loading, user?.id])

  const refreshConversionCount = async () => {
    if (!user) return
    const count = await conversionService.getConversionCount(user.id).catch(() => 0)
    setConversionCount(count)
  }

  // Logged-in limit = AUTH_LIMIT (5) minus anon conversions done before login
  // e.g. did 3 anon → limit is 2 more; did 0 anon → limit is 5
  const getAuthLimit = () => Math.max(0, AUTH_LIMIT - getAnonAtLogin())

  const effectiveLimit = user ? getAuthLimit() : ANON_LIMIT
  const effectiveCount = user ? conversionCount : anonymousConversionCount
  const remainingFreeConversions = Math.max(0, effectiveLimit - effectiveCount)
  const hasFreeConversions = remainingFreeConversions > 0

  // isPro is injected from PlanContext after it loads — start as false until resolved
  const [isPro, setIsPro] = useState(false)

  const checkAndIncrementConversions = (count = 1): boolean => {
    // Pro users have unlimited conversions
    if (isPro) return true
    if (user) {
      if (effectiveCount + count > effectiveLimit) {
        setTimeout(() => setUsagePromptType('pro'), 300)
        return false
      }
      return true
    }
    const current = getAnonCount()
    if (current + count > ANON_LIMIT) {
      setTimeout(() => setUsagePromptType('auth'), 800)
      return false
    }
    const next = current + count
    setAnonCount(next)
    setAnonymousConversionCount(next)
    if (next >= ANON_LIMIT) setTimeout(() => setUsagePromptType('auth'), 800)
    return true
  }

  const setProStatus = (pro: boolean) => setIsPro(pro)

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      conversionCount: effectiveCount,
      remainingFreeConversions: isPro ? Infinity : remainingFreeConversions,
      hasFreeConversions: isPro ? true : hasFreeConversions,
      FREE_CONVERSION_LIMIT: isPro ? Infinity : effectiveLimit,
      isPro,
      setProStatus,
      signUp,
      signIn,
      signOut,
      refreshConversionCount,
      checkAndIncrementConversions,
      showAuthPrompt: usagePromptType !== null,
      usagePromptType,
      closeAuthPrompt: () => setUsagePromptType(null),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
