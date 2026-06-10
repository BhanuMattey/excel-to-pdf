import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  Calendar,
  CreditCard,
  Download,
  FileText,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  Sparkles,
  Upload,
  User,
  XCircle,
  Zap,
} from 'lucide-react'
import { Navbar, Footer } from '../components/layout'
import { UsageStats, ConversionHistory } from '../components/dashboard'
import { UploadBox } from '../components/upload'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { profileService } from '../services/db'
import { paymentService } from '../services/payment'
import toast from 'react-hot-toast'

type Tab = 'dashboard' | 'profile'

interface PaymentRecord {
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

function formatCurrency(displayAmount: number | null, amount: number, currency: string) {
  const value = displayAmount ?? amount / 100
  if (currency === 'INR') return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function planLabel(planId: string | null) {
  if (!planId) return 'Free'
  if (planId.includes('yearly')) return 'Professional (Yearly)'
  if (planId.includes('monthly')) return 'Professional (Monthly)'
  return 'Professional'
}

function printInvoice(payment: PaymentRecord, userName: string, userEmail: string) {
  const amount = formatCurrency(payment.display_amount, payment.amount, payment.currency)
  const date = formatDate(payment.created_at)
  const plan = planLabel(payment.plan_id)
  const invoiceNo = `INV-${payment.id.slice(-8).toUpperCase()}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoiceNo} — ExcelfromPDF</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 22px; font-weight: 800; color: #166534; }
    .brand span { display: block; font-size: 11px; font-weight: 400; color: #6b7280; margin-top: 2px; }
    .inv-meta { text-align: right; font-size: 13px; color: #6b7280; }
    .inv-meta strong { display: block; font-size: 18px; font-weight: 700; color: #1f2937; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
    .section-value { font-size: 14px; color: #374151; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
    td { padding: 14px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
    .total-row td { font-weight: 700; font-size: 16px; color: #166534; border-bottom: none; border-top: 2px solid #e5e7eb; }
    .badge { display: inline-block; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 99px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
    .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">ExcelfromPDF<span>support@excelfrompdf.com</span></div>
    <div class="inv-meta">
      <strong>${invoiceNo}</strong>
      Issued: ${date}
    </div>
  </div>
  <hr class="divider" />
  <div class="grid">
    <div>
      <div class="section-label">Billed To</div>
      <div class="section-value"><strong>${userName}</strong><br />${userEmail}</div>
    </div>
    <div>
      <div class="section-label">Payment Method</div>
      <div class="section-value">Razorpay${payment.payment_type === 'subscription' ? ' (Subscription)' : ''}<br />
        ${payment.razorpay_payment_id ? `Ref: ${payment.razorpay_payment_id}` : ''}
      </div>
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Billing</th><th>Status</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${plan}</td>
        <td>${payment.plan_id?.includes('yearly') ? 'Annual' : 'Monthly'}</td>
        <td><span class="badge">Paid</span></td>
        <td style="text-align:right">${amount}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row"><td colspan="3">Total</td><td style="text-align:right">${amount}</td></tr>
    </tfoot>
  </table>
  <div class="footer">Thank you for using ExcelfromPDF. This is a computer-generated invoice.</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) { toast.error('Please allow popups to download invoices'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}

const DashboardPage = () => {
  const { user, signOut, isPro } = useAuth()
  const { planProfile, refreshPlan } = usePlan()
  const navigate = useNavigate()
  const location = useLocation()

  // Read tab from URL hash: #profile → profile, else dashboard
  const hashTab = location.hash === '#profile' ? 'profile' : 'dashboard'
  const [activeTab, setActiveTab] = useState<Tab>(hashTab)

  useEffect(() => {
    setActiveTab(location.hash === '#profile' ? 'profile' : 'dashboard')
  }, [location.hash])

  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const renewalDate = planProfile?.renewalDate ? formatDate(planProfile.renewalDate) : null
  const isCancelled = planProfile?.subscriptionStatus === 'cancelled'

  const loadPayments = useCallback(async () => {
    if (!user?.id || !user?.email) return
    setLoadingPayments(true)
    try {
      const data = await profileService.getPayments(user.id, user.email)
      setPayments(data.filter(p => p.status === 'paid'))
    } catch {
      // non-fatal
    } finally {
      setLoadingPayments(false)
    }
  }, [user?.id, user?.email])

  // Load payments when switching to profile tab
  useEffect(() => {
    if (activeTab === 'profile') loadPayments()
  }, [activeTab, loadPayments])

  const handleCancelSubscription = async () => {
    if (!user?.id || !user?.email || !planProfile?.subscriptionId) return
    setCancelling(true)
    try {
      await paymentService.cancelSubscription(planProfile.subscriptionId, user.id, user.email)
      await refreshPlan()
      toast.success('Subscription cancelled. Access continues until end of billing period.')
      setShowCancelConfirm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancellation failed')
    } finally {
      setCancelling(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    navigate(tab === 'profile' ? '/dashboard#profile' : '/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-20 pb-10 sm:pb-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

          {/* Header banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="relative overflow-hidden rounded-3xl bg-gray-950 px-5 py-6 text-white shadow-xl shadow-gray-950/10 sm:px-8 sm:py-7">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
              <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-brand-green-600/25 blur-3xl animate-blob" />
              <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-brand-teal-600/25 blur-3xl animate-blob-slow" />

              <div className="relative flex flex-wrap items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold shadow-lg ring-2 ring-white/20 sm:h-14 sm:w-14 sm:text-xl"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #0d9488)' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-400">Welcome back</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-bold sm:text-2xl">{displayName}</h1>
                    {isPro ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-green-600 to-brand-teal-600 px-2.5 py-1 text-[11px] font-bold shadow-sm">
                        <Sparkles className="h-3 w-3" /> Pro
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-gray-300">
                        Free plan
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-gray-400">{user?.email}</p>
                </div>
                {!isPro && (
                  <Link
                    to="/pricing"
                    className="btn-shine hidden items-center gap-2 rounded-xl bg-gradient-to-r from-brand-green-600 to-brand-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-green-900/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:inline-flex"
                  >
                    <Zap className="h-3.5 w-3.5" /> Upgrade to Pro
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tab layout */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="hidden md:flex flex-col gap-3 w-56 shrink-0 md:sticky md:top-20 md:self-start"
            >
              <nav className="rounded-2xl bg-white border border-gray-100 shadow-sm p-2">
                <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Workspace</p>
                <button
                  onClick={() => switchTab('dashboard')}
                  className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-brand-green-50 to-brand-teal-50 text-brand-green-800 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      activeTab === 'dashboard' ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    }`}
                    style={activeTab === 'dashboard' ? { background: 'linear-gradient(135deg, #166534, #0d9488)' } : undefined}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </span>
                  Dashboard
                </button>
                <button
                  onClick={() => switchTab('profile')}
                  className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-brand-green-50 to-brand-teal-50 text-brand-green-800 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      activeTab === 'profile' ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    }`}
                    style={activeTab === 'profile' ? { background: 'linear-gradient(135deg, #166534, #0d9488)' } : undefined}
                  >
                    <User className="w-3.5 h-3.5" />
                  </span>
                  Profile &amp; Billing
                </button>
                <Link
                  to="/pricing"
                  className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-200"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-gray-200">
                    <BadgeCheck className="w-3.5 h-3.5" />
                  </span>
                  Plans &amp; Pricing
                </Link>
                <div className="my-1.5 border-t border-gray-100" />
                <button
                  onClick={handleSignOut}
                  className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors group-hover:bg-red-100">
                    <LogOut className="w-3.5 h-3.5" />
                  </span>
                  Sign Out
                </button>
              </nav>

              {/* Trust card */}
              <div className="relative overflow-hidden rounded-2xl border border-brand-green-100 bg-gradient-to-br from-brand-green-50 to-brand-teal-50 p-4">
                <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-brand-green-200/50 blur-2xl" />
                <div className="relative">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #166534, #0d9488)' }}>
                      <Shield className="w-3.5 h-3.5" />
                    </span>
                    <p className="text-xs font-bold text-brand-green-800">Your data is safe</p>
                  </div>
                  <p className="text-xs leading-relaxed text-brand-green-700">Files are encrypted in transit and deleted within 24 hours.</p>
                </div>
              </div>
            </motion.aside>

            {/* Mobile tab bar */}
            <div className="md:hidden grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => switchTab('dashboard')}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'border-brand-green-200 bg-gradient-to-r from-brand-green-50 to-brand-teal-50 text-brand-green-800 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => switchTab('profile')}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'border-brand-green-200 bg-gradient-to-r from-brand-green-50 to-brand-teal-50 text-brand-green-800 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <User className="w-4 h-4" /> Profile
              </button>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">

              {/* ── DASHBOARD TAB ────────────────────────────────────── */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <UsageStats />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
                    <div className="mb-5 flex items-center gap-3 sm:mb-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #166534, #0d9488)' }}>
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">Convert a PDF</h2>
                        <p className="text-sm text-gray-500">Upload a PDF file to convert it to Excel</p>
                      </div>
                    </div>
                    <UploadBox />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
                    <div className="mb-5 flex items-center gap-3 sm:mb-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0e7490, #0d9488)' }}>
                        <History className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">Conversion History</h2>
                        <p className="text-sm text-gray-500">Your recent files — downloads stay live for 24 hours</p>
                      </div>
                    </div>
                    <ConversionHistory />
                  </motion.div>
                </div>
              )}

              {/* ── PROFILE TAB ──────────────────────────────────────── */}
              {activeTab === 'profile' && (
                <div className="space-y-6">

                  {/* Plan card */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="h-1 bg-gradient-to-r from-brand-green-600 via-brand-teal-600 to-brand-amber-500" />
                    <div className="border-b border-gray-100 p-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Current Plan</p>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${isPro ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                          style={isPro ? { background: 'linear-gradient(135deg, #166534, #0d9488)' } : undefined}
                        >
                          {isPro ? <Zap className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {isPro ? planLabel(planProfile?.planId ?? null) : 'Free'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 p-5 text-sm text-gray-600">
                      {isPro && renewalDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{isCancelled ? 'Access until' : 'Renews on'}: <strong>{renewalDate}</strong></span>
                        </div>
                      )}
                      {isPro && planProfile?.subscriptionId && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="truncate text-xs text-gray-400">{planProfile.subscriptionId}</span>
                        </div>
                      )}
                      {isPro && isCancelled && (
                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                          Subscription cancelled — your Pro access continues until {renewalDate}.
                        </div>
                      )}
                      {!isPro && (
                        <p className="text-xs text-gray-500">Upgrade to unlock unlimited conversions and priority support.</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 p-5 pt-0 sm:flex-row">
                      {!isPro && (
                        <Link
                          to="/pricing"
                          className="btn-shine flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-green-700 to-brand-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-green-700/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                        >
                          <Zap className="w-4 h-4" /> Upgrade to Pro
                        </Link>
                      )}
                      {isPro && !isCancelled && planProfile?.subscriptionId && (
                        <button
                          onClick={() => setShowCancelConfirm(true)}
                          className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Cancel Subscription
                        </button>
                      )}
                      {isPro && !planProfile?.subscriptionId && (
                        <Link
                          to="/pricing"
                          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" /> Renew Plan
                        </Link>
                      )}
                    </div>
                  </motion.div>

                  {/* Billing history */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0e7490, #0d9488)' }}>
                          <CreditCard className="w-4 h-4" />
                        </span>
                        <h2 className="text-base font-bold text-gray-900">Billing History</h2>
                      </div>
                      <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                        {payments.length} invoice{payments.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {loadingPayments ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-brand-green-600 animate-spin" />
                      </div>
                    ) : payments.length === 0 ? (
                      <div className="px-6 py-16 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                          <CreditCard className="h-6 w-6 text-gray-300" />
                        </div>
                        <h3 className="mb-1 text-sm font-semibold text-gray-900">No payments yet</h3>
                        <p className="mb-4 text-xs text-gray-500">Your billing history will appear here after your first payment.</p>
                        <Link to="/pricing" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green-700 hover:underline">
                          <Zap className="w-3.5 h-3.5" /> Upgrade to Pro
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {payments.map((p, i) => (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-gray-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green-50 to-brand-teal-50 ring-1 ring-brand-green-100">
                                <FileText className="w-4 h-4 text-brand-green-700" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">{planLabel(p.plan_id)}</p>
                                <p className="text-xs text-gray-400">{formatDate(p.created_at)} · {p.payment_type === 'subscription' ? 'Subscription' : 'One-time'}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:shrink-0">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(p.display_amount, p.amount, p.currency)}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-green-100 bg-brand-green-50 px-2.5 py-0.5 text-xs font-semibold text-brand-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-green-600" />
                                Paid
                              </span>
                              <button
                                onClick={() => printInvoice(p, displayName, user?.email ?? '')}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Invoice
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Mobile: sign out */}
                  <div className="md:hidden">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Cancel subscription?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Your subscription will be cancelled at the end of the current billing period. You'll keep Pro access until{' '}
              <strong>{renewalDate ?? 'the end of the period'}</strong>.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Yes, cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default DashboardPage
