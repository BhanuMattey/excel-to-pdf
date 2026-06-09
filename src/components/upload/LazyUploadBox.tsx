import { lazy, Suspense, useCallback, useState } from 'react'
import { Upload } from 'lucide-react'

const UploadBoxWithProviders = lazy(() => import('./UploadBoxWithProviders'))

const LazyUploadBox = () => {
  const [ready, setReady] = useState(false)
  const loadUploadBox = useCallback(() => setReady(true), [])

  if (ready) {
    return (
      <Suspense fallback={<UploadSkeleton />}>
        <UploadBoxWithProviders />
      </Suspense>
    )
  }

  return (
    <button
      type="button"
      onClick={loadUploadBox}
      onMouseEnter={loadUploadBox}
      onFocus={loadUploadBox}
      className="relative block w-full max-w-xl mx-auto p-5 sm:p-8 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center transition-colors hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
        <Upload className="w-8 h-8 text-primary-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Drag & drop PDFs here
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Free users can upload PDFs up to 5 MB each
      </p>
      <span className="btn-primary inline-flex">
        <Upload className="w-4 h-4 mr-2" />
        Upload PDFs
      </span>
    </button>
  )
}

const UploadSkeleton = () => (
  <div className="w-full max-w-xl mx-auto p-5 sm:p-8 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-primary-50 rounded-full" />
    <div className="mx-auto mb-3 h-5 w-44 rounded bg-gray-100" />
    <div className="mx-auto mb-6 h-4 w-64 max-w-full rounded bg-gray-100" />
    <div className="mx-auto h-10 w-32 rounded-xl bg-primary-100" />
  </div>
)

export default LazyUploadBox
