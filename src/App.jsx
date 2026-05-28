import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import PricingPage from './pages/PricingPage'
import CheckoutPage from './pages/CheckoutPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import AutoCorrectPage from './pages/AutoCorrectPage'
import AutoDeskewPage from './pages/AutoDeskewPage'
import SplitExcelPage from './pages/SplitExcelPage'
import ExcelToPdfPage from './pages/ExcelToPdfPage'
import PdfToWordPage from './pages/PdfToWordPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { AuthPromptModal } from './components/auth'
import { GlobalCounterBanner } from './components/layout'
import { useAuth } from './context/AuthContext'

function App() {
  const { showAuthPrompt, closeAuthPrompt } = useAuth()

  return (
    <>
      <GlobalCounterBanner />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/auto-correct" element={<AutoCorrectPage />} />
        <Route path="/auto-deskew" element={<AutoDeskewPage />} />
        <Route path="/excel-to-pdf" element={<ExcelToPdfPage />} />
        <Route path="/pdf-to-word" element={<PdfToWordPage />} />
        <Route path="/split-excel" element={<SplitExcelPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      
      {/* Auth Prompt Modal */}
      <AuthPromptModal isOpen={showAuthPrompt} onClose={closeAuthPrompt} />
    </>
  )
}

export default App
