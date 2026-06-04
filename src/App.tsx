import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import PricingPage from './pages/PricingPage'
import CheckoutPage from './pages/CheckoutPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AutoCorrectPage from './pages/AutoCorrectPage'
import AutoDeskewPage from './pages/AutoDeskewPage'
import SplitExcelPage from './pages/SplitExcelPage'
import ExcelToPdfPage from './pages/ExcelToPdfPage'
import PdfToWordPage from './pages/PdfToWordPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { AuthPromptModal } from './components/auth'
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
  const { showAuthPrompt, closeAuthPrompt } = useAuth()

  return (
    <>
      <PlanSyncBridge />
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
      <AuthPromptModal isOpen={showAuthPrompt} onClose={closeAuthPrompt} />
    </>
  )
}

export default App
