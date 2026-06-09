import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, UserCog, Ban, CreditCard, Copyright, Lock, AlertTriangle, RefreshCw, Mail, CheckCircle } from 'lucide-react'
import { Navbar, Footer } from '../components/layout'
import SEO from '../components/SEO'

const sections = [
  {
    id: 'acceptance',
    icon: CheckCircle,
    title: 'Acceptance of Terms',
    content: [
      'By accessing or using ExcelfromPDF ("Service"), you agree to be bound by these Terms of Service ("Terms").',
      'If you do not agree to these Terms, do not use the Service.',
      'These Terms apply to all users, including visitors, registered users, and paying customers.',
    ],
  },
  {
    id: 'service',
    icon: FileText,
    title: 'Description of Service',
    content: [
      'ExcelfromPDF provides a platform for converting PDF documents to Excel spreadsheets.',
      'Web-based file upload and conversion with structured table extraction.',
      'API access for programmatic conversion (Pro and Team plans).',
      'Cloud storage for conversion history and audit trail.',
      'Support and documentation for all plan tiers.',
    ],
  },
  {
    id: 'accounts',
    icon: UserCog,
    title: 'User Accounts',
    content: [
      'To access certain features, you must create an account.',
      'You agree to provide accurate and complete information when registering.',
      'You are responsible for maintaining the security of your password.',
      'You accept responsibility for all activities that occur under your account.',
      'Notify us immediately of any unauthorized use of your account.',
      'We reserve the right to suspend or terminate accounts that violate these Terms.',
    ],
  },
  {
    id: 'acceptable-use',
    icon: Ban,
    title: 'Acceptable Use',
    content: [
      'You agree not to upload malicious files, malware, or harmful content.',
      'You agree not to violate any applicable laws or regulations.',
      'You agree not to infringe on intellectual property rights of third parties.',
      'You agree not to attempt to gain unauthorized access to our systems.',
      'You agree not to overload or disrupt the Service through automated abuse.',
      'You agree not to use the Service for any illegal activities.',
    ],
  },
  {
    id: 'payments',
    icon: CreditCard,
    title: 'Subscription & Payments',
    content: [
      'Paid plans are billed monthly or annually in advance.',
      'By subscribing, you authorize us to charge your payment method on each billing date.',
      'Prices are subject to change with 30 days notice to existing subscribers.',
      'Refunds are available within 30 days of purchase if you are not satisfied.',
      'Cancellations take effect at the end of the current billing period.',
      'We use Razorpay for secure payment processing — we never store card details.',
    ],
  },
  {
    id: 'ip',
    icon: Copyright,
    title: 'Intellectual Property',
    content: [
      'The Service and its original content, features, and functionality are owned by ExcelfromPDF.',
      'Our platform is protected by international copyright, trademark, and intellectual property laws.',
      'You retain full rights to all files you upload and all converted outputs you download.',
      'You grant us no license to your content beyond what is necessary to provide the Service.',
    ],
  },
  {
    id: 'privacy',
    icon: Lock,
    title: 'Privacy & Data',
    content: [
      'Your use of the Service is governed by our Privacy Policy.',
      'Uploaded and processed files are permanently deleted within 24 hours.',
      'We do not access or view the contents of your documents.',
      'Account data is stored securely and can be deleted on request at any time.',
    ],
  },
  {
    id: 'liability',
    icon: AlertTriangle,
    title: 'Limitation of Liability',
    content: [
      'The Service is provided "as is" without warranties of any kind, express or implied.',
      'We do not guarantee that the Service will be uninterrupted or error-free.',
      'We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.',
      'Our total liability shall not exceed the amount you paid us in the past 12 months.',
    ],
  },
  {
    id: 'changes',
    icon: RefreshCw,
    title: 'Changes to Terms',
    content: [
      'We may modify these Terms at any time to reflect changes in our services or legal requirements.',
      'We will notify users of material changes via email or through a notice in the Service.',
      'Continued use of the Service after changes constitutes acceptance of the updated Terms.',
      'You may terminate your account at any time if you do not agree with the updated Terms.',
    ],
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Contact',
    content: [
      'For questions about these Terms, contact us at support@excelfrompdf.com.',
      'We aim to respond to all legal inquiries within 5 business days.',
    ],
  },
]

const TermsPage = () => {
  const [active, setActive] = useState(sections[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title="Terms of Service — ExcelFromPDF"
        description="Terms and conditions for using ExcelFromPDF's PDF to Excel conversion service."
        canonical="/terms"
      />
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        {/* Hero */}
        <div className="border-b border-gray-100 bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Legal</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-950 tracking-tight mb-4">Terms of Service</h1>
              <p className="text-gray-500 text-sm">Last updated: January 1, 2026</p>
              <p className="mt-4 text-base leading-7 text-gray-600 max-w-2xl">
                Please read these Terms carefully before using ExcelfromPDF. These terms govern your access to and use of our
                service and form a binding agreement between you and ExcelfromPDF.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">
            {/* Sticky TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={() => setActive(s.id)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active === s.id
                        ? 'bg-brand-green-700 text-white'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </aside>

            {/* Sections */}
            <div className="space-y-10">
              {sections.map((section, index) => {
                const Icon = section.icon
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm scroll-mt-28"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
                        <Icon className="h-4 w-4 text-gray-800" />
                      </span>
                      <h2 className="text-lg font-semibold text-gray-950">{section.title}</h2>
                    </div>
                    <ul className="space-y-2.5">
                      {section.content.map((line) => (
                        <li key={line} className="flex items-start gap-2.5 text-sm leading-6 text-gray-600">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </motion.section>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TermsPage
