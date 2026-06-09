import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isValidEmail } from '../../utils/helpers'
import toast from 'react-hot-toast'

interface LoginErrors {
  email?: string
  password?: string
  general?: string
}

interface LocationState {
  from?: {
    pathname?: string
  }
}

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const redirectTo = locationState?.from?.pathname || '/dashboard'

  const validate = () => {
    const newErrors: LoginErrors = {}
    if (!email) newErrors.email = 'Email is required'
    else if (!isValidEmail(email)) newErrors.email = 'Invalid email format'
    if (!password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      toast.success('Welcome back!')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed. Please check your credentials.'
      toast.error(msg)
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src="/logo-64.webp" alt="ExcelfromPDF" className="h-14 w-auto" width="64" height="64" />
        </Link>
        <h2 className="text-2xl font-semibold text-gray-950 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500">Sign in to your account to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input-field pl-9 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-brand-green-700 hover:text-brand-green-800 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input-field pl-9 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="Enter your password"
              autoComplete="current-password"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-brand-green-700 hover:text-brand-green-800">
          Sign up free
        </Link>
      </p>
    </motion.div>
  )
}

export default LoginForm
