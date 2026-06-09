import { LoginForm } from '../components/auth'
import SEO from '../components/SEO'

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <SEO
        title="Sign In — ExcelFromPDF"
        description="Sign in to your ExcelFromPDF account to access your conversion history and Pro features."
        canonical="/login"
        noindex={true}
      />
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
