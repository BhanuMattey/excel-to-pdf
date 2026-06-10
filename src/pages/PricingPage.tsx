import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Layers3,
  Loader2,
  ScanText,
  ShieldCheck,
  Sparkles,
  TableProperties,
  X,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar, Footer } from '../components/layout'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { paymentService } from '../services/payment'

const RUPEE = '₹'
const PRICES = {
  monthly: 499,
  yearly: 3599,
} as const

type BillingCycle = keyof typeof PRICES

function buildPlanId(cycle: BillingCycle) {
  return `pro_${cycle}_INR`
}

function formatPrice(amount: number) {
  return `${RUPEE}${amount.toLocaleString('en-IN')}`
}

const freeFeatures = [
  { text: '5 starter conversions', active: true },
  { text: 'Standard table extraction', active: true },
  { text: 'Basic OCR support', active: true },
  { text: 'Clean formatted exports', active: true },
  { text: 'Unlimited conversions', active: false },
  { text: 'Unlimited file size', active: false },
  { text: 'Priority support', active: false },
]

const proFeatures = [
  'Unlimited PDF to Excel conversions',
  'Advanced OCR for scanned documents',
  'Unlimited file size',
  'Preserved tables, headers, and merged cells',
  'Clean formatted exported files',
  'Conversion history and invoice access',
  'Priority email support',
]

const capabilityRows = [
  { feature: 'PDF to Excel conversion', free: '5 conversions', pro: 'Unlimited' },
  { feature: 'Scanned PDF OCR', free: 'Basic', pro: 'Advanced' },
  { feature: 'File size limit', free: 'Free limit', pro: 'Unlimited' },
  { feature: 'Excel formatting', free: 'Borders and wrap text', pro: 'Borders and wrap text' },
  { feature: 'Conversion history', free: 'Limited', pro: 'Full history' },
  { feature: 'Support', free: 'Community', pro: 'Priority email' },
]

const workflowCards = [
  {
    icon: ScanText,
    title: 'Read messy PDFs',
    body: 'Handle scanned invoices, bank statements, reports, and operational documents with cleaner extraction.',
  },
  {
    icon: TableProperties,
    title: 'Preserve structure',
    body: 'Keep tables, headers, merged cells, and sheet order aligned with the original document.',
  },
  {
    icon: Layers3,
    title: 'Scale your workflow',
    body: 'Convert repeat batches without rationing usage or manually cleaning every export.',
  },
]

const trustItems = [
  { icon: ShieldCheck, text: '256-bit SSL encryption' },
  { icon: Clock, text: 'Files auto-deleted in 24 h' },
  { icon: CreditCard, text: 'Secure payments via Razorpay' },
  { icon: BadgeCheck, text: 'Cancel anytime' },
]

const faqs = [
  {
    question: 'Can I start without paying?',
    answer: 'Yes. The Free plan gives you starter conversions so you can test real documents before upgrading.',
  },
  {
    question: 'What changes when I upgrade?',
    answer: 'Pro unlocks unlimited conversions, larger files, advanced OCR, conversion history, and priority support.',
  },
  {
    question: 'Can I switch billing cycles?',
    answer: 'Yes. Choose monthly when you want flexibility, or yearly when you want the best effective monthly price.',
  },
  {
    question: 'Are my files kept forever?',
    answer: 'No. Uploaded and converted files are removed within 24 hours after processing.',
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`rounded-2xl border bg-white transition-all duration-300 ${open ? 'border-brand-green-200 shadow-md shadow-brand-green-700/5' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-950">{question}</span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${open ? 'bg-brand-green-50 text-brand-green-700 rotate-180' : 'bg-gray-50 text-gray-500'}`}>
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <p className="px-5 pb-5 text-sm leading-6 text-gray-500">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FeatureLine({ text, active = true, inverted = false }: { text: string; active?: boolean; inverted?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          active
            ? inverted ? 'bg-brand-green-400/20 text-brand-green-300' : 'bg-brand-green-50 text-brand-green-700'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {active ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
      <span className={`text-sm ${active ? (inverted ? 'text-gray-200' : 'text-gray-700') : 'text-gray-400'}`}>{text}</span>
    </li>
  )
}

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { upgradePlan } = usePlan()

  const monthlyEquivalent = Math.round(PRICES.yearly / 12)
  const yearlyDiscount = Math.round((1 - PRICES.yearly / (PRICES.monthly * 12)) * 100)
  const selectedPlanId = buildPlanId(billingCycle)
  const isProLoading = loadingPlan === selectedPlanId
  const displayMonthly = billingCycle === 'yearly' ? monthlyEquivalent : PRICES.monthly

  const handlePlanSelect = async (planId: 'free' | 'pro', cycle: BillingCycle) => {
    if (planId === 'free') {
      navigate(user ? '/dashboard' : '/signup')
      return
    }

    const fullPlanId = buildPlanId(cycle)

    if (!user) {
      navigate('/login', {
        state: {
          from: '/pricing',
          planId: fullPlanId,
          billingCycle: cycle,
        },
      })
      return
    }

    setLoadingPlan(fullPlanId)

    try {
      const orderResponse = await paymentService.createOrder(fullPlanId, user.email, user.name || null, user.id)
      if (!orderResponse.success) throw new Error('Failed to create order')

      await paymentService.openPaymentModal(
        {
          ...orderResponse.order,
          key_id: orderResponse.order?.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
          email: user.email,
          name: user.name || user.email,
        },
        async (response) => {
          try {
            const verifyPayload: Record<string, unknown> = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: fullPlanId,
              user_email: user.email,
              user_id: user.id,
            }

            if (response.razorpay_subscription_id) {
              verifyPayload.razorpay_subscription_id = response.razorpay_subscription_id
              verifyPayload.payment_type = 'subscription'
            } else {
              verifyPayload.razorpay_order_id = response.razorpay_order_id
              verifyPayload.payment_type = 'one_time'
            }

            const verificationResponse = await paymentService.verifyPayment(verifyPayload)
            if (verificationResponse.success) {
              upgradePlan('pro', {
                plan: 'pro',
                planId: fullPlanId,
                subscriptionId: (response.razorpay_subscription_id as string) ?? null,
                subscriptionStatus: 'active',
                renewalDate: verificationResponse.renewal_date ?? null,
              })
              toast.success('Payment successful! Your plan has been upgraded.')
              navigate('/dashboard')
            }
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Payment verification failed')
          } finally {
            setLoadingPlan(null)
          }
        },
        (error: Error) => {
          toast.error(error.message || 'Payment cancelled')
          setLoadingPlan(null)
        }
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initiate payment')
      setLoadingPlan(null)
    }
  }

  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SEO
        title="Pricing — ExcelFromPDF PDF to Excel Converter"
        description="Start free with 5 conversions. Upgrade to Pro for unlimited PDF to Excel conversions, priority processing, and more."
        canonical="/pricing"
        schema={faqSchema}
      />
      <Navbar />

      <main className="flex-grow">
        {/* Hero + plan cards */}
        <section className="relative overflow-hidden bg-white pt-28 pb-20 sm:pt-32">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#eef2f7_1px,transparent_1px),linear-gradient(to_bottom,#eef2f7_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_0%,rgba(34,197,94,0.08),transparent_70%)]" />
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-green-200/40 blur-3xl animate-blob" />
          <div className="pointer-events-none absolute top-1/4 -right-24 h-96 w-96 rounded-full bg-brand-teal-200/40 blur-3xl animate-blob-slow" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-brand-green-100 bg-gradient-to-r from-brand-green-50 to-brand-teal-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green-600" />
                </span>
                Simple, transparent pricing
                <Sparkles className="h-3.5 w-3.5 text-brand-amber-500" />
              </div>

              <h1 className="animate-fade-up anim-delay-100 text-4xl font-bold leading-tight tracking-tight text-gray-950 sm:text-6xl">
                One plan to unlock{' '}
                <span className="gradient-text">every conversion.</span>
              </h1>
              <p className="animate-fade-up anim-delay-200 mx-auto mt-5 max-w-xl text-base leading-7 text-gray-500 sm:text-lg">
                Start free, no credit card needed. Upgrade when conversions become part of your daily
                workflow — cancel anytime.
              </p>

              {/* Billing toggle */}
              <div className="animate-fade-up anim-delay-300 mt-9 inline-flex items-center rounded-full border border-gray-200 bg-white p-1.5 shadow-sm">
                {(['monthly', 'yearly'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`relative rounded-full px-5 py-2 text-sm font-semibold capitalize transition-colors ${
                      billingCycle === cycle ? 'text-white' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {billingCycle === cycle && (
                      <motion.span
                        layoutId="billing-pill"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-green-700 to-brand-teal-700 shadow-md"
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {cycle}
                      {cycle === 'yearly' && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${billingCycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-brand-green-50 text-brand-green-700'}`}>
                          −{yearlyDiscount}%
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan cards */}
            <div className="animate-fade-up anim-delay-400 mx-auto mt-14 grid max-w-4xl items-stretch gap-6 lg:grid-cols-2">
              {/* Free */}
              <div className="flex flex-col rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-950/5 sm:p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-100">
                    <FileSpreadsheet className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-950">Free</h2>
                    <p className="text-sm text-gray-500">Test the workflow with real files</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-extrabold tracking-tight text-gray-950">{RUPEE}0</span>
                    <span className="pb-1.5 text-sm font-medium text-gray-400">/ forever</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">No credit card, no commitment.</p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlanSelect('free', billingCycle)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
                >
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </button>

                <ul className="mt-7 flex-1 space-y-3.5 border-t border-gray-100 pt-7">
                  {freeFeatures.map((feature) => (
                    <FeatureLine key={feature.text} text={feature.text} active={feature.active} />
                  ))}
                </ul>
              </div>

              {/* Pro */}
              <div className="relative rounded-3xl bg-gradient-to-br from-brand-green-500 via-brand-teal-500 to-brand-green-700 p-[1.5px] shadow-2xl shadow-brand-green-900/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-green-900/35">
                <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-green-700 to-brand-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Most popular
                  </span>
                </div>

                <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-gray-950 p-7 text-white sm:p-8">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
                  <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-brand-green-600/25 blur-3xl animate-blob" />
                  <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-brand-teal-600/25 blur-3xl animate-blob-slow" />

                  <div className="relative mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                      <Zap className="h-5 w-5 text-brand-green-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Professional</h2>
                      <p className="text-sm text-gray-400">For repeat document work</p>
                    </div>
                  </div>

                  <div className="relative mb-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={billingCycle}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="flex items-end gap-1.5">
                          <span className="text-5xl font-extrabold tracking-tight">{formatPrice(displayMonthly)}</span>
                          <span className="pb-1.5 text-sm font-medium text-gray-400">/ month</span>
                        </div>
                        <p className="mt-2 text-sm text-brand-green-300">
                          {billingCycle === 'yearly'
                            ? `Billed ${formatPrice(PRICES.yearly)} yearly — save ${yearlyDiscount}%`
                            : 'Billed monthly, cancel anytime'}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect('pro', billingCycle)}
                    disabled={isProLoading}
                    className="btn-shine relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-green-900/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isProLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        Upgrade to Professional
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <p className="relative mt-3 text-center text-xs text-gray-500">
                    Secure checkout via Razorpay · Cancel anytime
                  </p>

                  <ul className="relative mt-6 flex-1 space-y-3.5 border-t border-white/10 pt-7">
                    {proFeatures.map((feature) => (
                      <FeatureLine key={feature} text={feature} inverted />
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Trust strip */}
            <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {trustItems.map((item) => {
                const Icon = item.icon
                return (
                  <span key={item.text} className="inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                    <Icon className="h-4 w-4 text-brand-green-700" />
                    {item.text}
                  </span>
                )
              })}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="border-y border-gray-100 bg-gray-50 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="inline-flex items-center rounded-full border border-brand-green-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-green-700 shadow-sm">
                Plan comparison
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                A clear upgrade path.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                Free is for testing. Professional is for repeated document work where speed and clean
                exports matter.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] border-b border-gray-100 bg-gray-50/80 px-5 py-4 sm:px-8">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Capability</span>
                <span className="text-center text-xs font-bold uppercase tracking-widest text-gray-400">Free</span>
                <span className="text-center text-xs font-bold uppercase tracking-widest text-brand-green-700">Professional</span>
              </div>
              {capabilityRows.map((row) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center border-b border-gray-50 px-5 py-4 transition-colors last:border-b-0 hover:bg-gray-50/50 sm:px-8"
                >
                  <span className="pr-3 text-sm font-semibold text-gray-900">{row.feature}</span>
                  <span className="text-center text-sm text-gray-500">{row.free}</span>
                  <span className="rounded-lg bg-brand-green-50/70 px-2 py-1.5 text-center text-sm font-semibold text-brand-green-800">
                    {row.pro}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <p className="inline-flex items-center rounded-full border border-brand-teal-100 bg-brand-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-teal-700 shadow-sm">
                What Pro feels like
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Built for documents <span className="gradient-text">at volume.</span>
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {workflowCards.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.32, delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-green-700/5"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-green-600 via-brand-teal-600 to-brand-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg, #166534, #0d9488)' }}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-500">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-gray-100 bg-gray-50 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="inline-flex items-center rounded-full border border-brand-green-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-green-700 shadow-sm">
                FAQ
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-950">
                Questions before you choose?
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gray-50 pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gray-950 px-6 py-16 text-center sm:px-12">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
              <div className="pointer-events-none absolute -top-28 left-1/4 h-72 w-72 rounded-full bg-brand-green-600/30 blur-3xl animate-blob" />
              <div className="pointer-events-none absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-brand-teal-600/30 blur-3xl animate-blob-slow" />

              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready for fewer limits?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-gray-400">
                  Keep testing for free, or upgrade when conversions become part of your daily
                  workflow.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handlePlanSelect('pro', billingCycle)}
                    disabled={isProLoading}
                    className="btn-shine group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-950 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isProLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Upgrade now
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(user ? '/dashboard' : '/signup')}
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-colors duration-300 hover:bg-white/10"
                  >
                    Continue free
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default PricingPage
