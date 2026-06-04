import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  Calendar,
  CreditCard,
  Download,
  FileText,
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
    <div class="brand">ExcelfromPDF<span>support@excelfrom.pdf</span></div>
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

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg shrink-0"
                style={{ background: 'linear-gradient(135deg, #166534, #0e7490)' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">Welcome, {displayName}</h1>
                <p className="truncate text-sm text-gray-500">{user?.email}</p>
              </div>
              {isPro && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white sm:ml-auto"
                  style={{ background: 'linear-gradient(to right, #166534, #0e7490)' }}
                >
                  <Sparkles className="w-3 h-3" /> Pro
                </span>
              )}
            </div>
          </motion.div>

          {/* Tab layout */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="hidden md:flex flex-col gap-2 w-52 shrink-0"
            >
              <nav className="rounded-2xl bg-white border border-gray-100 shadow-sm p-2">
                <button
                  onClick={() => switchTab('dashboard')}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-green-50 text-green-800'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  Dashboard
                </button>
                <button
                  onClick={() => switchTab('profile')}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-green-50 text-green-800'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  Profile &amp; Billing
                </button>
                <Link
                  to="/pricing"
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <BadgeCheck className="w-4 h-4 shrink-0" />
                  Plans &amp; Pricing
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sign Out
                </button>
              </nav>

              {/* Trust card */}
              <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="w-4 h-4 text-green-700" />
                  <p className="text-xs font-bold text-green-800">Your data is safe</p>
                </div>
                <p className="text-xs text-green-700 leading-relaxed">Files are encrypted in transit and deleted within 24 hours.</p>
              </div>
            </motion.aside>

            {/* Mobile tab bar */}
            <div className="md:hidden grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => switchTab('dashboard')}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => switchTab('profile')}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-green-50 border-green-200 text-green-800'
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

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-3 sm:mb-6">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <Upload className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">Convert a PDF</h2>
                        <p className="text-sm text-gray-500">Upload a PDF file to convert it to Excel</p>
                      </div>
                    </div>
                    <UploadBox />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Conversion History</h2>
                    <ConversionHistory />
                  </motion.div>
                </div>
              )}

              {/* ── PROFILE TAB ──────────────────────────────────────── */}
              {activeTab === 'profile' && (
                <div className="space-y-6">

                  {/* Plan card */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Current Plan</p>
                      <div className="flex items-center gap-2">
                        {isPro
                          ? <Zap className="w-5 h-5 text-green-700" />
                          : <User className="w-5 h-5 text-gray-400" />}
                        <span className="text-lg font-bold text-gray-900">
                          {isPro ? planLabel(planProfile?.planId ?? null) : 'Free'}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3 text-sm text-gray-600">
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
                    <div className="p-5 pt-0 flex flex-col gap-2 sm:flex-row">
                      {!isPro && (
                        <Link
                          to="/pricing"
                          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors"
                          style={{ background: 'linear-gradient(to right, #166534, #0e7490)' }}
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
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between gap-3 sm:px-6">
                      <h2 className="text-base font-bold text-gray-900">Billing History</h2>
                      <span className="text-xs text-gray-400">{payments.length} invoice{payments.length !== 1 ? 's' : ''}</span>
                    </div>

                    {loadingPayments ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                      </div>
                    ) : payments.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">No payments yet</h3>
                        <p className="text-xs text-gray-500 mb-4">Your billing history will appear here after your first payment.</p>
                        <Link to="/pricing" className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 hover:underline">
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
                            className="flex flex-col gap-3 px-4 py-4 hover:bg-gray-50 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50">
                                <FileText className="w-4 h-4 text-green-700" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{planLabel(p.plan_id)}</p>
                                <p className="text-xs text-gray-400">{formatDate(p.created_at)} · {p.payment_type === 'subscription' ? 'Subscription' : 'One-time'}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:shrink-0">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(p.display_amount, p.amount, p.currency)}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-green-50 border border-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                Paid
                              </span>
                              <button
                                onClick={() => printInvoice(p, displayName, user?.email ?? '')}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
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
