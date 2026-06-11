import axios, { AxiosError } from 'axios'

const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL
const r2ApiBase = LOCAL_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')

const r2Api = axios.create({ baseURL: r2ApiBase, timeout: 30000, withCredentials: true })

// Attach session token as Bearer so auth works even when cookies are blocked (e.g. Brave)
r2Api.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const handleLocal = <T>(promise: Promise<{ data: T }>): Promise<T> =>
  promise.then((r) => r.data).catch((e: AxiosError<{ error?: unknown; detail?: unknown; message?: string }>) => {
    const errField = e.response?.data?.error
    const detailField = e.response?.data?.detail
    const errStr = typeof errField === 'string' ? errField
      : typeof detailField === 'string' ? detailField
      : typeof errField === 'object' && errField !== null ? JSON.stringify(errField)
      : e.response?.data?.message || e.message
    throw new Error(errStr)
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

export interface BillingProfile {
  plan: 'free' | 'pro'
  planId: string | null
  subscriptionId: string | null
  subscriptionStatus: string | null
  renewalDate: string | null
}

export interface PaymentRecord {
  id: string
  plan_id: string
  amount: number
  display_amount: number | null
  currency: string
  status: string
  payment_type: string
  razorpay_payment_id: string | null
  razorpay_subscription_id: string | null
  created_at: string | null
  updated_at: string | null
}

export const conversionService = {
  // user_id is no longer sent — the server derives it from the session cookie.
  createConversion: async (_userId: string, fileName: string, fileSize?: number): Promise<ConversionRecord> => {
    return handleLocal(r2Api.post('/api/conversions', {
      file_name: fileName,
      file_size: fileSize ?? null,
      status: 'processing',
    }))
  },

  updateConversionStatus: async (
    id: string,
    status: string,
    extra: { outputUrl?: string | null; r2Key?: string | null; expiresAt?: string | null } = {}
  ): Promise<ConversionRecord> => {
    return handleLocal(r2Api.patch(`/api/conversions/${encodeURIComponent(id)}`, {
      status,
      output_url: extra.outputUrl ?? null,
      r2_key: extra.r2Key ?? null,
      expires_at: extra.expiresAt ?? null,
    }))
  },

  // user_id query param removed — server uses session.
  getUserConversions: async (_userId: string): Promise<ConversionRecord[]> => {
    return handleLocal(r2Api.get('/api/conversions'))
  },

  getConversionCount: async (_userId: string): Promise<number> => {
    const data = await handleLocal<{ count: number }>(r2Api.get('/api/conversions/count'))
    return data.count
  },
}

// Vercel rejects request bodies over ~4.5 MB with a 413, so anything bigger
// must go to R2 directly via a presigned PUT instead of through /api/r2/upload.
const PROXY_UPLOAD_LIMIT = 4 * 1024 * 1024

const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  zip: 'application/zip',
}

export const r2Service = {
  uploadFile: async (blob: Blob, filename: string): Promise<{ key: string; url: string; expiresAt: string }> => {
    if (blob.size <= PROXY_UPLOAD_LIMIT) {
      const form = new FormData()
      form.append('file', blob, filename)
      return handleLocal(r2Api.post('/api/r2/upload', form))
    }

    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const contentType = EXT_MIME[ext] || 'application/octet-stream'
    const { key, uploadUrl, url, expiresAt } = await handleLocal<{
      key: string; uploadUrl: string; url: string; expiresAt: string
    }>(r2Api.post('/api/r2/upload-url', { filename, contentType }))

    // Presigned PUT — no auth headers, the signature in the URL authorizes it.
    await axios.put(uploadUrl, blob, {
      headers: { 'Content-Type': contentType },
      timeout: 300000,
    })

    return { key, url, expiresAt }
  },

  getDownloadUrl: (key: string): Promise<{ url: string }> =>
    handleLocal(r2Api.get(`/api/r2/presign?key=${encodeURIComponent(key)}`)),
}

export const profileService = {
  // user_id query param removed — server uses session.
  getBillingProfile: async (_userId: string, _email: string): Promise<{
    profile: BillingProfile | null
    payments: PaymentRecord[]
    hasPaidPayment: boolean
    latestPaidPayment: PaymentRecord | null
  }> => {
    return handleLocal(r2Api.get('/api/profile'))
  },

  getPayments: async (userId: string, email: string): Promise<PaymentRecord[]> => {
    const billing = await profileService.getBillingProfile(userId, email)
    return billing.payments
  },

  getProfile: async (userId: string) => {
    try {
      const data = await profileService.getBillingProfile(userId, '')
      return data.profile
    } catch {
      return null
    }
  },

  updateProfile: async (_userId: string, updates: Record<string, unknown>) => {
    return handleLocal(r2Api.patch('/api/profile', updates))
  },
}
