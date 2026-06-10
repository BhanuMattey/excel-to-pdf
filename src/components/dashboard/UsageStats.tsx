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
  const { planProfile, planLoading } = usePlan()

  if (planLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl mr-4" />
                <div className="space-y-2">
                  <div className="h-6 w-10 bg-gray-100 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="card animate-pulse h-24" />
      </div>
    )
  }

  if (isPro) {
    const renewalDate = planProfile?.renewalDate
      ? new Date(planProfile.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gray-950 shadow-xl shadow-gray-950/10"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
        <div className="pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full bg-brand-green-600/30 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-brand-teal-600/30 blur-3xl animate-blob-slow" />
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative flex flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg ring-1 ring-white/15" style={{ background: 'linear-gradient(135deg, #16a34a, #0d9488)' }}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-green-300">Active Plan</p>
              <p className="text-lg font-bold text-white">{planLabel(planProfile?.planId)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center lg:gap-0 lg:divide-x lg:divide-white/10">
            <div className="text-center lg:px-6">
              <p className="text-2xl font-bold text-white">{conversionCount}</p>
              <p className="text-xs text-brand-green-300">Total conversions</p>
            </div>
            <div className="text-center lg:px-6">
              <p className="text-2xl font-bold text-white">∞</p>
              <p className="text-xs text-brand-green-300">Remaining</p>
            </div>
            {renewalDate && (
              <div className="text-center lg:px-6">
                <p className="text-sm font-bold text-white">{renewalDate}</p>
                <p className="text-xs text-brand-green-300">
                  {planProfile?.subscriptionStatus === 'cancelled' ? 'Access until' : 'Next renewal'}
                </p>
              </div>
            )}
          </div>
          <Link
            to="/dashboard#profile"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-white/20 sm:w-auto lg:ml-4"
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
      gradient: 'linear-gradient(135deg, #0e7490, #0d9488)',
    },
    {
      icon: Gift,
      label: 'Free Remaining',
      value: remainingFreeConversions,
      gradient: 'linear-gradient(135deg, #166534, #16a34a)',
    },
    {
      icon: TrendingUp,
      label: 'Free Limit',
      value: FREE_CONVERSION_LIMIT,
      gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
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
            className="group card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-950/5"
          >
            <div className="flex items-center">
              <div
                className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                style={{ background: stat.gradient }}
              >
                <stat.icon className="w-6 h-6" />
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
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Free Usage</h3>
          <span className={`text-xs font-bold ${usagePercentage > 80 ? 'text-red-600' : usagePercentage > 50 ? 'text-amber-600' : 'text-brand-green-700'}`}>
            {usagePercentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative h-full overflow-hidden rounded-full"
            style={{
              background:
                usagePercentage > 80
                  ? 'linear-gradient(to right, #ef4444, #f97316)'
                  : usagePercentage > 50
                    ? 'linear-gradient(to right, #d97706, #f59e0b)'
                    : 'linear-gradient(to right, #166534, #0d9488)',
            }}
          >
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </motion.div>
        </div>
        <p className="mt-2 text-xs text-gray-500">{conversionCount} of {FREE_CONVERSION_LIMIT} free conversions used</p>
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand-green-100 bg-gradient-to-r from-brand-green-50 to-brand-teal-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-brand-green-800">
            {user
              ? 'Logged-in users get up to 5 free conversions.'
              : 'Guest users get 3 free conversions. Sign in to unlock up to 5 total.'
            }
          </p>
          <Link
            to="/pricing"
            className="btn-shine inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-green-700 to-brand-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <Sparkles className="w-3 h-3" /> Upgrade
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default UsageStats
