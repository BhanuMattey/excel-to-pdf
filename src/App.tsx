import React, { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import LandingPage from './pages/LandingPage'

// Mounts analytics only after the browser is idle so they never compete
// with rendering the page itself.
function DeferredAnalytics() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const start = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => setReady(true), { timeout: 5000 })
      } else {
        setTimeout(() => setReady(true), 3000)
      }
    }
    if (document.readyState === 'complete') start()
    else {
      window.addEventListener('load', start, { once: true })
      return () => window.removeEventListener('load', start)
    }
  }, [])
  if (!ready) return null
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}

const AppProviders = lazy(() => import('./AppProviders'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ProtectedDashboardRoute = lazy(() => import('./pages/ProtectedDashboardRoute'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const AutoCorrectPage = lazy(() => import('./pages/AutoCorrectPage'))
const AutoDeskewPage = lazy(() => import('./pages/AutoDeskewPage'))
const SplitExcelPage = lazy(() => import('./pages/SplitExcelPage'))
const ExcelToPdfPage = lazy(() => import('./pages/ExcelToPdfPage'))
const PdfToWordPage = lazy(() => import('./pages/PdfToWordPage'))

const withProviders = (element: React.ReactNode) => (
  <AppProviders>{element}</AppProviders>
)

function App() {
  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={withProviders(<PricingPage />)} />
          <Route path="/checkout" element={withProviders(<CheckoutPage />)} />
          <Route path="/login" element={withProviders(<LoginPage />)} />
          <Route path="/signup" element={withProviders(<SignupPage />)} />
          <Route path="/forgot-password" element={withProviders(<ForgotPasswordPage />)} />
          <Route path="/reset-password" element={withProviders(<ResetPasswordPage />)} />
          <Route path="/privacy" element={withProviders(<PrivacyPage />)} />
          <Route path="/terms" element={withProviders(<TermsPage />)} />
          <Route path="/contact" element={withProviders(<ContactPage />)} />
          <Route path="/auto-correct" element={withProviders(<AutoCorrectPage />)} />
          <Route path="/auto-deskew" element={withProviders(<AutoDeskewPage />)} />
          <Route path="/excel-to-pdf" element={withProviders(<ExcelToPdfPage />)} />
          <Route path="/pdf-to-word" element={withProviders(<PdfToWordPage />)} />
          <Route path="/split-excel" element={withProviders(<SplitExcelPage />)} />
          <Route path="/dashboard" element={withProviders(<ProtectedDashboardRoute />)} />
          <Route path="/profile" element={<Navigate to="/dashboard#profile" replace />} />
        </Routes>
      </Suspense>
      <DeferredAnalytics />
    </>
  )
}

export default App
