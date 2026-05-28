import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://153.75.250.227:8000'

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 120000,
})

// Shared upload → poll → download flow
async function convertFiles(endpoint, files, onProgress, downloadExt) {
  const formData = new FormData()
  for (const file of files) formData.append('files', file)

  // Upload (0–10%)
  const { data: uploadData } = await apiClient.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress(Math.round((e.loaded * 10) / e.total)),
  })

  const jobs = uploadData?.jobs
  if (!jobs?.length) throw new Error('No jobs created')

  const jobIdsParam = jobs.map((j) => j.job_id).join(',')
  onProgress(10)

  // Poll (10–85%)
  for (let i = 0; i < 600; i++) {
    await new Promise((r) => setTimeout(r, 500))
    const { data } = await apiClient.get(`/api/overall-status?job_ids=${jobIdsParam}`)
    onProgress(10 + Math.round((data.progress || 0) * 0.75))
    if (data.status === 'done') break
    if (data.status === 'failed') throw new Error('One or more conversions failed')
    if (i === 599) throw new Error('Conversion timeout')
  }

  // Download (85–100%)
  onProgress(85)
  const results = await Promise.all(
    jobs.map(async (j, idx) => {
      const res = await apiClient.get(`/api/download/${j.job_id}`, { responseType: 'blob' })
      onProgress(85 + Math.round(((idx + 1) / jobs.length) * 15))
      return { jobId: j.job_id, blob: res.data }
    })
  )
  onProgress(100)
  return results
}

export const pdfService = {
  convertPdfToExcel: (files, onProgress = () => {}) =>
    convertFiles('/api/convertexcel', files, onProgress, '.xlsx'),

  autoCorrectPdf: (files, onProgress = () => {}) =>
    convertFiles('/api/autocorrect', files, onProgress, '.pdf'),

  autoDeskewPdf: (files, onProgress = () => {}) =>
    convertFiles('/api/deskew', files, onProgress, '.pdf'),

  excelToPdf: (files, onProgress = () => {}) =>
    convertFiles('/api/exceltopdf', files, onProgress, '.pdf'),

  pdfToWord: (files, onProgress = () => {}) =>
    convertFiles('/api/convertword', files, onProgress, '.docx'),

  async splitExcel(file, sheetIndex = 1, columnIndex = 3, onProgress = () => {}) {
    const formData = new FormData()
    formData.append('files', file)
    formData.append('sheet_index', String(sheetIndex))
    formData.append('target_column_index', String(columnIndex))

    const { data: uploadData } = await apiClient.post('/api/splitexcel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress(Math.round((e.loaded * 20) / e.total)),
    })

    const jobs = uploadData?.jobs
    if (!jobs?.length) throw new Error('No split job was created')

    const jobId = jobs[0].job_id
    onProgress(20)

    for (let i = 0; i < 300; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const { data } = await apiClient.get(`/api/status/${jobId}`)
      onProgress(20 + Math.round((data.progress || 0) * 0.7))
      if (data.status === 'done') {
        onProgress(95)
        const res = await apiClient.get(`/api/download/${jobId}`, { responseType: 'blob' })
        onProgress(100)
        return res.data
      }
      if (data.status === 'failed') throw new Error(data.error || 'Split failed')
      if (i === 299) throw new Error('Split timeout')
    }
  },
}

export const checkHealth = async () => {
  try {
    const res = await apiClient.get('/api/health')
    return res.status === 200
  } catch {
    return false
  }
}

export const downloadBlob = (blob, fileName) => {
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
