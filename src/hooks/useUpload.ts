import { useState, useCallback } from 'react'
import { pdfService, downloadBlob } from '../services/api'
import { conversionService, r2Service } from '../services/db'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { formatFileSize } from '../utils/helpers'
import { getPdfMaxSize } from '../utils/uploadLimits'
import { formatExcelWorkbook } from '../utils/excelFormatting'
import toast from 'react-hot-toast'

interface ConversionResult {
  jobId: string
  blob: Blob
}

interface ConversionRecord {
  id: string
}

export const useUpload = () => {
  const { user, refreshConversionCount, checkAndIncrementConversions, hasFreeConversions, remainingFreeConversions } = useAuth()
  const { isPro } = usePlan()
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [currentFiles, setCurrentFiles] = useState<File[]>([])
  const [outputBlobs, setOutputBlobs] = useState<ConversionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const maxFileSize = getPdfMaxSize(isPro)

  const validateFiles = useCallback((files: File[]) => {
    if (!files?.length) return { valid: false, error: 'No files selected' }
    for (const file of files) {
      if (file.type !== 'application/pdf')
        return { valid: false, error: 'Only PDF files are allowed' }
      if (file.size > maxFileSize)
        return { valid: false, error: `File ${file.name} exceeds the ${formatFileSize(maxFileSize)} limit` }
    }
    return { valid: true, error: null }
  }, [maxFileSize])

  const uploadFile = useCallback(async (files: File[]) => {
    const validation = validateFiles(files)
    if (!validation.valid) {
      setError(validation.error)
      toast.error(validation.error ?? 'Validation failed')
      return false
    }

    if (!checkAndIncrementConversions(files.length)) {
      const msg = user
        ? 'You have used all 5 free conversions. Upgrade to Pro to continue converting.'
        : 'You have used your 3 free conversions. Sign in to unlock 2 more (5 total)!'
      setError(msg)
      toast.error(msg)
      return false
    }

    if (!isPro && !hasFreeConversions) {
      const msg = user
        ? 'You have used all 5 free conversions. Upgrade to Pro to continue converting.'
        : 'You have used your 3 free conversions. Sign in to unlock 2 more (5 total)!'
      setError(msg)
      toast.error(msg)
      return false
    }

    if (!isPro && files.length > remainingFreeConversions) {
      const msg = `You only have ${remainingFreeConversions} free conversion${remainingFreeConversions === 1 ? '' : 's'} left.`
      setError(msg)
      toast.error(msg)
      return false
    }

    setError(null)
    setProgress(0)
    setCurrentFiles(files)
    setOutputBlobs([])
    setUploadState('uploading')

    const conversionRecords: ConversionRecord[] = []

    try {
      // Create DB records with file size
      if (user) {
        for (const file of files) {
          try {
            const record = await conversionService.createConversion(user.id, file.name, file.size) as ConversionRecord
            conversionRecords.push(record)
          } catch (historyErr) {
            throw new Error(`Failed to save conversion history: ${historyErr instanceof Error ? historyErr.message : 'Unknown database error'}`)
          }
        }
      }

      setUploadState('processing')

      const blobs = await pdfService.convertPdfToExcel(files, setProgress)
      const formattedBlobs = await Promise.all(
        blobs.map(async (result) => ({
          ...result,
          blob: await formatExcelWorkbook(result.blob),
        }))
      )
      setOutputBlobs(formattedBlobs)
      setUploadState('success')

      // Upload converted files to R2 and update DB records
      if (user && conversionRecords.length) {
        for (let i = 0; i < conversionRecords.length; i++) {
          const record = conversionRecords[i]
          const blob = formattedBlobs[i]
          const originalFile = files[i]
          const outputName = originalFile.name.replace(/\.pdf$/i, '.xlsx')

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

      toast.success('All files converted successfully!')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Conversion failed'
      setError(msg)
      setUploadState('error')

      if (user && conversionRecords.length) {
        for (const record of conversionRecords) {
          await conversionService.updateConversionStatus(record.id, 'failed').catch(() => {})
        }
      }

      toast.error(msg || 'Conversion failed. Please try again.')
      return false
    }
  }, [user, validateFiles, refreshConversionCount, checkAndIncrementConversions, hasFreeConversions, remainingFreeConversions, isPro])

  const downloadFile = useCallback(async () => {
    if (!outputBlobs.length || !currentFiles.length) return
    for (let i = 0; i < outputBlobs.length; i++) {
      const item = outputBlobs[i]
      const fileName = currentFiles[i]?.name.replace('.pdf', '.xlsx') || `file_${i + 1}.xlsx`
      downloadBlob(item.blob, fileName)
    }
    toast.success('Downloads started!')
  }, [outputBlobs, currentFiles])

  const reset = useCallback(() => {
    setUploadState('idle')
    setProgress(0)
    setCurrentFiles([])
    setOutputBlobs([])
    setError(null)
  }, [])

  return {
    uploadState,
    progress,
    currentFiles,
    outputBlobs,
    error,
    uploadFile,
    downloadFile,
    reset,
    validateFiles,
    isUploading: uploadState === 'uploading',
    isProcessing: uploadState === 'processing',
    isSuccess: uploadState === 'success',
    isError: uploadState === 'error',
    isIdle: uploadState === 'idle',
  }
}

export default useUpload
