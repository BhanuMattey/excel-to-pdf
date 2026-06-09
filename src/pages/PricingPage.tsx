import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Layers3,
  Loader2,
  LockKeyhole,
  ScanText,
  Shield,
  Sparkles,
  TableProperties,
  Timer,
  X,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar, Footer } from '../components/layout'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { paymentService } from '../services/payment'

const RUPEE = '\u20b9'
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

const planMetrics = [
  { value: '24h', label: 'file retention window' },
  { value: 'Clean', label: 'formatted exports' },
  { value: 'INR', label: 'simple local billing' },
]

const freeFeatures = [
  { text: '5 starter conversions', active: true },
  { text: 'Standard table extraction', active: true },
  { text: 'Basic OCR support', active: true },
  { text: 'Clean formatted exports', active: true },
  { text: 'Unlimited conversions', active: false },
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
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-950">{question}</span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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

function FeatureLine({ text, active, inverted = false }: { text: string; active: boolean; inverted?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          active
            ? inverted ? 'bg-white/10 text-white' : 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {active ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
      <span className={`text-sm ${active ? inverted ? 'text-green-50' : 'text-gray-700' : 'text-gray-400'}`}>{text}</span>
    </li>
  )
}

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { upgradePlan } = usePlan()

  const displayPrice = PRICES[billingCycle]
  const monthlyEquivalent = Math.round(PRICES.yearly / 12)
  const yearlyDiscount = Math.round((1 - PRICES.yearly / (PRICES.monthly * 12)) * 100)
  const selectedPlanId = buildPlanId(billingCycle)
  const isProLoading = loadingPlan === selectedPlanId

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
    <div className="flex min-h-screen flex-col bg-[#f7faf8]">
      <SEO
        title="Pricing — ExcelFromPDF PDF to Excel Converter"
        description="Start free with 5 conversions. Upgrade to Pro for unlimited PDF to Excel conversions, priority processing, and more."
        canonical="/pricing"
        schema={faqSchema}
      />
      <Navbar />

      <main className="flex-grow">
        <section className="relative overflow-hidden bg-white pt-24 sm:pt-28">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#edf2ee_1px,transparent_1px),linear-gradient(to_bottom,#edf2ee_1px,transparent_1px)] bg-[size:3.25rem_3.25rem] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pricing built for clean spreadsheet workflows
                </div>
                <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-6xl">
                  Choose the plan that keeps your documents moving.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500 sm:text-lg sm:leading-8">
                  Convert PDFs into structured Excel files with fewer limits, less cleanup, and a workflow that stays fast as your documents scale.
                </p>

                <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                  {planMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-gray-100 bg-white/85 p-4 shadow-sm">
                      <div className="text-2xl font-extrabold tracking-tight text-gray-950">{metric.value}</div>
                      <div className="mt-1 text-xs font-medium leading-5 text-gray-500">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, delay: 0.08 }}
                className="rounded-[1.75rem] border border-gray-100 bg-gray-950 p-2 shadow-2xl shadow-gray-950/20"
              >
                <div className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,#052e16,#111827_58%,#0f766e)] p-5 text-white">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Professional</p>
                      <h2 className="mt-1 text-xl font-bold">For repeat document work</h2>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-100">
                      Save {yearlyDiscount}%
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/8 p-1.5">
                    <div className="grid grid-cols-2 gap-1">
                      {(['monthly', 'yearly'] as const).map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => setBillingCycle(cycle)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-bold capitalize transition-colors ${
                            billingCycle === cycle ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          {cycle}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={billingCycle}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="py-7"
                    >
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-extrabold tracking-tight">{formatPrice(displayPrice)}</span>
                        <span className="pb-2 text-sm font-semibold text-emerald-200">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">
                        {billingCycle === 'yearly'
                          ? `Approx. ${formatPrice(monthlyEquivalent)}/mo, billed annually`
                          : 'Billed monthly, cancel anytime'}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect('pro', billingCycle)}
                    disabled={isProLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-950 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
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

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {[
                      { value: 'OCR', label: 'Advanced' },
                      { value: '∞', label: 'Conversions' },
                      { value: 'Clean', label: 'Exports' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-white/8 px-3 py-3">
                        <div className="text-lg font-extrabold">{item.value}</div>
                        <div className="mt-1 text-[11px] font-medium text-gray-300">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.35 }}
                className="flex min-h-[560px] flex-col rounded-[2rem] border border-gray-100 bg-white p-7 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] ring-1 ring-gray-950/[0.02] sm:p-8"
              >
                <div className="mb-7 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-100">
                    <FileSpreadsheet className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Free</p>
                    <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">Start with real files</h2>
                  </div>
                </div>

                <div className="mb-7">
                  <p className="text-5xl font-extrabold tracking-tight text-gray-950">Free</p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">Enough to validate the workflow before you upgrade.</p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlanSelect('free', billingCycle)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 px-5 py-3.5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-200"
                >
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="mt-7 flex-1 border-t border-gray-100 pt-7">
                  <ul className="space-y-4">
                    {freeFeatures.map((feature) => (
                      <FeatureLine key={feature.text} text={feature.text} active={feature.active} />
                    ))}
                  </ul>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="relative flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] bg-emerald-950 p-7 text-white shadow-[0_32px_90px_-38px_rgba(5,46,22,0.75)] sm:p-8"
              >
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
                <div className="absolute -bottom-28 left-16 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" />

                <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Professional</p>
                      <h2 className="text-2xl font-extrabold tracking-tight text-white">Run without limits</h2>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Recommended
                  </span>
                </div>

                <div className="relative grid flex-1 gap-8 lg:grid-cols-[0.85fr_1fr] lg:items-center">
                  <div>
                    <p className="text-6xl font-extrabold tracking-tight">{formatPrice(displayPrice)}</p>
                    <p className="mt-3 text-sm font-medium text-emerald-200">
                      {billingCycle === 'yearly'
                        ? `Approx. ${formatPrice(monthlyEquivalent)}/mo`
                        : 'Monthly flexibility'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handlePlanSelect('pro', billingCycle)}
                      disabled={isProLoading}
                      className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isProLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          Choose Professional
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {proFeatures.map((feature) => (
                      <FeatureLine key={feature} text={feature} active inverted />
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-100 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Plan comparison</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">A clear upgrade path.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-gray-500">
                Free is for testing. Professional is for repeated document work where speed and clean exports matter.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-sm">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 sm:px-6">
                <span>Capability</span>
                <span>Free</span>
                <span>Professional</span>
              </div>
              {capabilityRows.map((row) => (
                <div key={row.feature} className="grid grid-cols-[1.2fr_0.8fr_0.8fr] items-center border-b border-gray-50 px-4 py-4 last:border-b-0 sm:px-6">
                  <span className="text-sm font-semibold text-gray-900">{row.feature}</span>
                  <span className="text-sm text-gray-500">{row.free}</span>
                  <span className="text-sm font-semibold text-emerald-800">{row.pro}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {workflowCards.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.32, delay: index * 0.05 }}
                  className="rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                    <item.icon className="h-5 w-5 text-emerald-800" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-500">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35 }}
              className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">FAQ</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950">Questions before you choose?</h2>
              <div className="mt-6 space-y-3">
                {faqs.map((faq) => (
                  <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.35, delay: 0.06 }}
              className="flex flex-col justify-between rounded-[1.75rem] bg-gray-950 p-6 text-white shadow-2xl shadow-gray-950/20"
            >
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">Ready for fewer limits?</h2>
                <p className="mt-4 text-sm leading-7 text-gray-300">
                  Keep testing for free, or upgrade when conversions become part of your daily workflow.
                </p>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => handlePlanSelect('pro', billingCycle)}
                  disabled={isProLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-950 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isProLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Upgrade now
                </button>
                <button
                  type="button"
                  onClick={() => navigate(user ? '/dashboard' : '/signup')}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Continue free
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default PricingPage
