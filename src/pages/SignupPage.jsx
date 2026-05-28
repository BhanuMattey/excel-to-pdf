import { SignupForm } from '../components/auth'

const SignupPage = () => {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}

export default SignupPage
