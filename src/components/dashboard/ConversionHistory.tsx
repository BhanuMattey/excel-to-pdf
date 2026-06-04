import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, CheckCircle, XCircle, Clock, Loader2, Timer } from 'lucide-react'
import { conversionService, r2Service, ConversionRecord } from '../../services/db'
import { useAuth } from '../../context/AuthContext'
import { formatDate, truncateFilename, formatFileSize } from '../../utils/helpers'
import toast from 'react-hot-toast'

// Returns { expired, label } for a given expiresAt ISO string
function expiryInfo(expiresAt: string | null | undefined): { expired: boolean; label: string } {
  if (!expiresAt) return { expired: false, label: '' }
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return { expired: true, label: 'File expired' }
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return { expired: false, label: `Expires in ${h}h ${m}m` }
  return { expired: false, label: `Expires in ${m}m` }
}

const ConversionHistory = () => {
  const { user } = useAuth()
  const [conversions, setConversions] = useState<ConversionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loadConversions = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const data = await conversionService.getUserConversions(user.id)
      setConversions(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setConversions([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadConversions() }, [loadConversions])

  const handleDownload = async (conv: ConversionRecord) => {
    if (!conv.r2_key) return
    setDownloadingId(conv.id)
    try {
      // Refresh the presigned URL (original may have expired)
      const { url } = await r2Service.getDownloadUrl(conv.r2_key)
      const a = document.createElement('a')
      a.href = url
      a.download = conv.file_name.replace(/\.pdf$/i, '.xlsx')
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      toast.error('Could not generate download link. The file may have been removed.')
    } finally {
      setDownloadingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
      case 'failed':    return <XCircle className="w-4 h-4 text-red-500 shrink-0" />
      default:          return <Clock className="w-4 h-4 text-amber-500 shrink-0" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      failed:    'bg-red-100 text-red-700',
      processing: 'bg-amber-100 text-amber-700',
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
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
        <p className="text-gray-500 text-sm">Check the console for details, or try refreshing.</p>
      </div>
    )
  }

  if (conversions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversions yet</h3>
        <p className="text-gray-500 text-sm">Your conversion history will appear here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="space-y-3 md:hidden">
        {conversions.map((conv, index) => {
          const { expired, label } = expiryInfo(conv.expires_at)
          const canDownload = conv.status === 'completed' && conv.r2_key && !expired

          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-gray-100 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(conv.status)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {truncateFilename(conv.file_name, 34)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(conv.created_at)} · {conv.file_size ? formatFileSize(conv.file_size) : 'Size unknown'}
                  </p>
                </div>
                {getStatusBadge(conv.status)}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                {conv.expires_at ? (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${expired ? 'text-gray-400' : 'text-amber-600'}`}>
                    <Timer className="w-3 h-3" />
                    {label}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">No expiry</span>
                )}

                {conv.status === 'completed' ? (
                  canDownload ? (
                    <button
                      onClick={() => handleDownload(conv)}
                      disabled={downloadingId === conv.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 disabled:opacity-50"
                    >
                      {downloadingId === conv.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />}
                      {downloadingId === conv.id ? 'Preparing' : 'Download'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <XCircle className="w-3.5 h-3.5" />
                      {conv.r2_key ? 'File expired' : 'No file stored'}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-gray-400">Not ready</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File expiry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Download</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {conversions.map((conv, index) => {
              const { expired, label } = expiryInfo(conv.expires_at)
              const canDownload = conv.status === 'completed' && conv.r2_key && !expired

              return (
                <motion.tr
                  key={conv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* File name */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(conv.status)}
                      <span className="text-sm font-medium text-gray-900">
                        {truncateFilename(conv.file_name, 36)}
                      </span>
                    </div>
                  </td>

                  {/* File size */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conv.file_size ? formatFileSize(conv.file_size) : '—'}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(conv.created_at)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(conv.status)}
                  </td>

                  {/* Expiry */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {conv.expires_at ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${expired ? 'text-gray-400' : 'text-amber-600'}`}>
                        <Timer className="w-3 h-3" />
                        {label}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Download */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {conv.status === 'completed' ? (
                      canDownload ? (
                        <button
                          onClick={() => handleDownload(conv)}
                          disabled={downloadingId === conv.id}
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                        >
                          {downloadingId === conv.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Download className="w-4 h-4" />}
                          {downloadingId === conv.id ? 'Preparing…' : 'Download'}
                        </button>
                      ) : !conv.r2_key ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <XCircle className="w-3.5 h-3.5" />
                          No file stored
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <XCircle className="w-3.5 h-3.5" />
                          File expired
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 px-1 text-xs text-gray-400 sm:px-4">
        Converted files are stored for 24 hours and then permanently deleted. The history record always remains.
      </p>
    </div>
  )
}

export default ConversionHistory
