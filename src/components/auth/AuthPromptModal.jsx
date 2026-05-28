import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Shield, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const AuthPromptModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Zap className="w-8 h-8 text-primary-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Free Trial Complete!
            </h2>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              You've used your 3 free conversions. Sign up now to unlock unlimited conversions and premium features!
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                  <Zap className="w-3 h-3 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Unlimited Conversions</p>
                  <p className="text-xs text-gray-500">Convert as many files as you need</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <Shield className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure & Private</p>
                  <p className="text-xs text-gray-500">Your files are encrypted and secure</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <Clock className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Access History</p>
                  <p className="text-xs text-gray-500">View and download past conversions</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Link
                to="/signup"
                className="block w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Sign Up Free
              </Link>
              <Link
                to="/login"
                className="block w-full px-6 py-3 bg-white text-primary-600 border-2 border-primary-200 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
              >
                Login
              </Link>
              <button
                onClick={onClose}
                className="block w-full px-6 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default AuthPromptModal
