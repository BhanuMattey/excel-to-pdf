import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Zap, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { useState } from 'react'

const GlobalCounterBanner = () => {
  const GLOBAL_COUNTER_BANNER_DISABLED = true // Testing mode: hide conversion warning banner
  const { user, conversionCount, remainingFreeConversions, FREE_CONVERSION_LIMIT, loading } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (GLOBAL_COUNTER_BANNER_DISABLED) return null
  if (loading || !user) return null // Only show for logged-in users

  const percentage = (remainingFreeConversions / FREE_CONVERSION_LIMIT) * 100
  const isLow = percentage <= 20 && percentage > 0
  const isExhausted = remainingFreeConversions <= 0

  // Only show when running low or exhausted
  if (!isLow && !isExhausted) return null
  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-40 max-w-md"
      >
        <div className={`relative overflow-hidden rounded-lg shadow-xl ${
          isExhausted
            ? 'bg-gradient-to-r from-red-500 to-red-600'
            : 'bg-gradient-to-r from-orange-500 to-orange-600'
        }`}>
          <div className="px-4 py-3">
            <div className="flex items-start gap-3">
              {isExhausted ? (
                <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              ) : (
                <Zap className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {isExhausted ? 'No conversions remaining!' : 'Running low on conversions'}
                </p>
                <p className="text-xs text-white/90 mt-1">
                  {isExhausted 
                    ? 'Upgrade to Pro for unlimited conversions'
                    : `Only ${remainingFreeConversions} of ${FREE_CONVERSION_LIMIT} conversions left`
                  }
                </p>
                <Link
                  to="/pricing"
                  className="inline-block mt-2 bg-white text-orange-600 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  Upgrade Now →
                </Link>
              </div>

              <button
                onClick={() => setDismissed(true)}
                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar for low state */}
          {isLow && !isExhausted && (
            <div className="h-1 bg-white/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white/60"
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default GlobalCounterBanner
