import axios, { AxiosError } from 'axios'

const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_BASE_URL ?? ''

const paymentApi = axios.create({ withCredentials: true })
paymentApi.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('session_token') : null
  if (token) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

interface OrderDetails {
  key_id: string
  amount: number
  currency: string
  plan_name: string
  // one-time order
  order_id?: string
  // subscription
  subscription_id?: string
  email?: string
  name?: string
}

export const paymentService = {
  // user_id / user_name are no longer sent — the server resolves the user from the session.
  async createOrder(planId: string, userEmail: string, _userName: string | null = null, _userId?: string) {
    try {
      const response = await paymentApi.post(
        `${PAYMENT_API_BASE_URL}/api/payment/create-order`,
        { plan_id: planId, user_email: userEmail }
      )
      return response.data as {
        success: boolean
        type: 'subscription' | 'order'
        order: OrderDetails
      }
    } catch (error) {
      const e = error as AxiosError<{ detail?: string }>
      throw new Error(e.response?.data?.detail || 'Failed to create order')
    }
  },

  async verifyPayment(paymentData: Record<string, unknown>) {
    // Remove any user_id the caller may have included — the server uses the session.
    const { user_id: _removed, ...safeData } = paymentData as Record<string, unknown> & { user_id?: unknown }
    try {
      const response = await paymentApi.post(
        `${PAYMENT_API_BASE_URL}/api/payment/verify`,
        safeData
      )
      return response.data as { success: boolean; plan: string; renewal_date?: string }
    } catch (error) {
      const e = error as AxiosError<{ detail?: string }>
      throw new Error(e.response?.data?.detail || 'Payment verification failed')
    }
  },

  async cancelSubscription(subscriptionId: string, _userId: string, _userEmail: string) {
    try {
      const response = await paymentApi.post(
        `${PAYMENT_API_BASE_URL}/api/payment/cancel-subscription`,
        { subscription_id: subscriptionId }
      )
      return response.data
    } catch (error) {
      const e = error as AxiosError<{ detail?: string }>
      throw new Error(e.response?.data?.detail || 'Cancellation failed')
    }
  },

  async getPaymentStatus(paymentId: string) {
    try {
      const response = await paymentApi.get(`${PAYMENT_API_BASE_URL}/api/payment/status/${paymentId}`)
      return response.data
    } catch (error) {
      const e = error as AxiosError<{ detail?: string }>
      throw new Error(e.response?.data?.detail || 'Failed to fetch payment status')
    }
  },

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  },

  async openPaymentModal(
    orderDetails: OrderDetails,
    onSuccess: (response: Record<string, unknown>) => void,
    onFailure: (error: Error) => void
  ) {
    const loaded = await this.loadRazorpayScript()
    if (!loaded) throw new Error('Failed to load Razorpay SDK')

    const razorpayKey = orderDetails.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID

    const options: Record<string, unknown> = {
      key: razorpayKey,
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      name: 'ExcelfromPDF',
      description: orderDetails.plan_name,
      handler: (response: Record<string, unknown>) => onSuccess(response),
      prefill: {
        email: orderDetails.email,
        name: orderDetails.name,
      },
      theme: { color: '#166534' },
      modal: {
        ondismiss: () => onFailure(new Error('Payment cancelled by user')),
      },
    }

    if (orderDetails.subscription_id) {
      options.subscription_id = orderDetails.subscription_id
    } else if (orderDetails.order_id) {
      options.order_id = orderDetails.order_id
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  },
}

export default paymentService
