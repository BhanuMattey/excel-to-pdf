import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Shield, Clock, Sparkles, Infinity } from 'lucide-react'
import { Link } from 'react-router-dom'

type PromptType = 'auth' | 'pro'

const AuthPromptModal = ({
  isOpen,
  onClose,
  type = 'auth',
}: {
  isOpen: boolean
  onClose: () => void
  type?: PromptType
}) => {
  if (!isOpen) return null

  const isProPrompt = type === 'pro'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center">
            <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${isProPrompt ? 'bg-emerald-100' : 'bg-primary-100'}`}>
              {isProPrompt ? (
                <Sparkles className="h-8 w-8 text-emerald-700" />
              ) : (
                <Zap className="h-8 w-8 text-primary-600" />
              )}
            </div>

            <h2 className="mb-3 text-2xl font-bold text-gray-900">
              {isProPrompt ? 'You have used all 5 free conversions' : 'Unlock 2 More Free Conversions!'}
            </h2>

            <p className="mb-6 text-gray-600">
              {isProPrompt ? (
                <>Upgrade to Pro to keep converting without limits, remove watermarks, and process larger files.</>
              ) : (
                <>You've used your 3 free conversions. Sign up or log in to unlock <strong>2 more free conversions</strong> (5 total) - no payment needed!</>
              )}
            </p>

            <div className="mb-8 space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${isProPrompt ? 'bg-emerald-100' : 'bg-primary-100'}`}>
                  {isProPrompt ? (
                    <Infinity className="h-3 w-3 text-emerald-700" />
                  ) : (
                    <Zap className="h-3 w-3 text-primary-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{isProPrompt ? 'Unlimited Conversions' : '2 More Free Conversions'}</p>
                  <p className="text-xs text-gray-500">{isProPrompt ? 'Convert repeat batches without rationing usage' : 'Get 5 total free conversions, no card required'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                  <Shield className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{isProPrompt ? 'No Watermarks' : 'Secure & Private'}</p>
                  <p className="text-xs text-gray-500">{isProPrompt ? 'Download cleaner exports ready for work' : 'Files are not stored for more than 24 hours'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-teal-100">
                  <Clock className="h-3 w-3 text-brand-teal-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{isProPrompt ? 'Larger Files' : 'Access History'}</p>
                  <p className="text-xs text-gray-500">{isProPrompt ? 'Use higher limits for heavier documents' : 'View and download past conversions'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isProPrompt ? (
                <Link
                  to="/pricing"
                  className="block w-full rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-emerald-800 hover:shadow-xl"
                >
                  Get Pro Subscription
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="block w-full rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-primary-700 hover:shadow-xl"
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    to="/login"
                    className="block w-full rounded-xl border-2 border-primary-200 bg-white px-6 py-3 font-semibold text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    Login
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="block w-full px-6 py-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                {isProPrompt ? 'Not now' : 'Maybe later'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default AuthPromptModal
