import axios, { AxiosError } from 'axios'

const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL

const r2ApiBase = LOCAL_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')
const apiBase = typeof window !== 'undefined' ? window.location.origin : ''

const r2Api = axios.create({ baseURL: r2ApiBase, timeout: 30000 })
r2Api.defaults.withCredentials = true

const api = axios.create({ baseURL: apiBase, timeout: 30000 })
api.defaults.withCredentials = true

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
  createConversion: (userId: string, fileName: string, fileSize?: number): Promise<ConversionRecord> =>
    handleLocal(api.post('/api/conversions', {
      user_id: userId,
      file_name: fileName,
      file_size: fileSize ?? null,
      status: 'processing',
    })),

  updateConversionStatus: (
    id: string,
    status: string,
    extra: { outputUrl?: string | null; r2Key?: string | null; expiresAt?: string | null } = {}
  ): Promise<ConversionRecord> =>
    handleLocal(api.patch(`/api/conversions/${id}`, {
      status,
      output_url: extra.outputUrl ?? null,
      r2_key: extra.r2Key ?? null,
      expires_at: extra.expiresAt ?? null,
    })),

  getUserConversions: (userId: string): Promise<ConversionRecord[]> =>
    handleLocal(api.get(`/api/conversions?user_id=${encodeURIComponent(userId)}`)),

  getConversionCount: async (userId: string): Promise<number> => {
    const rows = await conversionService.getUserConversions(userId)
    return rows.length
  },
}

export const r2Service = {
  uploadFile: (blob: Blob, filename: string): Promise<{ key: string; url: string; expiresAt: string }> => {
    const form = new FormData()
    form.append('file', blob, filename)
    return handleLocal(r2Api.post('/api/r2/upload', form))
  },

  getDownloadUrl: (key: string): Promise<{ url: string }> =>
    handleLocal(r2Api.get(`/api/r2/presign?key=${encodeURIComponent(key)}`)),
}

export const profileService = {
  getBillingProfile: async (userId: string, _email: string): Promise<{
    profile: BillingProfile | null
    payments: PaymentRecord[]
    hasPaidPayment: boolean
    latestPaidPayment: PaymentRecord | null
  }> => {
    try {
      const { data } = await api.get(`/api/profile?user_id=${encodeURIComponent(userId)}`)
      return data
    } catch {
      return { profile: null, payments: [], hasPaidPayment: false, latestPaidPayment: null }
    }
  },

  getPayments: async (userId: string, email: string): Promise<PaymentRecord[]> => {
    const billing = await profileService.getBillingProfile(userId, email)
    return billing.payments
  },

  getProfile: async (userId: string) => {
    try {
      const { data } = await api.get(`/api/profile?user_id=${encodeURIComponent(userId)}`)
      return data?.profile ?? null
    } catch {
      return null
    }
  },

  updateProfile: async (userId: string, updates: Record<string, unknown>) => {
    const { data } = await api.patch('/api/profile', { user_id: userId, ...updates })
    return data
  },
}
