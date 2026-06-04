import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileCheck, Gift, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePlan } from '../../context/PlanContext'

function planLabel(planId: string | null | undefined) {
  if (!planId) return 'Professional'
  if (planId.includes('yearly')) return 'Professional (Yearly)'
  return 'Professional (Monthly)'
}

const UsageStats = () => {
  const { user, conversionCount, remainingFreeConversions, FREE_CONVERSION_LIMIT, isPro } = useAuth()
  const { planProfile } = usePlan()

  if (isPro) {
    const renewalDate = planProfile?.renewalDate
      ? new Date(planProfile.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #166534 0%, #0e7490 60%, #0d9488 100%)' }}
      >
        <div className="px-4 py-5 flex flex-col gap-5 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#86efac' }}>Active Plan</p>
              <p className="text-lg font-bold text-white">{planLabel(planProfile?.planId)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center lg:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{conversionCount}</p>
              <p className="text-xs" style={{ color: '#86efac' }}>Total conversions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">∞</p>
              <p className="text-xs" style={{ color: '#86efac' }}>Remaining</p>
            </div>
            {renewalDate && (
              <div className="text-center">
                <p className="text-sm font-bold text-white">{renewalDate}</p>
                <p className="text-xs" style={{ color: '#86efac' }}>
                  {planProfile?.subscriptionStatus === 'cancelled' ? 'Access until' : 'Next renewal'}
                </p>
              </div>
            )}
          </div>
          <Link
            to="/dashboard#profile"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/20 sm:w-auto lg:ml-4"
          >
            <Zap className="w-3.5 h-3.5" />
            Manage Plan
          </Link>
        </div>
      </motion.div>
    )
  }

  const usagePercentage = Math.min(100, (conversionCount / (FREE_CONVERSION_LIMIT || 5)) * 100)

  const stats = [
    {
      icon: FileCheck,
      label: 'Total Conversions',
      value: conversionCount,
      color: 'bg-brand-teal-100',
      iconColor: 'text-brand-teal-700',
    },
    {
      icon: Gift,
      label: 'Free Remaining',
      value: remainingFreeConversions,
      color: 'bg-brand-green-100',
      iconColor: 'text-brand-green-700',
    },
    {
      icon: TrendingUp,
      label: 'Free Limit',
      value: FREE_CONVERSION_LIMIT,
      color: 'bg-brand-amber-100',
      iconColor: 'text-brand-amber-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-center">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mr-4`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h3 className="text-sm font-medium text-gray-700 mb-3">Free Usage</h3>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 50 ? 'bg-amber-500' : 'bg-green-500'
            }`}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">{conversionCount} of {FREE_CONVERSION_LIMIT} used</span>
          <span className="text-xs text-gray-500">{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {user
              ? 'Logged-in users get up to 5 free conversions.'
              : 'Guest users get 3 free conversions. Sign in to unlock up to 5 total.'
            }
          </p>
          <Link to="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-green-700 hover:underline">
            <Sparkles className="w-3 h-3" /> Upgrade
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default UsageStats
