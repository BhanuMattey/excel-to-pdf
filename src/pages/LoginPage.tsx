import { LoginForm } from '../components/auth'

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
