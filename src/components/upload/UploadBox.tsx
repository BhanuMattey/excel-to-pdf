import { useCallback, useEffect, useState } from 'react'
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

const FACTS = [
  'PDF tables are detected using bounding box analysis across every page.',
  'Multi-page PDFs are processed in parallel for faster results.',
  'Cell merges and colspan spans are preserved in the Excel output.',
  'Number formatting (currency, percentages) is carried over automatically.',
  'Scanned PDFs use OCR to extract text before conversion.',
  'Column widths are estimated from the original PDF layout.',
  'Headers are detected and kept in the first row of each sheet.',
  'Your file never leaves the server — it is deleted after 24 hours.',
  'The Excel file keeps the same sheet order as the PDF pages.',
  'Bold and italic text styles are mapped to Excel cell formatting.',
]

function useCyclingFact(active: boolean) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setIndex(i => (i + 1) % FACTS.length), 4000)
    return () => clearInterval(id)
  }, [active])
  return FACTS[index]
}

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
  const fact = useCyclingFact(isUploading || isProcessing)

  // âœ… MULTI-FILE DROP
  const maxSize = isPro
    ? parseInt(import.meta.env.VITE_MAX_FILE_SIZE || String(DEFAULT_PRO_PDF_SIZE_LIMIT))
    : FREE_PDF_SIZE_LIMIT

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFile(acceptedFiles)
      }
    },
    [uploadFile]
  )

  const onDropRejected = useCallback((fileRejections: { file: File; errors: readonly { code: string }[] }[]) => {
    fileRejections.forEach(({ file, errors }) => {
      if (errors[0]?.code === 'file-too-large') {
        toast.error(`${file.name} exceeds the ${formatFileSize(maxSize)} ${isPro ? 'limit' : 'free limit'}.`)
        return
      }

      toast.error(`${file.name} is not a valid PDF file.`)
    })
  }, [maxSize, isPro])

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
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.18 }}
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
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

          <AnimatePresence mode="wait">
            <motion.p
              key={fact}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="mt-5 text-sm text-gray-500 italic max-w-xs mx-auto"
            >
              <span className="not-italic font-medium text-primary-600">Did you know?</span>{' '}
              {fact}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      )
    }

    /* ---------------- SUCCESS ---------------- */
    if (isSuccess) {
      return (
        <motion.div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Conversion Complete!
          </h3>

          <p className="text-sm text-gray-500 mb-6">
            {currentFiles.length} Excel file(s) ready for download
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:space-x-4 sm:gap-0">
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
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
      className={`relative max-w-xl mx-auto p-5 sm:p-8 bg-white rounded-2xl border-2 border-dashed transition-all duration-200
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

