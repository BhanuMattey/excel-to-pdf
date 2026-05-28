import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const paymentService = {
  /**
   * Create a Razorpay order
   */
  async createOrder(planId, userEmail, userName = null) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/payment/create-order`, {
        plan_id: planId,
        user_email: userEmail,
        user_name: userName
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create order')
    }
  },

  /**
   * Verify payment after successful Razorpay payment
   */
  async verifyPayment(paymentData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/payment/verify`, paymentData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Payment verification failed')
    }
  },

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/payment/status/${paymentId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch payment status')
    }
  },

  /**
   * Load Razorpay checkout script
   */
  loadRazorpayScript() {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  },

  /**
   * Open Razorpay payment modal
   */
  async openPaymentModal(orderDetails, onSuccess, onFailure) {
    const loaded = await this.loadRazorpayScript()
    
    if (!loaded) {
      throw new Error('Failed to load Razorpay SDK')
    }

    const options = {
      key: orderDetails.key_id,
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      name: 'ExcelfromPDF',
      description: orderDetails.plan_name,
      order_id: orderDetails.order_id,
      handler: function (response) {
        onSuccess(response)
      },
      prefill: {
        email: orderDetails.email,
        name: orderDetails.name,
      },
      theme: {
        color: '#4F46E5' // Primary color
      },
      modal: {
        ondismiss: function() {
          onFailure(new Error('Payment cancelled by user'))
        }
      }
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }
}

export default paymentService
