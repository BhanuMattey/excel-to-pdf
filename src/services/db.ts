import axios, { AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const http = axios.create({ baseURL: API_URL, timeout: 15000 })
http.defaults.withCredentials = true

const handle = <T>(promise: Promise<{ data: T }>): Promise<T> =>
  promise.then((r) => r.data).catch((e: AxiosError<{ detail?: string; message?: string }>) => {
    throw new Error(e.response?.data?.detail || e.response?.data?.message || e.message)
  })

// Local auth+R2 server (same port as Vite in dev, port 3001 in prod)
const localBase = typeof window !== 'undefined'
  ? window.location.origin   // dev: http://localhost:3000, prod: same origin
  : 'http://localhost:3001'

const local = axios.create({ baseURL: localBase, timeout: 30000 })
local.defaults.withCredentials = true

const handleLocal = <T>(promise: Promise<{ data: T }>): Promise<T> =>
  promise.then((r) => r.data).catch((e: AxiosError<{ error?: string }>) => {
    throw new Error(e.response?.data?.error || e.message)
  })

export interface ConversionRecord {
  id: string
  user_id?: string
  file_name: string
  status: string
  r2_key?: string | null
  output_url?: string | null
  file_size?: number | null
  expires_at?: string | null
  created_at: string
}

export const conversionService = {
  createConversion: (userId: string, fileName: string, fileSize?: number) =>
    handleLocal(local.post('/api/conversions', {
      user_id: userId,
      file_name: fileName,
      file_size: fileSize ?? null,
      status: 'processing',
    })),

  updateConversionStatus: (
    id: string,
    status: string,
    extra: { outputUrl?: string | null; r2Key?: string | null; expiresAt?: string | null } = {}
  ) =>
    handleLocal(local.patch(`/api/conversions/${id}`, {
      status,
      output_url: extra.outputUrl ?? null,
      r2_key: extra.r2Key ?? null,
      expires_at: extra.expiresAt ?? null,
    })),

  getUserConversions: (userId: string): Promise<ConversionRecord[]> =>
    handleLocal(local.get(`/api/conversions?user_id=${userId}`)),

  getConversionCount: (userId: string): Promise<number> =>
    handleLocal(local.get<{ count?: number }>(`/api/conversions/count?user_id=${userId}`))
      .then((d) => d.count ?? 0),
}

export const r2Service = {
  // Upload a Blob (the converted Excel/PDF) to R2 via our local server.
  // Returns { key, url, expiresAt }.
  uploadFile: (blob: Blob, filename: string): Promise<{ key: string; url: string; expiresAt: string }> => {
    const form = new FormData()
    form.append('file', blob, filename)
    return handleLocal(local.post('/api/r2/upload', form))
  },

  // Refresh a presigned download URL for an existing R2 key.
  getDownloadUrl: (key: string): Promise<{ url: string }> =>
    handleLocal(local.get(`/api/r2/presign?key=${encodeURIComponent(key)}`)),
}

export const profileService = {
  getProfile: (userId: string) =>
    handle(http.get(`/api/profiles/${userId}`)).catch(() => null),

  updateProfile: (userId: string, updates: Record<string, unknown>) =>
    handle(http.put(`/api/profiles/${userId}`, updates)),
}
