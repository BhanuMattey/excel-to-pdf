import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { CheckCircle2, Download, FileCheck2, Loader2, LockKeyhole, UploadCloud, X, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar, Footer } from '../layout'
import SEO from '../SEO'
import { downloadBlob } from '../../services/api'
import { conversionService, r2Service } from '../../services/db'
import { useAuth } from '../../context/AuthContext'
import { usePlan } from '../../context/PlanContext'
import { formatFileSize } from '../../utils/helpers'
import { getExcelMaxSize, getPdfMaxSize } from '../../utils/uploadLimits'
import { withExcelAdvertisingSuffix } from '../../utils/fileNames'

interface ConversionPageProps {
  title: string
  description: string
  Icon: React.ElementType
  color?: 'purple' | 'green' | 'blue'
  serviceCall: (files: File[], onProgress: (pct: number) => void) => Promise<{ jobId: string; blob: Blob }[]>
  getOutputName: (name: string) => string
  fileType?: 'pdf' | 'excel'
  accept?: Record<string, string[]>
  maxSizeMB?: number
}

const themes = {
  purple: {
    accent: 'text-brand-green-700',
    chip: 'bg-brand-green-50 text-brand-green-700 border-brand-green-100',
    soft: 'bg-brand-green-50',
    ring: 'focus:ring-brand-green-600',
    border: 'border-brand-green-300',
    button: 'bg-brand-green-700 hover:bg-brand-green-800',
    dot: 'bg-brand-green-600',
    ping: 'bg-brand-green-400',
    blobA: 'bg-brand-green-200/50',
    blobB: 'bg-brand-teal-200/50',
    gradientStyle: { background: 'linear-gradient(to bottom right, #166534, #0d9488, #0e7490)' } as React.CSSProperties,
    panelStyle: { background: 'linear-gradient(to bottom right, #f0fdf4, #ffffff, #f0fdfa)' } as React.CSSProperties,
  },
  green: {
    accent: 'text-brand-green-700',
    chip: 'bg-brand-green-50 text-brand-green-700 border-brand-green-100',
    soft: 'bg-brand-green-50',
    ring: 'focus:ring-brand-green-600',
    border: 'border-brand-green-300',
    button: 'bg-brand-green-700 hover:bg-brand-green-800',
    dot: 'bg-brand-green-600',
    ping: 'bg-brand-green-400',
    blobA: 'bg-brand-green-200/50',
    blobB: 'bg-brand-teal-200/50',
    gradientStyle: { background: 'linear-gradient(to bottom right, #16a34a, #166534, #0e7490)' } as React.CSSProperties,
    panelStyle: { background: 'linear-gradient(to bottom right, #f0fdf4, #ffffff, #f0fdfa)' } as React.CSSProperties,
  },
  blue: {
    accent: 'text-brand-teal-700',
    chip: 'bg-brand-teal-50 text-brand-teal-700 border-brand-teal-100',
    soft: 'bg-brand-teal-50',
    ring: 'focus:ring-brand-teal-600',
    border: 'border-brand-teal-300',
    button: 'bg-brand-teal-700 hover:bg-brand-teal-800',
    dot: 'bg-brand-teal-600',
    ping: 'bg-brand-teal-400',
    blobA: 'bg-brand-teal-200/50',
    blobB: 'bg-brand-green-200/50',
    gradientStyle: { background: 'linear-gradient(to bottom right, #0d9488, #0e7490, #166534)' } as React.CSSProperties,
    panelStyle: { background: 'linear-gradient(to bottom right, #f0fdfa, #ffffff, #f0fdf4)' } as React.CSSProperties,
  },
}

const ConversionPage = ({
  title,
  description,
  Icon,
  color = 'purple',
  serviceCall,
  getOutputName,
  fileType = 'pdf',
  accept,
  maxSizeMB = 5,
}: ConversionPageProps) => {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ jobId: string; blob: Blob }[]>([])
  const { isPro } = usePlan()
  const { user, checkAndIncrementConversions, refreshConversionCount } = useAuth()
  const theme = themes[color] ?? themes.purple

  // Pro: 50 MB per file (server cap); Free: the page's free limit (5 MB default)
  const maxSize = isPro
    ? (fileType === 'excel' ? getExcelMaxSize(true) : getPdfMaxSize(true))
    : maxSizeMB * 1024 * 1024
  const defaultAccept: Record<string, string[]> =
    fileType === 'excel'
      ? {
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'application/vnd.ms-excel': ['.xls'],
          'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
        }
      : { 'application/pdf': ['.pdf'] }

  const onDrop = (accepted: File[]) => {
    if (!accepted.length) return
    setFiles(accepted)
    setResults([])
    setProgress(0)
    toast.success(`${accepted.length} file${accepted.length > 1 ? 's' : ''} ready`)
  }

  const onDropRejected = (rejections: { file: File; errors: readonly { code: string }[] }[]) => {
    rejections.forEach(({ file, errors }) => {
      if (errors[0]?.code === 'file-too-large') {
        toast.error(`${file.name} exceeds the ${formatFileSize(maxSize)} ${isPro ? 'limit' : 'free limit'}.`)
        return
      }
      toast.error(`${file.name} is not a valid ${fileType === 'excel' ? 'Excel' : 'PDF'} file.`)
    })
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: accept ?? defaultAccept,
    multiple: true,
    maxSize,
    noClick: true,
  })

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index))
    setResults([])
    setProgress(0)
  }

  const handleProcess = async () => {
    if (!files.length) {
      toast.error('Please upload at least one file.')
      return
    }

    if (!checkAndIncrementConversions(files.length)) {
      toast.error('You have used your free conversions. Upgrade to continue.')
      return
    }

    setProcessing(true)
    setProgress(0)
    setResults([])

    const conversionRecords: { id: string }[] = []

    try {
      // Create DB records before processing so history shows even on failure.
      if (user) {
        for (const file of files) {
          try {
            const record = await conversionService.createConversion(user.id, file.name, file.size) as { id: string }
            conversionRecords.push(record)
          } catch (historyErr) {
            throw new Error(`Failed to save conversion history: ${historyErr instanceof Error ? historyErr.message : 'Unknown database error'}`)
          }
        }
      }

      const blobs = await serviceCall(files, setProgress)
      const processedBlobs = await Promise.all(
        blobs.map(async (result, index) => {
          const outputName = getOutputName(files[index]?.name || `file_${index + 1}`)
          if (!outputName.endsWith('.xlsx') && !outputName.endsWith('.xls')) return result
          const { formatExcelWorkbook } = await import('../../utils/excelFormatting')
          return {
            ...result,
            blob: await formatExcelWorkbook(result.blob),
          }
        })
      )
      setResults(processedBlobs)

      if (user && conversionRecords.length) {
        for (let i = 0; i < conversionRecords.length; i++) {
          const record = conversionRecords[i]
          const blob = processedBlobs[i]
          const outputName = getDownloadName(getOutputName(files[i]?.name || `file_${i + 1}`))
          try {
            const { key, url, expiresAt } = await r2Service.uploadFile(blob.blob, outputName)
            await conversionService.updateConversionStatus(record.id, 'completed', {
              outputUrl: url,
              r2Key: key,
              expiresAt,
            })
          } catch (r2Err) {
            console.error('[r2/upload] failed for', outputName, r2Err)
            await conversionService.updateConversionStatus(record.id, 'failed').catch(() => {})
            throw new Error(`Converted, but failed to store file in R2: ${r2Err instanceof Error ? r2Err.message : 'Unknown storage error'}`)
          }
        }
        await refreshConversionCount()
      }

      toast.success(`${processedBlobs.length} file${processedBlobs.length > 1 ? 's' : ''} converted.`)
    } catch (err) {
      if (user && conversionRecords.length) {
        for (const record of conversionRecords) {
          await conversionService.updateConversionStatus(record.id, 'failed').catch(() => {})
        }
        await refreshConversionCount()
      }
      toast.error(err instanceof Error ? err.message : 'Conversion failed.')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = async () => {
    for (let index = 0; index < results.length; index++) {
      const outputName = getDownloadName(getOutputName(files[index]?.name || `file_${index + 1}`))
      downloadBlob(results[index].blob, outputName)
    }
    toast.success('Download started.')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEO
        title={`${title} Online Free — ExcelFromPDF`}
        description={description}
        schema={{
          '@type': 'SoftwareApplication',
          name: title,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description,
        }}
      />
      <Navbar />
      <main className="flex-grow pt-20 pb-16">
        <section className="relative overflow-hidden border-b border-gray-100" style={theme.panelStyle}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className={`pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl animate-blob ${theme.blobA}`} />
          <div className={`pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl animate-blob-slow ${theme.blobB}`} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-center">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm ${theme.chip}`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${theme.ping}`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${theme.dot}`} />
                  </span>
                  Fast cloud conversion
                </div>
                <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-gray-950">{title}</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">{description}</p>

                <div className="mt-7 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
                    <LockKeyhole className="h-3.5 w-3.5 text-gray-400" />
                    Files removed within 24 hours
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-green-600" />
                    No install needed
                  </span>
                </div>
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
                      <Icon className={`h-3 w-3 ${theme.accent}`} />
                      {title.toLowerCase()}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg" style={theme.gradientStyle}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
                      {['Upload', 'Process', 'Download'].map((step, index) => (
                        <div key={step} className="rounded-xl bg-gray-50 px-3 py-3 transition-colors hover:bg-gray-100">
                          <div className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index === 1 ? theme.soft : 'bg-white shadow-sm'} ${theme.accent}`}>
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
            transition={{ delay: 0.12 }}
            className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-7 shadow-xl shadow-gray-950/5"
          >
            <div
              {...getRootProps()}
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
                isDragActive ? `${theme.border} ${theme.soft} scale-[1.01]` : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}
                style={theme.gradientStyle}
              >
                <UploadCloud className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold text-gray-950">
                {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : `Drop ${fileType === 'excel' ? 'Excel' : 'PDF'} files here`}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {isPro
                  ? `Multiple files supported — up to ${formatFileSize(maxSize)} each.`
                  : `Free uploads up to ${formatFileSize(maxSize)} per file.`}
              </p>
              <button
                type="button"
                onClick={open}
                className="btn-shine mt-6 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                style={theme.gradientStyle}
              >
                Browse files
              </button>
            </div>

            {files.length > 0 && (
              <div className="mt-5 grid gap-3">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100/70">
                    <div className="min-w-0 flex items-center gap-3">
                      <FileCheck2 className={`h-5 w-5 shrink-0 ${theme.accent}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {!processing && (
                      <button type="button" onClick={() => removeFile(index)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {processing && (
              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Processing files</span>
                  <span className={`font-semibold ${theme.accent}`}>{progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div className="relative h-full overflow-hidden rounded-full transition-all duration-300" style={{ width: `${progress}%`, ...theme.gradientStyle }}>
                    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </div>
                </div>
              </div>
            )}

            {!processing && results.length > 0 && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-emerald-950">Conversion complete</h3>
                    <p className="text-sm text-emerald-700">{results.length} file{results.length > 1 ? 's are' : ' is'} ready to download.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              {!processing && results.length === 0 && (
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={!files.length}
                  className={`btn-shine inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none disabled:hover:translate-y-0 ${files.length ? '' : ''}`}
                  style={files.length ? theme.gradientStyle : undefined}
                >
                  <Zap className="h-4 w-4" />
                  Start conversion
                </button>
              )}
              {processing && (
                <button type="button" disabled className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white opacity-80" style={theme.gradientStyle}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </button>
              )}
              {!processing && results.length > 0 && (
                <>
                  <button type="button" onClick={() => { setFiles([]); setResults([]); setProgress(0) }} className="btn-secondary">
                    Convert more
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <Download className="h-4 w-4" />
                    Download files
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

function getDownloadName(fileName: string) {
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) return fileName
  return withExcelAdvertisingSuffix(fileName)
}

export default ConversionPage
