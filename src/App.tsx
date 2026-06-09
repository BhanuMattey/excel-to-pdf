import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
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
import ProtectedRoute from './components/auth/ProtectedRoute'
const AuthPromptModal = lazy(() => import('./components/auth/AuthPromptModal'))
import { useAuth } from './context/AuthContext'
import { usePlan } from './context/PlanContext'

// Bridges PlanContext.isPro → AuthContext.setProStatus so conversion limits
// are correctly bypassed for paid users without circular context dependency.
function PlanSyncBridge() {
  const { isPro } = usePlan()
  const { setProStatus } = useAuth()
  useEffect(() => { setProStatus(isPro) }, [isPro, setProStatus])
  return null
}

function App() {
  const { showAuthPrompt, usagePromptType, closeAuthPrompt } = useAuth()

  return (
    <>
      <PlanSyncBridge />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auto-correct" element={<AutoCorrectPage />} />
          <Route path="/auto-deskew" element={<AutoDeskewPage />} />
          <Route path="/excel-to-pdf" element={<ExcelToPdfPage />} />
          <Route path="/pdf-to-word" element={<PdfToWordPage />} />
          <Route path="/split-excel" element={<SplitExcelPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<Navigate to="/dashboard#profile" replace />} />
        </Routes>
      </Suspense>
      <AuthPromptModal isOpen={showAuthPrompt} onClose={closeAuthPrompt} type={usagePromptType ?? 'auth'} />
      <Analytics />
      <SpeedInsights />
    </>
  )
}

export default App
