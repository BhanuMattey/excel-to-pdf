import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { conversionService } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate, truncateFilename } from '../../utils/helpers'

const ConversionHistory = () => {
  const { user } = useAuth()
  const [conversions, setConversions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadConversions = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        const data = await conversionService.getUserConversions(user.id)
        setConversions(data || [])
        setError(null)
      } catch (error) {
        console.error('Error loading conversions:', error)
        setError(error.message)
        setConversions([])
      } finally {
        setLoading(false)
      }
    }

    loadConversions()
  }, [user])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'processing':
        return <Clock className="w-5 h-5 text-amber-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      processing: 'bg-amber-100 text-amber-700',
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load history</h3>
        <p className="text-gray-500 text-sm mb-4">
          Database tables may not be set up yet. Check the console for details.
        </p>
        <a 
          href="https://github.com/yourusername/excelfrompdf#database-setup" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          View setup instructions →
        </a>
      </div>
    )
  }

  if (conversions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversions yet</h3>
        <p className="text-gray-500">Your conversion history will appear here</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {conversions.map((conversion, index) => (
              <motion.tr
                key={conversion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(conversion.status)}
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {truncateFilename(conversion.file_name, 40)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {formatDate(conversion.created_at)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(conversion.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {conversion.status === 'completed' && conversion.output_url && (
                    <a
                      href={conversion.output_url}
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </a>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ConversionHistory
