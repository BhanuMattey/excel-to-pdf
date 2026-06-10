import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar, Footer } from '../components/layout'
import SEO from '../components/SEO'
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  ScissorsLineDashed,
  SplitSquareHorizontal,
  UploadCloud,
  Zap,
  X,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { pdfService, downloadBlob } from '../services/api'
import { conversionService, r2Service } from '../services/db'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { formatFileSize } from '../utils/helpers'
import { getExcelMaxSize } from '../utils/uploadLimits'

interface FileConfig {
  id: number
  file: File
  sheetIndex: string
  columnIndex: string
}

interface SplitResult {
  fileName: string
  jobId: string
  blob: Blob
}

const SplitExcelPage = () => {
  const [files, setFiles] = useState<FileConfig[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<SplitResult[]>([])
  const { isPro } = usePlan()
  const { user, checkAndIncrementConversions, refreshConversionCount } = useAuth()
  const maxFileSize = getExcelMaxSize(isPro)
  const freeLimitActive = !isPro
  const freeLimitLabel = formatFileSize(maxFileSize)

  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  const isValidExcelFile = (selectedFile: File) =>
    validTypes.includes(selectedFile.type) ||
    selectedFile.name.toLowerCase().endsWith('.xlsx')

  const onDrop = (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles
      .filter((selectedFile) => {
        if (isValidExcelFile(selectedFile)) return true
        toast.error(`${selectedFile.name} is not a valid Excel file.`)
        return false
      })
      .map((file, index) => ({
        id: Date.now() + index,
        file,
        sheetIndex: '1',
        columnIndex: '4',
      }))

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles])
      setResults([])
      setProgress(0)
      toast.success(`${newFiles.length} Excel file${newFiles.length > 1 ? 's' : ''} ready.`)
    }
  }

  const onDropRejected = (fileRejections: { file: File; errors: readonly { code: string }[] }[]) => {
    fileRejections.forEach(({ file, errors }) => {
      if (errors[0]?.code === 'file-too-large') {
        toast.error(`${file.name} exceeds the ${freeLimitLabel} ${freeLimitActive ? 'free limit' : 'limit'}.`)
        return
      }
      toast.error(`${file.name} is not a valid Excel file.`)
    })
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
    maxSize: maxFileSize,
    noClick: true,
  })

  const updateFileConfig = (id: number, field: keyof FileConfig, value: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  const removeFile = (id: number) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setResults([])
    setProgress(0)
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one Excel file.')
      return
    }

    if (freeLimitActive && files.some((fileConfig) => fileConfig.file.size > maxFileSize)) {
      toast.error(`Free users can upload Excel files up to ${freeLimitLabel}.`)
      return
    }

    const xlsFiles = files.filter((fc) => fc.file.name.toLowerCase().endsWith('.xls') && !fc.file.name.toLowerCase().endsWith('.xlsx'))
    if (xlsFiles.length > 0) {
      toast.error('Split only supports .xlsx files. Please convert your .xls file to .xlsx first (open in Excel → Save As → .xlsx).')
      return
    }

    for (const fileConfig of files) {
      const sheet = parseInt(fileConfig.sheetIndex)
      const column = parseInt(fileConfig.columnIndex)
      if (!fileConfig.sheetIndex.trim() || Number.isNaN(sheet) || sheet < 1) {
        toast.error(`Invalid sheet index for ${fileConfig.file.name}.`)
        return
      }
      if (!fileConfig.columnIndex.trim() || Number.isNaN(column) || column < 1) {
        toast.error(`Invalid column index for ${fileConfig.file.name}.`)
        return
      }
    }

    if (!isPro && !checkAndIncrementConversions(files.length)) {
      toast.error('You have used your free conversions. Upgrade to continue.')
      return
    }

    setProcessing(true)
    setProgress(0)
    setResults([])

    const conversionRecords: { id: string; fileConfig: typeof files[0] }[] = []

    try {
      // Create DB records upfront so history is populated.
      if (user) {
        for (const fileConfig of files) {
          try {
            const record = await conversionService.createConversion(user.id, fileConfig.file.name, fileConfig.file.size) as { id: string }
            conversionRecords.push({ id: record.id, fileConfig })
          } catch (historyErr) {
            throw new Error(`Failed to save conversion history: ${historyErr instanceof Error ? historyErr.message : 'Unknown database error'}`)
          }
        }
      }

      const processedResults: SplitResult[] = []
      const totalFiles = files.length
      const { formatExcelFilesInZip } = await import('../utils/excelFormatting')

      for (let i = 0; i < files.length; i++) {
        const fileConfig = files[i]
        setProgress(Math.floor((i / totalFiles) * 100))

        const result = await pdfService.splitExcel(
          fileConfig.file,
          parseInt(fileConfig.sheetIndex),
          parseInt(fileConfig.columnIndex),
          (fileProgress) => {
            setProgress(Math.floor(((i + fileProgress / 100) / totalFiles) * 100))
          }
        )

        if (result) {
          processedResults.push({
            fileName: fileConfig.file.name,
            jobId: result.jobId,
            blob: await formatExcelFilesInZip(result.blob),
          })
        }
      }

      setProgress(100)
      setResults(processedResults)

      if (user && conversionRecords.length) {
        for (let i = 0; i < conversionRecords.length; i++) {
          const rec = conversionRecords[i]
          const result = processedResults[i]
          if (result) {
            const zipName = result.fileName.replace(/\.(xlsx|xls)$/i, '_split.zip')
            try {
              const { key, url, expiresAt } = await r2Service.uploadFile(result.blob, zipName)
              await conversionService.updateConversionStatus(rec.id, 'completed', {
                outputUrl: url,
                r2Key: key,
                expiresAt,
              })
            } catch (r2Err) {
              console.error('[r2/upload] failed for', zipName, r2Err)
              await conversionService.updateConversionStatus(rec.id, 'failed').catch(() => {})
              throw new Error(`Split completed, but failed to store file in R2: ${r2Err instanceof Error ? r2Err.message : 'Unknown storage error'}`)
            }
          } else {
            await conversionService.updateConversionStatus(rec.id, 'completed').catch(() => {})
          }
        }
        await refreshConversionCount()
      }

      toast.success(`Successfully split ${processedResults.length} Excel file${processedResults.length > 1 ? 's' : ''}.`)
    } catch (error) {
      if (user && conversionRecords.length) {
        for (const rec of conversionRecords) {
          await conversionService.updateConversionStatus(rec.id, 'failed').catch(() => {})
        }
        await refreshConversionCount()
      }
      toast.error(error instanceof Error ? error.message : 'Failed to split Excel files.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = async (blob: Blob, fileName: string) => {
    downloadBlob(blob, fileName.replace(/\.(xlsx|xls)$/i, '_split.zip'))
  }

  const handleDownloadAll = () => {
    results.forEach((result) => handleDownload(result.blob, result.fileName))
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEO
        title="Split Excel File Online Free — ExcelFromPDF"
        description="Split large Excel files by sheet or row count. Download individual sheets as separate .xlsx files. Free, no signup needed."
        canonical="/split-excel"
        schema={{
          '@type': 'SoftwareApplication',
          name: 'Split Excel File',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description: 'Split large Excel files by sheet or row count.',
        }}
      />
      <Navbar />
      <main className="flex-grow pt-20 pb-16">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-lime-50 border-b border-gray-100">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl animate-blob" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-lime-200/50 blur-3xl animate-blob-slow" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-center">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                  </span>
                  <ScissorsLineDashed className="h-3.5 w-3.5" />
                  Split workbooks automatically
                </div>
                <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-gray-950">
                  Split Excel files{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-700">by any column.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
                  Upload one or more spreadsheets, pick the sheet and column, then download clean ZIP files grouped by unique values.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-white/60 to-white/20 blur-md" />
                <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-950/10">
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                    <span className="ml-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 shadow-sm">
                      <SplitSquareHorizontal className="h-3 w-3 text-emerald-600" />
                      split excel
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-lime-500 text-white shadow-lg">
                      <SplitSquareHorizontal className="h-7 w-7" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
                      {['Upload', 'Configure', 'Download ZIP'].map((step, index) => (
                        <div key={step} className="rounded-xl bg-gray-50 px-3 py-3 transition-colors hover:bg-gray-100">
                          <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
                            {index + 1}
                          </div>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-7 shadow-xl shadow-gray-950/5"
          >
            <div
              {...getRootProps()}
              className={`rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
                isDragActive ? 'border-emerald-300 bg-emerald-50 scale-[1.01]' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <input {...getInputProps()} />
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-lime-500 text-white shadow-lg transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
                <UploadCloud className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold text-gray-950">
                {files.length ? `${files.length} Excel file${files.length > 1 ? 's' : ''} selected` : 'Drop Excel files here'}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {freeLimitActive
                  ? `.xlsx supported. Free uploads up to ${freeLimitLabel} per file.`
                  : `.xlsx supported. Upload files up to ${freeLimitLabel} each.`}
              </p>
              <button type="button" onClick={open} className="btn-shine mt-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                Browse Excel files
              </button>
            </div>

            {files.length > 0 && results.length === 0 && (
              <div className="mt-6 grid gap-4">
                {files.map((fileConfig) => (
                  <div key={fileConfig.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{fileConfig.file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(fileConfig.file.size)}</p>
                        </div>
                      </div>
                      {!processing && (
                        <button type="button" onClick={() => removeFile(fileConfig.id)} className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Sheet number</span>
                        <input
                          type="number"
                          min="1"
                          value={fileConfig.sheetIndex}
                          onChange={(e) => updateFileConfig(fileConfig.id, 'sheetIndex', e.target.value)}
                          className="input-field focus:ring-emerald-500"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Column number</span>
                        <input
                          type="number"
                          min="1"
                          value={fileConfig.columnIndex}
                          onChange={(e) => updateFileConfig(fileConfig.id, 'columnIndex', e.target.value)}
                          className="input-field focus:ring-emerald-500"
                        />
                      </label>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Sheet 1 means the first worksheet. Column 1 means A, column 2 means B, column 3 means C.
                </div>
              </div>
            )}

            {processing && (
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Splitting spreadsheets</span>
                  <span className="font-semibold text-emerald-600">{progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-lime-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {!processing && results.length > 0 && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-emerald-950">Split complete</h3>
                    <p className="text-sm text-emerald-700">{results.length} ZIP file{results.length > 1 ? 's are' : ' is'} ready to download.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              {!processing && results.length === 0 && (
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={files.length === 0}
                  className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-300 disabled:bg-none disabled:shadow-none disabled:hover:translate-y-0"
                >
                  <Zap className="h-4 w-4" />
                  Split files
                </button>
              )}
              {processing && (
                <button type="button" disabled className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white opacity-80">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Splitting...
                </button>
              )}
              {!processing && results.length > 0 && (
                <>
                  <button type="button" onClick={() => { setFiles([]); setResults([]); setProgress(0) }} className="btn-secondary">
                    Split more
                  </button>
                  <button type="button" onClick={handleDownloadAll} className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                    <Download className="h-4 w-4" />
                    Download ZIP files
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default SplitExcelPage
