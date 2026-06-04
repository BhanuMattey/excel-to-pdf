import { neon } from '../lib/neon-client'
import axios, { AxiosError } from 'axios'

const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL
const r2ApiBase = LOCAL_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')
const r2Api = axios.create({ baseURL: r2ApiBase, timeout: 30000, withCredentials: true })

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

type Row = Record<string, unknown>

function toConversionRecord(row: Row): ConversionRecord {
  return {
    id: row.id as string,
    user_id: row.user_id as string | undefined,
    file_name: row.file_name as string,
    status: row.status as string,
    r2_key: (row.r2_key ?? null) as string | null,
    output_url: (row.output_url ?? null) as string | null,
    file_size: (row.file_size ?? null) as number | null,
    expires_at: (row.expires_at ?? null) as string | null,
    created_at: (row.created_at ?? new Date().toISOString()) as string,
  }
}

export const conversionService = {
  createConversion: async (userId: string, fileName: string, fileSize?: number): Promise<ConversionRecord> => {
    if (!neon) throw new Error('Neon Data API not configured')
    const id = crypto.randomUUID()
    const { data, error } = await neon.from('conversions').insert({
      id,
      user_id: userId,
      file_name: fileName,
      file_size: fileSize ?? null,
      status: 'processing',
    }).select().single()
    if (error) throw new Error(error.message)
    return toConversionRecord(data as Row)
  },

  updateConversionStatus: async (
    id: string,
    status: string,
    extra: { outputUrl?: string | null; r2Key?: string | null; expiresAt?: string | null } = {}
  ): Promise<ConversionRecord> => {
    if (!neon) throw new Error('Neon Data API not configured')
    const { data, error } = await neon.from('conversions').update({
      status,
      output_url: extra.outputUrl ?? null,
      r2_key: extra.r2Key ?? null,
      expires_at: extra.expiresAt ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return toConversionRecord(data as Row)
  },

  getUserConversions: async (userId: string): Promise<ConversionRecord[]> => {
    if (!neon) return []
    const { data, error } = await neon.from('conversions')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as Row[]).map(toConversionRecord)
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
    return r2Api.post('/api/r2/upload', form).then(r => r.data).catch((e: AxiosError<{ error?: string }>) => {
      throw new Error(e.response?.data?.error || e.message)
    })
  },

  getDownloadUrl: (key: string): Promise<{ url: string }> =>
    r2Api.get(`/api/r2/presign?key=${encodeURIComponent(key)}`).then(r => r.data).catch((e: AxiosError<{ error?: string }>) => {
      throw new Error(e.response?.data?.error || e.message)
    }),
}

export const profileService = {
  getBillingProfile: async (userId: string, _email: string): Promise<{
    profile: BillingProfile | null
    payments: PaymentRecord[]
    hasPaidPayment: boolean
    latestPaidPayment: PaymentRecord | null
  }> => {
    try {
      if (!neon) return { profile: null, payments: [], hasPaidPayment: false, latestPaidPayment: null }

      const [{ data: profileData }, { data: paymentsData }] = await Promise.all([
        neon.from('profiles').select().eq('id', userId).maybeSingle(),
        neon.from('payments').select().eq('user_id', userId).order('created_at', { ascending: false }),
      ])

      const p = profileData as Row | null
      const profile: BillingProfile | null = p ? {
        plan: (p.plan as 'free' | 'pro') ?? 'free',
        planId: (p.plan_id as string | null) ?? null,
        subscriptionId: (p.subscription_id as string | null) ?? null,
        subscriptionStatus: (p.subscription_status as string | null) ?? null,
        renewalDate: (p.renewal_date as string | null) ?? null,
      } : null

      const payments: PaymentRecord[] = ((paymentsData ?? []) as Row[]).map(r => ({
        id: r.id as string,
        plan_id: r.plan_id as string,
        amount: r.amount as number,
        display_amount: (r.display_amount as number | null) ?? null,
        currency: r.currency as string,
        status: r.status as string,
        payment_type: r.payment_type as string,
        razorpay_payment_id: (r.razorpay_payment_id as string | null) ?? null,
        razorpay_subscription_id: (r.razorpay_subscription_id as string | null) ?? null,
        created_at: (r.created_at as string | null) ?? null,
        updated_at: (r.updated_at as string | null) ?? null,
      }))

      const hasPaidPayment = payments.some(p => p.status === 'paid')
      const latestPaidPayment = payments.find(p => p.status === 'paid') ?? null

      return { profile, payments, hasPaidPayment, latestPaidPayment }
    } catch {
      return { profile: null, payments: [], hasPaidPayment: false, latestPaidPayment: null }
    }
  },

  getPayments: async (userId: string, email: string): Promise<PaymentRecord[]> => {
    const billing = await profileService.getBillingProfile(userId, email)
    return billing.payments
  },

  getProfile: async (userId: string) => {
    const billing = await profileService.getBillingProfile(userId, '')
    return billing.profile
  },

  updateProfile: async (userId: string, updates: Record<string, unknown>) => {
    if (!neon) throw new Error('Neon Data API not configured')
    const { error } = await neon.from('profiles').upsert({ id: userId, ...updates })
    if (error) throw new Error(error.message)
  },
}
