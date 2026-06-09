import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isValidEmail, validatePassword } from '../../utils/helpers'
import toast from 'react-hot-toast'

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

const SignupForm = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const newErrors: FormErrors = {}
    if (!fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!email) newErrors.email = 'Email is required'
    else if (!isValidEmail(email)) newErrors.email = 'Invalid email format'
    if (!password) {
      newErrors.password = 'Password is required'
    } else {
      const pv = validatePassword(password)
      if (!pv.valid) newErrors.password = pv.message
    }
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await signUp(email.trim(), password, fullName.trim())
      toast.success('Account created! Sign in to continue.')
      navigate('/login', { replace: true, state: { email } })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Signup failed. Please try again.'
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
        <h2 className="text-2xl font-semibold text-gray-950 mb-1">Create your account</h2>
        <p className="text-sm text-gray-500">Save conversion history and get started for free.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`input-field pl-9 ${errors.fullName ? 'border-red-400' : ''}`}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input-field pl-9 ${errors.email ? 'border-red-400' : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input-field pl-9 pr-10 ${errors.password ? 'border-red-400' : ''}`}
              placeholder="Create a password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input-field pl-9 ${errors.confirmPassword ? 'border-red-400' : ''}`}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
          ) : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-green-700 hover:text-brand-green-800">Sign in</Link>
      </p>
    </motion.div>
  )
}

export default SignupForm
