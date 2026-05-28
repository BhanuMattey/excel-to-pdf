import { motion } from 'framer-motion'
import UploadBox from '../upload/UploadBox'
import FeatureSelector from './FeatureSelector'

const Hero = () => {
  return (
    <section className="relative min-h-screen gradient-bg pt-24 pb-16 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
         

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
          >
            Convert PDF to Excel
            <br />
            <span className="gradient-text">Instantly</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto text-lg text-gray-600 mb-12"
          >
            Stop manual data entry. Drag and drop your PDFs to extract complex tables
            into editable Excel spreadsheets with 90% accuracy.
          </motion.p>

          {/* Floating PDF/Excel illustrations */}
          <div className="relative">
            {/* Left floating PDF */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="hidden lg:block absolute -left-4 top-0 transform -translate-y-1/2"
            >
              <div className="relative">
                <div className="w-48 h-32 bg-white rounded-xl shadow-lg border border-gray-100 p-4 animate-float">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500">PDF</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded w-full" />
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right floating Excel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="hidden lg:block absolute -right-4 top-0 transform -translate-y-1/4"
            >
              <div className="relative">
                <div className="w-52 h-40 bg-white rounded-xl shadow-lg border border-gray-100 p-4 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 9h-2v2H9v-2H7v-2h2V7h2v2h2v2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500">Excel</span>
                  </div>
                  {/* Mini spreadsheet */}
                  <div className="grid grid-cols-4 gap-px bg-gray-200 rounded overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-4 ${i < 4 ? 'bg-green-50' : 'bg-white'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Upload Box */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative z-10"
            >
              <UploadBox />
              
              {/* Feature Selector */}
              <FeatureSelector />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
