import React, { lazy, useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PlanProvider, usePlan } from './context/PlanContext'

const AuthPromptModal = lazy(() => import('./components/auth/AuthPromptModal'))

function PlanSyncBridge() {
  const { isPro } = usePlan()
  const { setProStatus } = useAuth()
  useEffect(() => { setProStatus(isPro) }, [isPro, setProStatus])
  return null
}

function AuthPromptBridge() {
  const { showAuthPrompt, usagePromptType, closeAuthPrompt } = useAuth()
  return <AuthPromptModal isOpen={showAuthPrompt} onClose={closeAuthPrompt} type={usagePromptType ?? 'auth'} />
}

const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <PlanProvider>
      <HelmetProvider>
        <PlanSyncBridge />
        {children}
        <AuthPromptBridge />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1f2937',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              borderRadius: '0.75rem',
              padding: '1rem',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </HelmetProvider>
    </PlanProvider>
  </AuthProvider>
)

export default AppProviders
