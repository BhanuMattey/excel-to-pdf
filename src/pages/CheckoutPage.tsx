import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Smartphone, Wallet, Lock, Check, Shield, Loader2 } from 'lucide-react'
import { usePlan } from '../context/PlanContext'
import { useAuth } from '../context/AuthContext'
import { paymentService } from '../services/payment'
import toast from 'react-hot-toast'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { upgradePlan } = usePlan()

  const planFromState = location.state?.plan || 'pro'
  const billingCycle = location.state?.billingCycle || 'monthly'

  const [loading, setLoading] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Please login to continue')
      navigate('/login', { state: { from: '/checkout', plan: planFromState, billingCycle } })
    }
  }, [user, navigate, planFromState, billingCycle])

  const planDetails = {
    pro_monthly: {
      name: 'Pro Plan',
      price: 499,
      currency: '\u20b9',
      billingCycle: 'Billed monthly',
      planId: 'pro_monthly_INR',
    },
    pro_yearly: {
      name: 'Pro Plan',
      price: 3599,
      currency: '\u20b9',
      billingCycle: 'Billed yearly (Save 40%)',
      planId: 'pro_yearly_INR',
    },
  }

  // Get plan ID from location state or default to pro_monthly_INR
  const selectedPlanId = (location.state?.planId || 'pro_monthly_INR') as string
  const checkoutPlanKey = selectedPlanId.includes('yearly') ? 'pro_yearly' : 'pro_monthly'
  const currentPlan = planDetails[checkoutPlanKey]
  const paymentPlanId = currentPlan.planId

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to continue')
      navigate('/login')
      return
    }

    setLoading(true)
    setProcessingPayment(true)

    try {
      // Create order
      const orderResponse = await paymentService.createOrder(
        paymentPlanId,
        user.email,
        user.name || null,
        user.id
      )

      if (!orderResponse.success) {
        throw new Error('Failed to create order')
      }

      const orderDetails = {
        ...orderResponse.order,
        email: user.email,
        name: user.name || user.email,
      }

      // Open Razorpay payment modal
      await paymentService.openPaymentModal(
        orderDetails,
        async (response) => {
          // Payment successful
          try {
            setProcessingPayment(true)
            const verificationResponse = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: paymentPlanId,
              user_email: user.email,
              user_id: user.id
            })

            if (verificationResponse.success) {
              // Update plan in context (extract base plan name from planId)
              const basePlan = paymentPlanId.split('_')[0] as 'pro' | 'free'
              upgradePlan(basePlan, {
                plan: basePlan,
                planId: paymentPlanId,
                subscriptionId: (response.razorpay_subscription_id as string) ?? null,
                subscriptionStatus: 'active',
                renewalDate: verificationResponse.renewal_date ?? null,
              })
              
              toast.success('Payment successful! Your plan has been upgraded!')
              navigate('/dashboard')
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Payment verification failed')
            setProcessingPayment(false)
          }
        },
        (error: Error) => {
          toast.error(error.message || 'Payment cancelled')
          setLoading(false)
          setProcessingPayment(false)
        }
      )

      setLoading(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate payment')
      setLoading(false)
      setProcessingPayment(false)
    }
  }

  const paymentMethods = [
    { id: 'razorpay', label: 'Razorpay', desc: 'Card, UPI, Netbanking, Wallets', icon: CreditCard },
  ]

  const includedFeatures = [
    'Unlimited PDF to Excel conversions',
    'Scanned PDF conversion support',
    'Preserve original table formatting',
    'Ad-free experience & Priority support',
  ]

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="ExcelfromPDF" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center text-green-600 text-sm font-medium">
            <Lock className="w-4 h-4 mr-1" />
            SECURE CHECKOUT
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left - Payment Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Complete your purchase
              </h1>
              <p className="text-gray-600 mb-8">
                Unlock unlimited PDF to Excel conversions instantly.
              </p>

              {/* Plan Details */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 mb-6 border border-primary-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {currentPlan.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {currentPlan.billingCycle}
                    </p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {currentPlan.currency}{currentPlan.price}
                      </span>
                      <span className="text-gray-600 ml-2">/month</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-600">
                    SELECTED
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Payment Method
                </h3>
                <div className="border-2 border-primary-500 bg-primary-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xs mr-3">
                      RAZORPAY
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Razorpay</p>
                      <p className="text-sm text-gray-600">Card, UPI, Wallet & more</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 flex items-center">
                  <Lock className="w-4 h-4 mr-1.5 text-gray-400" />
                  Secure payment powered by Razorpay
                </p>
              </div>

              {/* Proceed to Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-primary-200"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Pay {currentPlan.currency}{currentPlan.price} →
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                <Shield className="w-4 h-4 mr-1.5" />
                256-bit SSL encrypted payment
              </div>
            </motion.div>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-8"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{currentPlan.name}</p>
                    <p className="text-sm text-gray-500">{currentPlan.billingCycle}</p>
                  </div>
                  <span className="font-medium text-gray-900">{currentPlan.currency}{currentPlan.price}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes</span>
                  <span>Included</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="font-medium text-gray-900">Total due today</span>
                  <span className="text-2xl font-bold text-gray-900">{currentPlan.currency}{currentPlan.price}</span>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  What's Included
                </h3>
                <ul className="space-y-2">
                  {includedFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Guarantee */}
              <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
                <Shield className="w-4 h-4 mr-1" />
                30-day money-back guarantee
              </div>

              <p className="text-center text-sm text-gray-500">
                Need help?{' '}
                <Link to="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
                  Contact Support
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ExcelfromPDF. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-700">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CheckoutPage
