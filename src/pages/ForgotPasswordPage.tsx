import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { isValidEmail } from '../utils/helpers'
import toast from 'react-hot-toast'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) { setError('Email is required'); return }
    if (!isValidEmail(email)) { setError('Enter a valid email address'); return }

    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), redirectTo }),
      })

      // better-auth returns 200 even if email doesn't exist (security), so treat any 2xx as success
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(data.message || 'Failed to send reset email. Please try again.')
      }

      setSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <div className="mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-8">
                <img src="/logo.png" alt="ExcelfromPDF" className="h-14 w-auto" />
              </Link>

              {sent ? (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-950 mb-2">Check your email</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
                  </p>
                  <p className="mt-3 text-xs text-gray-400">
                    Didn't receive it? Check your spam folder or{' '}
                    <button
                      onClick={() => setSent(false)}
                      className="text-brand-green-700 font-medium hover:underline"
                    >
                      try again
                    </button>
                    .
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-gray-950 mb-1">Forgot your password?</h2>
                  <p className="text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
                </>
              )}
            </div>

            {!sent && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`input-field pl-9 ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
