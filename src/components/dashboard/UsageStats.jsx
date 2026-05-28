import { motion } from 'framer-motion'
import { FileCheck, Gift, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const UsageStats = () => {
  const { conversionCount, remainingFreeConversions, FREE_CONVERSION_LIMIT } = useAuth()

  const usagePercentage = Math.min(100, (conversionCount / FREE_CONVERSION_LIMIT) * 100)

  const stats = [
    {
      icon: FileCheck,
      label: 'Total Conversions',
      value: conversionCount,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Gift,
      label: 'Free Remaining',
      value: remainingFreeConversions,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: TrendingUp,
      label: 'Free Limit',
      value: FREE_CONVERSION_LIMIT,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Usage Progress */}
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
              usagePercentage > 80
                ? 'bg-red-500'
                : usagePercentage > 50
                ? 'bg-amber-500'
                : 'bg-green-500'
            }`}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">
            {conversionCount} of {FREE_CONVERSION_LIMIT} used
          </span>
          <span className="text-xs text-gray-500">{usagePercentage.toFixed(1)}%</span>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Every user gets 3 free conversions. Upgrade to Pro for unlimited conversions.
        </p>
      </motion.div>
    </div>
  )
}

export default UsageStats
