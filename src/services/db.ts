import axios, { AxiosError } from 'axios'
import { neon } from '../lib/neon-client'

const API_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL

const http = axios.create({ baseURL: API_URL, timeout: 15000 })
http.defaults.withCredentials = true

const handle = <T>(promise: Promise<{ data: T }>): Promise<T> =>
  promise.then((r) => r.data).catch((e: AxiosError<{ detail?: string; message?: string }>) => {
    throw new Error(e.response?.data?.detail || e.response?.data?.message || e.message)
  })

// Optional app backend for R2 file storage. On Vercel this is same-origin.
const localBase = LOCAL_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')

const local = axios.create({ baseURL: localBase, timeout: 30000 })
local.defaults.withCredentials = true

const handleLocal = <T>(promise: Promise<{ data: T }>): Promise<T> =>
  promise.then((r) => r.data).catch((e: AxiosError<{ error?: string }>) => {
    throw new Error(e.response?.data?.error || e.message)
  })

const handleNeon = <T>(result: { data: T | null; error: { message?: string } | null }): T => {
  if (result.error) throw new Error(result.error.message || 'Database request failed')
  return result.data as T
}

const nowIso = () => new Date().toISOString()

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
  createConversion: async (userId: string, fileName: string, fileSize?: number) => {
    if (neon) {
      const id = crypto.randomUUID()
      const createdAt = nowIso()
      const result = await neon
        .from('conversions')
        .insert({
          id,
          user_id: userId,
          file_name: fileName,
          file_size: fileSize ?? null,
          status: 'processing',
          created_at: createdAt,
          updated_at: createdAt,
        })
        .select()
        .single()
      return handleNeon<ConversionRecord>(result)
    }

    if (localBase) {
      return handleLocal(local.post('/api/conversions', {
        user_id: userId,
        file_name: fileName,
        file_size: fileSize ?? null,
        status: 'processing',
      }))
    }

    throw new Error('Conversion history API is not configured')
  },

  updateConversionStatus: async (
    id: string,
    status: string,
    extra: { outputUrl?: string | null; r2Key?: string | null; expiresAt?: string | null } = {}
  ) => {
    if (neon) {
      const result = await neon
        .from('conversions')
        .update({
          status,
          output_url: extra.outputUrl ?? null,
          r2_key: extra.r2Key ?? null,
          expires_at: extra.expiresAt ?? null,
          updated_at: nowIso(),
        })
        .eq('id', id)
        .select()
        .single()
      return handleNeon<ConversionRecord>(result)
    }

    if (localBase) {
      return handleLocal(local.patch(`/api/conversions/${id}`, {
        status,
        output_url: extra.outputUrl ?? null,
        r2_key: extra.r2Key ?? null,
        expires_at: extra.expiresAt ?? null,
      }))
    }

    return null
  },

  getUserConversions: async (userId: string): Promise<ConversionRecord[]> => {
    if (neon) {
      const result = await neon
        .from('conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return handleNeon<ConversionRecord[]>(result) ?? []
    }

    if (localBase) return handleLocal(local.get(`/api/conversions?user_id=${userId}`))

    return []
  },

  getConversionCount: async (userId: string): Promise<number> => {
    if (neon) {
      const rows = await conversionService.getUserConversions(userId)
      return rows.length
    }

    if (localBase) {
      return handleLocal(local.get<{ count?: number }>(`/api/conversions/count?user_id=${userId}`))
        .then((d) => d.count ?? 0)
    }

    return 0
  },
}

export const r2Service = {
  // Upload a Blob (the converted Excel/PDF) to R2 via the optional app backend.
  uploadFile: (blob: Blob, filename: string): Promise<{ key: string; url: string; expiresAt: string }> => {
    if (!localBase) return Promise.reject(new Error('R2 upload API is not configured'))
    const form = new FormData()
    form.append('file', blob, filename)
    return handleLocal(local.post('/api/r2/upload', form))
  },

  // Refresh a presigned download URL for an existing R2 key.
  getDownloadUrl: (key: string): Promise<{ url: string }> => {
    if (!localBase) return Promise.reject(new Error('R2 download API is not configured'))
    return handleLocal(local.get(`/api/r2/presign?key=${encodeURIComponent(key)}`))
  },
}

export const profileService = {
  getProfile: (userId: string) =>
    handle(http.get(`/api/profiles/${userId}`)).catch(() => null),

  updateProfile: (userId: string, updates: Record<string, unknown>) =>
    handle(http.put(`/api/profiles/${userId}`, updates)),
}
