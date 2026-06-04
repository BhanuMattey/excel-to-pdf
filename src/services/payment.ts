import axios, { AxiosError } from 'axios'

const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_BASE_URL ?? ''

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
  async createOrder(planId: string, userEmail: string, userName: string | null = null, userId?: string) {
    try {
      const response = await axios.post(`${PAYMENT_API_BASE_URL}/api/payment/create-order`, {
        plan_id: planId,
        user_email: userEmail,
        user_name: userName,
        user_id: userId ?? null,
      })
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
    try {
      const response = await axios.post(`${PAYMENT_API_BASE_URL}/api/payment/verify`, paymentData)
      return response.data as { success: boolean; plan: string; renewal_date?: string }
    } catch (error) {
      const e = error as AxiosError<{ detail?: string }>
      throw new Error(e.response?.data?.detail || 'Payment verification failed')
    }
  },

  async cancelSubscription(subscriptionId: string, userId: string, userEmail: string) {
    try {
      const response = await axios.post(`${PAYMENT_API_BASE_URL}/api/payment/cancel-subscription`, {
        subscription_id: subscriptionId,
        user_id: userId,
        user_email: userEmail,
      })
      return response.data
    } catch (error) {
      const e = error as AxiosError<{ detail?: string }>
      throw new Error(e.response?.data?.detail || 'Cancellation failed')
    }
  },

  async getPaymentStatus(paymentId: string) {
    try {
      const response = await axios.get(`${PAYMENT_API_BASE_URL}/api/payment/status/${paymentId}`)
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

    // Use subscription_id for recurring, order_id for one-time
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
