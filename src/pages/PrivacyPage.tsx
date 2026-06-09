import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Eye, Trash2, Database, Cookie, Link2, UserCheck, Mail } from 'lucide-react'
import { Navbar, Footer } from '../components/layout'
import SEO from '../components/SEO'

const sections = [
  {
    id: 'information',
    icon: Eye,
    title: 'Information We Collect',
    content: [
      'We collect information you provide directly to us, such as when you create an account, upload files, or contact us for support.',
      'Account information: email address, name, and hashed password.',
      'Files you upload for conversion — processed in memory and never stored longer than 24 hours.',
      'Usage data and conversion history for your dashboard.',
      'Payment information processed securely by Razorpay — we never store card details.',
      'Communications with our support team.',
    ],
  },
  {
    id: 'usage',
    icon: Database,
    title: 'How We Use Your Information',
    content: [
      'Provide, maintain, and improve our conversion services.',
      'Process your file conversions accurately and return the output.',
      'Send you technical notices and support messages.',
      'Respond to your comments and questions.',
      'Monitor and analyze trends to improve reliability.',
      'Detect and prevent fraudulent or abusive activity.',
    ],
  },
  {
    id: 'security',
    icon: ShieldCheck,
    title: 'File Security & Deletion',
    content: [
      'All uploaded files are encrypted using 256-bit SSL during transfer and at rest.',
      'Uploaded and processed files are permanently deleted within 24 hours.',
      'We never access or view the contents of your documents.',
      'Files are processed in isolated, ephemeral environments.',
      'No document data is ever shared with third parties for advertising.',
    ],
  },
  {
    id: 'retention',
    icon: Trash2,
    title: 'Data Retention',
    content: [
      'Account information is retained for as long as your account is active.',
      'Conversion history and metadata are retained for 90 days.',
      'You can request deletion of your account and all associated data at any time by contacting support.',
    ],
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: 'Cookies & Tracking',
    content: [
      'We use cookies and similar technologies to keep you logged in and remember your preferences.',
      'Analytics cookies help us understand how people use the service so we can improve it.',
      'We do not use cookies for cross-site advertising or tracking.',
      'You can control cookies through your browser settings at any time.',
    ],
  },
  {
    id: 'third-party',
    icon: Link2,
    title: 'Third-Party Services',
    content: [
      'Neon / Postgres for secure database storage.',
      'Neon Auth for authentication and session management.',
      'Razorpay for payment processing — we never store card details.',
      'Analytics tools for aggregate usage insights — no personally identifiable data exported.',
      'All third-party services operate under their own privacy policies and applicable data protection laws.',
    ],
  },
  {
    id: 'rights',
    icon: UserCheck,
    title: 'Your Rights',
    content: [
      'Access: request a copy of the personal data we hold about you.',
      'Correct: update any inaccurate information in your account.',
      'Delete: request removal of your account and all associated data.',
      'Export: receive your data in a portable format.',
      'Opt out: unsubscribe from marketing communications at any time.',
      'Contact us at privacy@excelfrompdf.com to exercise any of these rights.',
    ],
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Contact Us',
    content: [
      'If you have questions about this Privacy Policy or our data practices, reach out to us.',
      'Email: support@excelfrompdf.com',
      'We aim to respond to all privacy requests within 5 business days.',
    ],
  },
]

const PrivacyPage = () => {
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
        title="Privacy Policy — ExcelFromPDF"
        description="How ExcelFromPDF handles your uploaded files and personal data. Files are permanently deleted within 24 hours."
        canonical="/privacy"
      />
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        {/* Hero */}
        <div className="border-b border-gray-100 bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Legal</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-950 tracking-tight mb-4">Privacy Policy</h1>
              <p className="text-gray-500 text-sm">Last updated: January 1, 2026</p>
              <p className="mt-4 text-base leading-7 text-gray-600 max-w-2xl">
                At ExcelfromPDF, we take your privacy seriously. This policy describes how we collect, use, and protect your
                personal information when you use our service.
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

export default PrivacyPage
