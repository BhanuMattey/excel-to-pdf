import { useState, useCallback } from 'react'
import { pdfService, downloadBlob } from '../services/api'
import { conversionService } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { useGlobalCounter } from './useGlobalCounter'
import { formatFileSize } from '../utils/helpers'
import { getPdfMaxSize } from '../utils/uploadLimits'
import toast from 'react-hot-toast'

export const useUpload = () => {
  const { user, refreshConversionCount, checkAndIncrementConversions } = useAuth()
  const { isPro } = usePlan()
  const { loading: counterLoading, remainingConversions, consumeConversions } = useGlobalCounter()
  const [uploadState, setUploadState] = useState('idle') // idle, uploading, processing, success, error
  const [progress, setProgress] = useState(0)
  const [currentFiles, setCurrentFiles] = useState([])      // File[]
  const [outputBlobs, setOutputBlobs] = useState([])        // { jobId, blob }[]

  const [error, setError] = useState(null)
  const maxFileSize = getPdfMaxSize(isPro)

  const validateFiles = useCallback((files) => {
    if (!files || files.length === 0) {
      return { valid: false, error: 'No files selected' }
    }

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return { valid: false, error: 'Only PDF files are allowed' }
      }

      if (file.size > maxFileSize) {
        return {
          valid: false,
          error: `File ${file.name} exceeds the ${formatFileSize(maxFileSize)} limit`,
        }
      }
    }

    return { valid: true, error: null }
  }, [maxFileSize])

  const uploadFile = useCallback(async (files) => {
  // 0️⃣ Check conversion limit for anonymous users
  if (!checkAndIncrementConversions(files.length)) {
    setError('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
    toast.error('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
    return false
  }

  // 1️⃣ Validate files
  const validation = validateFiles(files)
  if (!validation.valid) {
    setError(validation.error)
    toast.error(validation.error)
    return false
  }

  if (!isPro && (counterLoading || remainingConversions === null || remainingConversions < files.length)) {
    const remaining = remainingConversions ?? 0
    if (counterLoading) {
      setError('Checking your 3 free conversions...')
      toast.error('Checking your 3 free conversions...')
      return false
    }

    if (remaining <= 0) {
      setError('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
      toast.error('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
      return false
    }

    setError(`You only have ${remaining} of your 3 free conversions left. Upgrade to Pro to convert ${files.length} file${files.length === 1 ? '' : 's'}.`)
    toast.error(`You only have ${remaining} of your 3 free conversions left. Upgrade to Pro to convert ${files.length} file${files.length === 1 ? '' : 's'}.`)
    return false
  }

  // 2️⃣ Reset UI state
  setError(null)
  setProgress(0)
  setCurrentFiles(files)
  setOutputBlobs([])
  setUploadState('uploading')

  let conversionRecords = []

  try {
    // 3️⃣ Create conversion records (one per file)
    if (user) {
      for (const file of files) {
        try {
          const record = await conversionService.createConversion(
            user.id,
            file.name
          )
          conversionRecords.push(record)
        } catch (err) {
          console.warn('Could not create conversion record:', err)
        }
      }
    }

    // 4️⃣ Start processing
    setUploadState('processing')

    // 5️⃣ Call backend (MULTI-FILE + overall progress)
    const blobs = await pdfService.convertPdfToExcel(
      files,
      (progressValue) => setProgress(progressValue)
    )

    if (!isPro) {
      const consumed = await consumeConversions(files.length)
      if (!consumed) {
        throw new Error('You have used your 3 free conversions. Upgrade to Pro to continue converting.')
      }
    }

    // 6️⃣ Success
    setOutputBlobs(blobs)
    setUploadState('success')

    // 7️⃣ Mark all conversions completed
    if (conversionRecords.length && user) {
      for (const record of conversionRecords) {
        await conversionService.updateConversionStatus(
          record.id,
          'completed'
        )
      }
      await refreshConversionCount()
    }

    toast.success('All files converted successfully!')
    return true

  } catch (err) {
    setError(err.message || 'Conversion failed')
    setUploadState('error')

    // 8️⃣ Mark all conversions failed
    if (conversionRecords.length && user) {
      for (const record of conversionRecords) {
        try {
          await conversionService.updateConversionStatus(
            record.id,
            'failed'
          )
        } catch (updateErr) {
          console.warn('Could not update conversion record:', updateErr)
        }
      }
    }

    toast.error(err.message || 'Conversion failed. Please try again.')
    return false
  }
}, [user, validateFiles, refreshConversionCount, checkAndIncrementConversions, consumeConversions, counterLoading, isPro, remainingConversions])


  const downloadFile = useCallback(() => {
    if (!outputBlobs.length || !currentFiles.length) return

    outputBlobs.forEach((item, index) => {
    const original = currentFiles[index]
    const name = original.name.replace('.pdf', '.xlsx')
    downloadBlob(item.blob, name)
  })

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
