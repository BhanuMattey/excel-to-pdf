import axios, { AxiosProgressEvent } from 'axios'

// Call the Python API directly from the browser. Routing uploads through the
// /api/python/* Vercel proxy capped request bodies at ~4.5 MB (a hard Vercel
// platform limit), which returned 413 for any file over ~5 MB regardless of plan.
// The Python backend must allow this site's origin in its CORS allowlist.
const API_URL = import.meta.env.VITE_PYTHON_API_URL || 'https://api.excelfrompdf.com/api'

const apiClient = axios.create({
  baseURL: API_URL,
  // Generous timeout: large pro uploads (up to 50 MB) on slow links need time.
  timeout: 300000,
})

interface Job {
  job_id: string
}

interface UploadResponse {
  jobs: Job[]
}

interface StatusResponse {
  status: string
  progress?: number
  error?: string
}

interface ConversionResult {
  jobId: string
  blob: Blob
}

type ProgressFn = (pct: number) => void

async function convertFiles(
  endpoint: string,
  files: File[],
  onProgress: ProgressFn,
  _downloadExt: string
): Promise<ConversionResult[]> {
  const formData = new FormData()
  for (const file of files) formData.append('files', file)

  const { data: uploadData } = await apiClient.post<UploadResponse>(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e: AxiosProgressEvent) =>
      onProgress(Math.round((e.loaded * 10) / (e.total ?? e.loaded))),
  })

  const jobs = uploadData?.jobs
  if (!jobs?.length) throw new Error('No jobs created')

  const jobIdsParam = jobs.map((j) => j.job_id).join(',')
  onProgress(10)

  for (let i = 0; i < 600; i++) {
    await new Promise((r) => setTimeout(r, 500))
    const { data } = await apiClient.get<StatusResponse>(`/overall-status?job_ids=${jobIdsParam}`)
    onProgress(10 + Math.round((data.progress ?? 0) * 0.75))
    if (data.status === 'done') break
    if (data.status === 'failed') throw new Error('One or more conversions failed')
    if (i === 599) throw new Error('Conversion timeout')
  }

  onProgress(85)
  const results = await Promise.all(
    jobs.map(async (j, idx) => {
      const res = await apiClient.get<Blob>(`/download/${j.job_id}`, { responseType: 'blob' })
      onProgress(85 + Math.round(((idx + 1) / jobs.length) * 15))
      return { jobId: j.job_id, blob: res.data }
    })
  )
  onProgress(100)
  return results
}

export const pdfService = {
  convertPdfToExcel: (files: File[], onProgress: ProgressFn = () => {}) =>
    convertFiles('/convertexcel', files, onProgress, '.xlsx'),

  autoCorrectPdf: (files: File[], onProgress: ProgressFn = () => {}) =>
    convertFiles('/autocorrect', files, onProgress, '.pdf'),

  autoDeskewPdf: (files: File[], onProgress: ProgressFn = () => {}) =>
    convertFiles('/deskew', files, onProgress, '.pdf'),

  excelToPdf: (files: File[], onProgress: ProgressFn = () => {}) =>
    convertFiles('/exceltopdf', files, onProgress, '.pdf'),

  pdfToWord: (files: File[], onProgress: ProgressFn = () => {}) =>
    convertFiles('/convertword', files, onProgress, '.docx'),

  async splitExcel(file: File, sheetIndex = 1, columnIndex = 4, onProgress: ProgressFn = () => {}) {
    const formData = new FormData()
    formData.append('files', file)
    formData.append('sheet_index', String(sheetIndex))
    formData.append('target_column_index', String(columnIndex))

    const { data: uploadData } = await apiClient.post<UploadResponse>('/splitexcel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e: AxiosProgressEvent) =>
        onProgress(Math.round((e.loaded * 20) / (e.total ?? e.loaded))),
    })

    const jobs = uploadData?.jobs
    if (!jobs?.length) throw new Error('No split job was created')

    const jobId = jobs[0].job_id
    onProgress(20)

    for (let i = 0; i < 300; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const { data } = await apiClient.get<StatusResponse>(`/status/${jobId}`)
      onProgress(20 + Math.round((data.progress ?? 0) * 0.7))
      if (data.status === 'done') {
        onProgress(95)
        const res = await apiClient.get<Blob>(`/download/${jobId}`, { responseType: 'blob' })
        onProgress(100)
        return { jobId, blob: res.data }
      }
      if (data.status === 'failed') throw new Error(data.error || 'Split failed')
      if (i === 299) throw new Error('Split timeout')
    }
  },
}

export const checkHealth = async (): Promise<boolean> => {
  try {
    const res = await apiClient.get('/health')
    return res.status === 200
  } catch {
    return false
  }
}

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export default pdfService
