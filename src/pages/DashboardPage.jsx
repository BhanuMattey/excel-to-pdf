import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Navbar, Footer } from '../components/layout'
import { UsageStats, ConversionHistory } from '../components/dashboard'
import { UploadBox } from '../components/upload'

const DashboardPage = () => {
  const { user, profile } = useAuth()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-600">
              Manage your PDF conversions and track your usage.
            </p>
          </motion.div>

          {/* Usage Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <UsageStats />
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="card">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <Upload className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Convert a PDF
                  </h2>
                  <p className="text-sm text-gray-500">
                    Upload a PDF file to convert it to Excel
                  </p>
                </div>
              </div>
              <UploadBox />
            </div>
          </motion.div>

          {/* Conversion History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Conversion History
              </h2>
              <ConversionHistory />
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default DashboardPage
