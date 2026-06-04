import axios, { AxiosError } from 'axios'
import { neon } from '../lib/neon-client'

const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL
const r2ApiBase = LOCAL_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')

const r2Api = axios.create({ baseURL: r2ApiBase, timeout: 30000, withCredentials: true })

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

const handleNeon = <T>(result: { data: T | null; error: { message?: string } | null }): T => {
  if (result.error) {
    const message = result.error.message || 'Database request failed'
    if (/data api is not enabled/i.test(message)) {
      throw new Error('Neon Data API is not enabled for this database endpoint. Enable Data API for the neondb database/branch in Neon Console, then redeploy with the matching VITE_NEON_DATA_API_URL.')
    }
    throw new Error(message)
  }
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

const requireNeon = () => {
  if (!neon) throw new Error('Neon Data API is not configured. Set VITE_NEON_DATA_API_URL and redeploy.')
  return neon
}

export const conversionService = {
  createConversion: async (userId: string, fileName: string, fileSize?: number): Promise<ConversionRecord> => {
    const db = requireNeon()
    const id = crypto.randomUUID()
    const createdAt = nowIso()
    const result = await db
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
  },

  updateConversionStatus: async (
    id: string,
    status: string,
    extra: { outputUrl?: string | null; r2Key?: string | null; expiresAt?: string | null } = {}
  ): Promise<ConversionRecord> => {
    const db = requireNeon()
    const result = await db
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
  },

  getUserConversions: async (userId: string): Promise<ConversionRecord[]> => {
    const db = requireNeon()
    const result = await db
      .from('conversions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return handleNeon<ConversionRecord[]>(result) ?? []
  },

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
    const db = requireNeon()
    const profileResult = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .limit(1)

    const paymentResult = await db
      .from('payments')
      .select('*')
      .eq('user_id', userId)
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
  },

  getPayments: async (userId: string, email: string): Promise<PaymentRecord[]> => {
    const billing = await profileService.getBillingProfile(userId, email)
    return billing.payments
  },

  getProfile: async (userId: string) => {
    try {
      const db = requireNeon()
      const result = await db
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1)
      return (handleNeon<unknown[]>(result) ?? [])[0] ?? null
    } catch {
      return null
    }
  },

  updateProfile: async (userId: string, updates: Record<string, unknown>) => {
    const db = requireNeon()
    const result = await db
      .from('profiles')
      .update({ ...updates, updated_at: nowIso() })
      .eq('id', userId)
      .select()
      .single()
    return handleNeon<unknown>(result)
  },
}
