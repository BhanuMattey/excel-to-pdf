import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar, Footer } from '../components/layout'
import { FileSpreadsheet, CheckCircle, Download } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { pdfService, downloadBlob } from '../services/api'
import FeatureSelector from '../components/home/FeatureSelector'
import { useGlobalCounter } from '../hooks/useGlobalCounter'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { formatFileSize } from '../utils/helpers'
import { getExcelMaxSize } from '../utils/uploadLimits'

const ExcelToPdfPage = () => {
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([])
  const { isPro } = usePlan()
  const { remainingConversions, loading, consumeConversions } = useGlobalCounter()
  const { checkAndIncrementConversions } = useAuth()
  const maxFileSize = getExcelMaxSize(isPro)
  const freeLimitActive = !isPro
  const freeLimitLabel = formatFileSize(maxFileSize)

  const isValidExcelFile = (file) =>
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls') ||
    file.name.endsWith('.xlsm')

  const onDrop = (acceptedFiles) => {
    const excelFiles = acceptedFiles.filter(isValidExcelFile)

    if (excelFiles.length > 0) {
      setFiles(excelFiles)
      setResults([])
      toast.success(`${excelFiles.length} Excel file${excelFiles.length > 1 ? 's' : ''} uploaded successfully`)
    } else {
      toast.error('Please upload Excel files only (.xlsx, .xls, .xlsm)')
    }
  }

  const onDropRejected = (fileRejections) => {
    fileRejections.forEach(({ file, errors }) => {
      if (errors[0]?.code === 'file-too-large' && freeLimitActive) {
        toast.error(`${file.name} exceeds the ${freeLimitLabel} free limit. Upgrade to upload larger Excel files.`)
        return
      }

      toast.error(`${file.name} is not a valid Excel file.`)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    multiple: true,
    maxSize: maxFileSize
  })

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one Excel file')
      return
    }

    if (freeLimitActive && files.some((file) => file.size > maxFileSize)) {
      toast.error(`Free users can upload Excel files up to ${freeLimitLabel}. Please remove oversized files.`)
      return
    }

    if (!isPro) {
      if (loading) {
        toast.error('Checking your 3 free conversions...')
        return
      }

      if (!checkAndIncrementConversions(files.length)) {
        toast.error('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
        return
      }

      const remaining = remainingConversions ?? 0

      if (remaining <= 0) {
        toast.error('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
        return
      }

      if (files.length > remaining) {
        toast.error(`You only have ${remaining} of your 3 free conversions left. Upgrade to Pro to convert ${files.length} file${files.length === 1 ? '' : 's'}.`)
        return
      }
    }

    setProcessing(true)
    setProgress(0)
    setResults([])

    try {
      const resultBlobs = await pdfService.excelToPdf(files, (progressValue) => {
        setProgress(progressValue)
      })

      if (!isPro) {
        const consumed = await consumeConversions(files.length)
        if (!consumed) {
          throw new Error('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
        }
      }

      setResults(resultBlobs)
      toast.success(`${resultBlobs.length} PDF${resultBlobs.length > 1 ? 's' : ''} converted successfully!`)
    } catch (error) {
      toast.error(error.message || 'Failed to convert Excel to PDF')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (results.length > 0) {
      results.forEach((result, index) => {
        const originalFileName = files[index]?.name || `file_${index + 1}`
        // Remove Excel extension and add .pdf
        const fileName = originalFileName.replace(/\.(xlsx|xls|xlsm)$/i, '') + '_converted.pdf'
        downloadBlob(result.blob, fileName)
      })
      toast.success(`Downloaded ${results.length} file${results.length > 1 ? 's' : ''}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Convert Excel to PDF</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Convert your Excel spreadsheets (.xlsx, .xls, .xlsm) to PDF format with ease.
            </p>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden mb-8"
          >
            <div className="p-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                  isDragActive
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-400 hover:bg-green-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {files.length > 0 ? `${files.length} Excel file${files.length > 1 ? 's' : ''} selected` : 'Drop your Excel files here'}
                </p>
                <p className="text-sm text-gray-500">
                  {files.length > 0 ? 'Click to change files' : 'or click to browse (supports .xlsx, .xls, .xlsm)'}
                </p>
                {freeLimitActive && (
                  <p className="mt-3 text-sm text-amber-600">
                    Free users can upload Excel files up to {freeLimitLabel}.
                  </p>
                )}
                {files.length > 0 && (
                  <div className="mt-4 text-left max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="text-sm text-gray-600 py-1 flex items-center space-x-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{index + 1}. {file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          

          {/* Progress Bar */}
          {processing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden mb-8 p-8"
            >
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600">
                  Converting {files.length} Excel file{files.length > 1 ? 's' : ''} to PDF...
                </span>
                <span className="text-green-600 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* File list with estimated progress */}
              <div className="space-y-2 text-sm">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-gray-600">
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="ml-2 text-green-600">
                      {progress > (index / files.length * 85) ? '✓' : '...'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {!processing && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-2xl shadow-soft overflow-hidden mb-8 p-8"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Successfully Converted {results.length} Excel file{results.length > 1 ? 's' : ''} to PDF!
                  </h3>
                  <div className="space-y-1 text-sm text-green-800">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center items-center gap-4"
          >
            {!processing && results.length === 0 && (
              <button
                onClick={handleProcess}
                disabled={files.length === 0 || (!isPro && (loading || (remainingConversions ?? 0) < files.length))}
                className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
              >
                {`Convert ${files.length > 0 ? files.length : ''} Excel file${files.length !== 1 ? 's' : ''} to PDF`}
              </button>
            )}

            {processing && (
              <button
                disabled
                className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold opacity-75 cursor-not-allowed shadow-lg"
              >
                Converting... {progress}%
              </button>
            )}

            {!processing && results.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setFiles([])
                    setResults([])
                    setProgress(0)
                  }}
                  className="px-8 py-4 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Convert More</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download {results.length > 1 ? `All ${results.length} ` : ''}PDF{results.length > 1 ? 's' : ''}</span>
                </button>
              </>
            )}
          </motion.div>

         

          {/* Feature Selector */}
          <div className="mt-16">
            <FeatureSelector />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ExcelToPdfPage