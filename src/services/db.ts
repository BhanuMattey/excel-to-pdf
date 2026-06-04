import axios, { AxiosError } from 'axios'
import { neon } from '../lib/neon-client'

const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL

// R2 file storage is handled by Vercel functions on the same origin unless overridden.
const r2ApiBase = LOCAL_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')

const r2Api = axios.create({ baseURL: r2ApiBase, timeout: 30000 })
r2Api.defaults.withCredentials = true

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

    throw new Error('Neon Data API is not configured')
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

    throw new Error('Neon Data API is not configured')
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

    return []
  },

  getConversionCount: async (userId: string): Promise<number> => {
    if (neon) {
      const rows = await conversionService.getUserConversions(userId)
      return rows.length
    }

    return 0
  },
}

export const r2Service = {
  // Upload a Blob (the converted Excel/PDF) to R2 via the optional app backend.
  uploadFile: (blob: Blob, filename: string): Promise<{ key: string; url: string; expiresAt: string }> => {
    const form = new FormData()
    form.append('file', blob, filename)
    return handleLocal(r2Api.post('/api/r2/upload', form))
  },

  // Refresh a presigned download URL for an existing R2 key.
  getDownloadUrl: (key: string): Promise<{ url: string }> => {
    return handleLocal(r2Api.get(`/api/r2/presign?key=${encodeURIComponent(key)}`))
  },
}

export const profileService = {
  getBillingProfile: async (userId: string, email: string): Promise<{
    profile: BillingProfile | null
    payments: PaymentRecord[]
    hasPaidPayment: boolean
    latestPaidPayment: PaymentRecord | null
  }> => {
    if (neon) {
      const profileResult = await neon
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1)

      const paymentResult = await neon
        .from('payments')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false })

      const profileRows = handleNeon<Array<{
        plan?: string | null
        plan_id?: string | null
        subscription_id?: string | null
        subscription_status?: string | null
        renewal_date?: string | null
      }>>(profileResult) ?? []
      const payments = handleNeon<PaymentRecord[]>(paymentResult) ?? []
      const p = profileRows[0]
      const paidPayments = payments.filter((payment) => payment.status === 'paid')
      const latestPaidPayment = paidPayments[0] ?? null

      return {
        profile: p ? {
          plan: p.plan === 'pro' ? 'pro' : 'free',
          planId: p.plan_id ?? null,
          subscriptionId: p.subscription_id ?? null,
          subscriptionStatus: p.subscription_status ?? null,
          renewalDate: p.renewal_date ?? null,
        } : null,
        payments,
        hasPaidPayment: paidPayments.length > 0,
        latestPaidPayment,
      }
    }

    return {
      profile: null,
      payments: [],
      hasPaidPayment: false,
      latestPaidPayment: null,
    }
  },

  getPayments: async (userId: string, email: string): Promise<PaymentRecord[]> => {
    const billing = await profileService.getBillingProfile(userId, email)
    return billing.payments
  },

  getProfile: async (userId: string) => {
    if (!neon) return null
    try {
      const result = await neon
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1)
      return (handleNeon<unknown[]>(result) ?? [])[0] ?? null
    } catch {
      return null
    }
  },

  updateProfile: (userId: string, updates: Record<string, unknown>) =>
    neon
      ? neon
        .from('profiles')
        .update({ ...updates, updated_at: nowIso() })
        .eq('id', userId)
        .select()
        .single()
        .then((result) => handleNeon<unknown>(result))
      : Promise.reject(new Error('Profile API is not configured')),
}
