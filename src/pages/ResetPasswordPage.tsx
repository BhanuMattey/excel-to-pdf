import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { validatePassword } from '../utils/helpers'
import toast from 'react-hot-toast'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; general?: string }>({})

  useEffect(() => {
    if (!token) {
      setErrors({ general: 'Invalid or missing reset token. Please request a new reset link.' })
    }
  }, [token])

  const validate = () => {
    const e: typeof errors = {}
    if (!password) {
      e.password = 'Password is required'
    } else {
      const pv = validatePassword(password)
      if (!pv.valid) e.password = pv.message
    }
    if (!confirmPassword) e.confirm = 'Please confirm your password'
    else if (password !== confirmPassword) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(data.message || 'Failed to reset password. The link may have expired.')
      }

      setDone(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(msg)
      setErrors({ general: msg })
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

              {done ? (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mb-4">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-950 mb-2">Password reset!</h2>
                  <p className="text-sm text-gray-500">Your password has been updated. Redirecting you to sign in…</p>
                </>
              ) : !token ? (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mb-4">
                    <AlertCircle className="w-7 h-7 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-950 mb-2">Invalid link</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    This password reset link is invalid or has expired.
                  </p>
                  <Link to="/forgot-password" className="btn-primary py-2.5 inline-flex items-center justify-center w-full">
                    Request a new link
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-gray-950 mb-1">Set new password</h2>
                  <p className="text-sm text-gray-500">Choose a strong password for your account.</p>
                </>
              )}
            </div>

            {token && !done && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {errors.general}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`input-field pl-9 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="Create a new password"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`input-field pl-9 ${errors.confirm ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </form>
            )}

            {!done && (
              <p className="mt-6 text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-brand-green-700 hover:text-brand-green-800">
                  Sign in
                </Link>
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
