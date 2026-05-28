import { motion } from 'framer-motion'

const ProgressBar = ({ progress }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-600">Progress</span>
        <span className="text-xs font-medium text-primary-600">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
        />
      </div>
    </div>
  )
}

export default ProgressBar
