import { SignupForm } from '../components/auth'
import SEO from '../components/SEO'

const SignupPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <SEO
        title="Create Account — ExcelFromPDF"
        description="Sign up free and get 5 PDF to Excel conversions. No credit card required."
        canonical="/signup"
        noindex={true}
      />
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}

export default SignupPage
