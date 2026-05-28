import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useUpload } from '../../hooks/useUpload'
import { usePlan } from '../../context/PlanContext'
import { formatFileSize } from '../../utils/helpers'
import { FREE_PDF_SIZE_LIMIT, DEFAULT_PRO_PDF_SIZE_LIMIT } from '../../utils/uploadLimits'
import ProgressBar from './ProgressBar'

const UploadBox = () => {
  const { isPro } = usePlan()
  const {
    uploadState,
    progress,
    currentFiles,
    error,
    uploadFile,
    downloadFile,
    reset,
    isIdle,
    isUploading,
    isProcessing,
    isSuccess,
    isError,
  } = useUpload()

  // ✅ MULTI-FILE DROP
  const maxSize = isPro
    ? parseInt(import.meta.env.VITE_MAX_FILE_SIZE || String(DEFAULT_PRO_PDF_SIZE_LIMIT))
    : FREE_PDF_SIZE_LIMIT

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        uploadFile(acceptedFiles)
      }
    },
    [uploadFile]
  )

  const onDropRejected = useCallback((fileRejections) => {
    fileRejections.forEach(({ file, errors }) => {
      if (errors[0]?.code === 'file-too-large') {
        toast.error(`${file.name} exceeds the ${formatFileSize(maxSize)} free limit.`)
        return
      }

      toast.error(`${file.name} is not a valid PDF file.`)
    })
  }, [maxSize])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize,
    multiple: true,
    noClick: !isIdle,
    noKeyboard: !isIdle,
    disabled: !isIdle,
  })

  const renderContent = () => {

    /* ---------------- IDLE ---------------- */
    if (isIdle) {
    return (
      <motion.div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Drag & drop PDFs here
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {isPro
            ? `Upload one or more PDFs (Max ${formatFileSize(maxSize)} each)`
            : `Free users can upload PDFs up to ${formatFileSize(maxSize)} each`}
        </p>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            open()
          }} 
          className="btn-primary"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload PDFs
        </button>
      </motion.div>
    )
  }

    /* ---------------- UPLOADING / PROCESSING ---------------- */
    if (isUploading || isProcessing) {
      return (
        <motion.div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isUploading ? 'Uploading…' : 'Processing…'}
          </h3>

          {currentFiles.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              {currentFiles.length} PDF file(s)
              <div className="text-xs text-gray-400 mt-1">
                Total size:{' '}
                {formatFileSize(
                  currentFiles.reduce((s, f) => s + f.size, 0)
                )}
              </div>
            </div>
          )}

          <div className="max-w-xs mx-auto">
            <ProgressBar progress={progress} />
          </div>

          <p className="text-sm text-gray-500 mt-4">
            AI is converting your PDFs to Excel…
          </p>
        </motion.div>
      )
    }

    /* ---------------- SUCCESS ---------------- */
    if (isSuccess) {
      return (
        <motion.div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Conversion Complete!
          </h3>

          <p className="text-sm text-gray-500 mb-6">
            {currentFiles.length} Excel file(s) ready for download
          </p>

          <div className="flex justify-center space-x-4">
            <button onClick={downloadFile} className="btn-primary">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </button>

            <button onClick={reset} className="btn-secondary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Convert More
            </button>
          </div>
        </motion.div>
      )
    }

    /* ---------------- ERROR ---------------- */
    if (isError) {
      return (
        <motion.div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Conversion Failed
          </h3>
          <p className="text-sm text-red-500 mb-6">{error}</p>
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
        </motion.div>
      )
    }

    return null
  }

  return (
    <div
      {...getRootProps()}
      className={`relative max-w-xl mx-auto p-8 bg-white rounded-2xl border-2 border-dashed transition-all
        ${isDragActive
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-primary-300'}
        ${!isIdle ? 'cursor-default' : ''}`}
    >
      <input {...getInputProps()} />

      <AnimatePresence>
        {isDragActive && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-primary-50/90 rounded-2xl z-10">
            <Upload className="w-12 h-12 text-primary-600" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  )
}

export default UploadBox
