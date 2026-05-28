import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Plus, Minus } from 'lucide-react'
import { Navbar, Footer } from '../components/layout'
import { useAuth } from '../context/AuthContext'

const PricingCard = ({ plan, isPopular, billingCycle, onSelect }) => {
  const price = billingCycle === 'yearly' 
    ? plan.price.yearly
    : plan.price.monthly

  const yearlyDiscount = billingCycle === 'yearly' && plan.price.yearly > 0
    ? Math.round((1 - (plan.price.yearly / (plan.price.monthly * 12))) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-2xl border ${
        isPopular ? 'border-primary-500 shadow-lg' : 'border-gray-200'
      } p-6 flex flex-col`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-6">
          <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
        <div className="mt-2 flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">₹{price}</span>
          <span className="text-gray-500 ml-1">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
        </div>
        {yearlyDiscount > 0 && (
          <span className="inline-block mt-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
            Save {yearlyDiscount}%
          </span>
        )}
        <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
      </div>

      <button
        onClick={() => onSelect(plan.id, billingCycle)}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          plan.id === 'free'
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : plan.id === 'team'
            ? 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
            : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {plan.cta}
      </button>

      <ul className="mt-6 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className={`w-5 h-5 mr-2 flex-shrink-0 ${
              plan.id === 'free' ? 'text-primary-600' : 'text-gray-400'
            }`} />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <Minus className="w-5 h-5 text-gray-400" />
        ) : (
          <Plus className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-6 pb-4"
        >
          <p className="text-gray-600">{answer}</p>
        </motion.div>
      )}
    </div>
  )
}

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const navigate = useNavigate()
  const { user } = useAuth()

  const plans = [
    {
      id: 'free',
      name: 'Early Access',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for trying out the power of AI extraction.',
      cta: 'Join for Free',
      features: [
        'First 500 Users Only',
        '50 pages/month',
        'Basic OCR Engine',
        'Community Support',
      ],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: { monthly: 999, yearly: 7999 },
      description: 'For power users who need volume & precision.',
      cta: 'Get Pro',
      features: [
        'Unlimited pages',
        'Advanced AI Table Recognition',
        'Priority Email Support',
        'No watermarks',
      ],
    },
    {
      id: 'team',
      name: 'Team',
      price: { monthly: 2499, yearly: 19999 },
      description: 'Collaborate with your team on large projects.',
      cta: 'Contact Sales',
      features: [
        '5 User seats included',
        'Full API Access',
        'Admin Dashboard',
        'SSO Integration',
      ],
    },
  ]

  const faqs = [
    {
      question: 'How accurate is the table extraction?',
      answer: 'Our AI-powered extraction achieves 99.8% accuracy on standard table formats. Complex layouts with merged cells and nested tables are handled with advanced algorithms that preserve the original structure.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. All files are encrypted using 256-bit SSL during transfer and at rest. We automatically delete your files after processing, and we never share your data with third parties.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. If you cancel, you\'ll continue to have access until the end of your billing period. We also offer a 30-day money-back guarantee.',
    },
  ]

  const stats = [
    { value: '1M+', label: 'PAGES CONVERTED' },
    { value: '99.8%', label: 'ACCURACY RATE' },
    { value: '50k+', label: 'HAPPY USERS' },
  ]

  const handlePlanSelect = (planId, billingCycle) => {
    if (planId === 'free') {
      if (user) {
        navigate('/dashboard')
      } else {
        navigate('/signup')
      }
    } else if (planId === 'pro') {
      const planIdWithCycle = billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly'
      navigate('/checkout', { 
        state: { 
          planId: planIdWithCycle,
          billingCycle 
        } 
      })
    } else if (planId === 'team') {
      const planIdWithCycle = billingCycle === 'yearly' ? 'team_yearly' : 'team_monthly'
      navigate('/checkout', { 
        state: { 
          planId: planIdWithCycle,
          billingCycle 
        } 
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block px-4 py-1 bg-primary-50 text-primary-600 text-sm font-semibold rounded-full mb-4">
              FAIR & TRANSPARENT
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple pricing for powerful data extraction
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-8">
              Unlock the power of AI PDF conversion. Join our Early Access program for free, 
              or upgrade for unlimited power when you need it.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="mx-4 relative w-14 h-7 bg-gray-200 rounded-full transition-colors"
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isPopular={index === 0}
                billingCycle={billingCycle}
                onSelect={handlePlanSelect}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 tracking-wider mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PricingPage
