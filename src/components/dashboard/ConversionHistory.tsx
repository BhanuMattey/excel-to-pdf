import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, CheckCircle, XCircle, Clock, Loader2, RefreshCw, Search, Timer, X } from 'lucide-react'
import { conversionService, r2Service, ConversionRecord } from '../../services/db'
import { useAuth } from '../../context/AuthContext'
import { formatDate, truncateFilename, formatFileSize } from '../../utils/helpers'
import { withExcelAdvertisingSuffix } from '../../utils/fileNames'
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

type StatusFilter = 'all' | 'completed' | 'processing' | 'failed'

const filterOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'processing', label: 'Processing' },
  { key: 'failed', label: 'Failed' },
]

const ConversionHistory = () => {
  const { user } = useAuth()
  const [conversions, setConversions] = useState<ConversionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadConversions()
    setRefreshing(false)
  }

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: conversions.length, completed: 0, processing: 0, failed: 0 }
    for (const conv of conversions) {
      if (conv.status === 'completed') counts.completed++
      else if (conv.status === 'failed') counts.failed++
      else counts.processing++
    }
    return counts
  }, [conversions])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return conversions.filter((conv) => {
      if (statusFilter === 'completed' && conv.status !== 'completed') return false
      if (statusFilter === 'failed' && conv.status !== 'failed') return false
      if (statusFilter === 'processing' && (conv.status === 'completed' || conv.status === 'failed')) return false
      if (query && !conv.file_name.toLowerCase().includes(query)) return false
      return true
    })
  }, [conversions, search, statusFilter])

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all'

  const handleDownload = async (conv: ConversionRecord) => {
    if (!conv.r2_key && !conv.output_url) return
    setDownloadingId(conv.id)
    try {
      const { url } = conv.r2_key
        ? await r2Service.getDownloadUrl(conv.r2_key)
        : { url: conv.output_url! }
      const a = document.createElement('a')
      a.href = url
      a.download = getHistoryDownloadName(conv)
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      toast.error('Could not generate download link. The file may have been removed.')
    } finally {
      setDownloadingId(null)
    }
  }

  const getHistoryDownloadName = (conv: ConversionRecord) => {
    if (conv.r2_key?.toLowerCase().endsWith('.zip')) {
      return conv.file_name.replace(/\.(xlsx|xls)$/i, '_split.zip')
    }

    if (conv.file_name.toLowerCase().endsWith('.pdf')) {
      return withExcelAdvertisingSuffix(conv.file_name.replace(/\.pdf$/i, '.xlsx'))
    }

    return conv.file_name
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
      case 'failed':    return <XCircle className="w-4 h-4 text-red-500 shrink-0" />
      default:          return <Clock className="w-4 h-4 text-amber-500 shrink-0" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { badge: string; dot: string }> = {
      completed:  { badge: 'border-green-100 bg-green-50 text-green-700', dot: 'bg-green-600' },
      failed:     { badge: 'border-red-100 bg-red-50 text-red-700', dot: 'bg-red-500' },
      processing: { badge: 'border-amber-100 bg-amber-50 text-amber-700', dot: 'bg-amber-500 animate-pulse' },
    }
    const style = styles[status] ?? { badge: 'border-gray-100 bg-gray-50 text-gray-600', dot: 'bg-gray-400' }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
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
      <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green-50 to-brand-teal-50 ring-1 ring-brand-green-100">
          <FileText className="h-6 w-6 text-brand-green-700" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversions yet</h3>
        <p className="text-gray-500 text-sm">Convert your first PDF above — it will show up here.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar: search + status filters + refresh */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-600"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => {
            const active = statusFilter === option.key
            const count = statusCounts[option.key]
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setStatusFilter(option.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'border-brand-green-200 bg-gradient-to-r from-brand-green-50 to-brand-teal-50 text-brand-green-800 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {option.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? 'bg-brand-green-100 text-brand-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
            aria-label="Refresh history"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <h3 className="mb-1 text-sm font-semibold text-gray-900">No matching conversions</h3>
          <p className="mb-4 text-xs text-gray-500">Try a different search term or filter.</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setStatusFilter('all') }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: capped scrollable card list */}
          <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1 scrollbar-thin md:hidden">
            {filtered.map((conv, index) => {
              const { expired, label } = expiryInfo(conv.expires_at)
              const canDownload = conv.status === 'completed' && (conv.r2_key || conv.output_url) && !expired

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 8) * 0.03 }}
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
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-green-100 bg-gradient-to-r from-brand-green-50 to-brand-teal-50 px-3 py-1.5 text-xs font-bold text-brand-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50"
                        >
                          {downloadingId === conv.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />}
                          {downloadingId === conv.id ? 'Preparing' : 'Download'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <XCircle className="w-3.5 h-3.5" />
                          {conv.r2_key || conv.output_url ? 'File expired' : 'No file stored'}
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

          {/* Desktop: capped scrollable table with sticky header */}
          <div className="hidden rounded-xl border border-gray-100 md:block">
            <div className="max-h-[22rem] overflow-y-auto scrollbar-thin">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">File</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">File expiry</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filtered.map((conv, index) => {
                    const { expired, label } = expiryInfo(conv.expires_at)
                    const canDownload = conv.status === 'completed' && (conv.r2_key || conv.output_url) && !expired

                    return (
                      <motion.tr
                        key={conv.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index, 8) * 0.03 }}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        {/* File name */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(conv.status)}
                            <span className="text-sm font-medium text-gray-900">
                              {truncateFilename(conv.file_name, 36)}
                            </span>
                          </div>
                        </td>

                        {/* File size */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                          {conv.file_size ? formatFileSize(conv.file_size) : '—'}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(conv.created_at)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(conv.status)}
                        </td>

                        {/* Expiry */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
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
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          {conv.status === 'completed' ? (
                            canDownload ? (
                              <button
                                onClick={() => handleDownload(conv)}
                                disabled={downloadingId === conv.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-green-100 bg-gradient-to-r from-brand-green-50 to-brand-teal-50 px-3 py-1.5 text-xs font-bold text-brand-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0"
                              >
                                {downloadingId === conv.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Download className="w-3.5 h-3.5" />}
                                {downloadingId === conv.id ? 'Preparing…' : 'Download'}
                              </button>
                            ) : !conv.r2_key && !conv.output_url ? (
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
          </div>
        </>
      )}

      <div className="mt-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-400">
          Converted files are stored for 24 hours and then permanently deleted. The history record always remains.
        </p>
        <p className="shrink-0 text-xs font-medium text-gray-400">
          Showing {filtered.length} of {conversions.length}
        </p>
      </div>
    </div>
  )
}

export default ConversionHistory
