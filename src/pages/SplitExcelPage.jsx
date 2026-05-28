import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar, Footer } from '../components/layout'
import { SplitSquareHorizontal, CheckCircle, Download } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { pdfService, downloadBlob } from '../services/api'
import FeatureSelector from '../components/home/FeatureSelector'
import { useGlobalCounter } from '../hooks/useGlobalCounter'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { formatFileSize } from '../utils/helpers'
import { getExcelMaxSize } from '../utils/uploadLimits'

const SplitExcelPage = () => {
  const [files, setFiles] = useState([]) // Array of {id, file, sheetIndex, columnIndex}
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([]) // Array of {fileName, blob}
  const { isPro } = usePlan()
  const { remainingConversions, loading, consumeConversions } = useGlobalCounter()
  const { checkAndIncrementConversions } = useAuth()
  const maxFileSize = getExcelMaxSize(isPro)
  const freeLimitActive = !isPro
  const freeLimitLabel = formatFileSize(maxFileSize)

  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]

  const isValidExcelFile = (selectedFile) =>
    validTypes.includes(selectedFile.type) ||
    selectedFile.name.endsWith('.xlsx') ||
    selectedFile.name.endsWith('.xls')

  const onDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles
      .filter(selectedFile => {
        if (isValidExcelFile(selectedFile)) {
          return true
        }

        toast.error(`${selectedFile.name} is not a valid Excel file`)
        return false
      })
      .map((file, index) => ({
        id: Date.now() + index,
        file,
        sheetIndex: '1',
        columnIndex: '3'
      }))

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
      setResults([])
      toast.success(`${newFiles.length} Excel file(s) uploaded successfully`)
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
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true,
    maxSize: maxFileSize
  })

  const updateFileConfig = (id, field, value) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ))
  }

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one Excel file')
      return
    }

    if (freeLimitActive && files.some((fileConfig) => fileConfig.file.size > maxFileSize)) {
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

    // Validate all files have valid configurations
    for (const fileConfig of files) {
      if (!fileConfig.sheetIndex.trim() || isNaN(parseInt(fileConfig.sheetIndex)) || parseInt(fileConfig.sheetIndex) < 1) {
        toast.error(`Invalid sheet index for ${fileConfig.file.name}`)
        return
      }
      if (!fileConfig.columnIndex.trim() || isNaN(parseInt(fileConfig.columnIndex)) || parseInt(fileConfig.columnIndex) < 1) {
        toast.error(`Invalid column index for ${fileConfig.file.name}`)
        return
      }
    }

    setProcessing(true)
    setProgress(0)
    setResults([])

    try {
      const processedResults = []
      const totalFiles = files.length

      for (let i = 0; i < files.length; i++) {
        const fileConfig = files[i]
        const currentProgress = Math.floor((i / totalFiles) * 100)
        setProgress(currentProgress)

        const blob = await pdfService.splitExcel(
          fileConfig.file,
          parseInt(fileConfig.sheetIndex),
          parseInt(fileConfig.columnIndex),
          (fileProgress) => {
            const overallProgress = Math.floor(((i + fileProgress / 100) / totalFiles) * 100)
            setProgress(overallProgress)
          }
        )

        processedResults.push({
          fileName: fileConfig.file.name,
          blob: blob
        })
      }

      if (!isPro) {
        const consumed = await consumeConversions(files.length)
        if (!consumed) {
          throw new Error('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
        }
      }

      setProgress(100)
      setResults(processedResults)
      toast.success(`Successfully split ${files.length} Excel file(s)!`)
    } catch (error) {
      toast.error(error.message || 'Failed to split Excel files')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = (blob, fileName) => {
    const outputName = fileName.replace(/\.(xlsx|xls)$/i, '_split.zip')
    downloadBlob(blob, outputName)
  }

  const handleDownloadAll = () => {
    results.forEach(result => {
      handleDownload(result.blob, result.fileName)
    })
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
              <SplitSquareHorizontal className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Split Excels by Column</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Automatically split your Excel files into multiple files based on unique values in a specific column
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
                <SplitSquareHorizontal className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {files.length > 0 
                    ? `${files.length} Excel file${files.length > 1 ? 's' : ''} uploaded` 
                    : 'Drop your Excel files here'}
                </p>
                <p className="text-sm text-gray-500">
                  {files.length > 0 
                    ? 'Click to add more files or configure below' 
                    : 'or click to browse (.xlsx, .xls) - multiple files supported'}
                </p>
                {freeLimitActive && (
                  <p className="mt-3 text-sm text-amber-600">
                    Free users can upload Excel files up to {freeLimitLabel}.
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Files Configuration Table - Only visible when files are uploaded */}
          {!processing && files.length > 0 && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden mb-8"
            >
              <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Configure Split Settings for Each File
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">File Name</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Sheet Index</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Column Index</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {files.map((fileConfig) => (
                        <tr key={fileConfig.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <SplitSquareHorizontal className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-900 truncate max-w-xs" title={fileConfig.file.name}>
                                {fileConfig.file.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="1"
                              value={fileConfig.sheetIndex}
                              onChange={(e) => updateFileConfig(fileConfig.id, 'sheetIndex', e.target.value)}
                              className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="1"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="1"
                              value={fileConfig.columnIndex}
                              onChange={(e) => updateFileConfig(fileConfig.id, 'columnIndex', e.target.value)}
                              className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="3"
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => removeFile(fileConfig.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Sheet Index:</strong> Sheet number (1 for first sheet, 2 for second, etc.) • 
                    <strong className="ml-2">Column Index:</strong> Column number to split by (1=A, 2=B, 3=C, etc.)
                  </p>
                </div>
              </div>
            </motion.div>
          )}

                   {/* Progress Bar */}
          {processing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden mb-8 p-8"
            >
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600">Processing {files.length} file{files.length > 1 ? 's' : ''}...</span>
                <span className="text-green-600 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                Processing files...
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
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Successfully Split {results.length} Excel File{results.length > 1 ? 's' : ''}!
                  </h3>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-green-100 border-b border-green-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-green-900">File Name</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-green-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-200">
                    {results.map((result, index) => (
                      <tr key={index} className="hover:bg-green-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-900">{result.fileName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDownload(result.blob, result.fileName)}
                            className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download ZIP</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                Split {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Excel Files'}
              </button>
            )}

            {processing && (
              <button
                disabled
                className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold opacity-75 cursor-not-allowed shadow-lg"
              >
                Processing... {progress}%
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
                  <SplitSquareHorizontal className="w-5 h-5" />
                  <span>Split More Files</span>
                </button>
                
                {results.length > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download All ({results.length} files)</span>
                  </button>
                )}
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

export default SplitExcelPage