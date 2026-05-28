import { createContext, useContext, useEffect, useState } from 'react'
import { authService, conversionService } from '../services/db'

const AuthContext = createContext({})

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

const FREE_LIMIT = parseInt(import.meta.env.VITE_FREE_CONVERSION_LIMIT || '3')

const getAnonCount = () => parseInt(localStorage.getItem('anonConversions') || '0', 10)
const setAnonCount = (n) => localStorage.setItem('anonConversions', String(n))

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [conversionCount, setConversionCount] = useState(0)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  useEffect(() => {
    authService.getSession().then((session) => {
      if (session?.user) {
        setUser(session.user)
        conversionService.getConversionCount(session.user.id)
          .then(setConversionCount)
          .catch(() => setConversionCount(0))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const signUp = async (email, password, fullName) => {
    const data = await authService.signUp(email, password, fullName)
    if (data.user) setUser(data.user)
    return data
  }

  const signIn = async (email, password) => {
    const data = await authService.signIn(email, password)
    if (data.user) {
      setUser(data.user)
      const count = await conversionService.getConversionCount(data.user.id).catch(() => 0)
      setConversionCount(count)
    }
    return data
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setConversionCount(0)
  }

  const refreshConversionCount = async () => {
    if (!user) return
    const count = await conversionService.getConversionCount(user.id).catch(() => 0)
    setConversionCount(count)
  }

  const effectiveCount = user ? conversionCount : getAnonCount()
  const remainingFreeConversions = Math.max(0, FREE_LIMIT - effectiveCount)
  const hasFreeConversions = remainingFreeConversions > 0

  const checkAndIncrementConversions = (count = 1) => {
    if (user) return effectiveCount + count <= FREE_LIMIT

    const current = getAnonCount()
    if (current + count > FREE_LIMIT) {
      setTimeout(() => setShowAuthPrompt(true), 800)
      return false
    }
    setAnonCount(current + count)
    if (current + count >= FREE_LIMIT) setTimeout(() => setShowAuthPrompt(true), 800)
    return true
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      conversionCount: effectiveCount,
      remainingFreeConversions,
      hasFreeConversions,
      FREE_CONVERSION_LIMIT: FREE_LIMIT,
      signUp,
      signIn,
      signOut,
      refreshConversionCount,
      checkAndIncrementConversions,
      showAuthPrompt,
      closeAuthPrompt: () => setShowAuthPrompt(false),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
