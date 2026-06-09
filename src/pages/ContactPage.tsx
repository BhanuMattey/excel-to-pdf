import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, Loader2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navbar, Footer } from '../components/layout'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'

const SUPPORT_EMAIL = 'support@excelfrompdf.com'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json().catch(() => ({} as { error?: string }))

      if (!response.ok) throw new Error(data.error || 'Failed to send message')

      toast.success('Message sent. We will address your query within 12 hours or at the earliest.')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email support',
      content: SUPPORT_EMAIL,
      description: 'We respond within 12 hours or earlier',
    },
  ]

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-brand-green-700 focus:ring-2 focus:ring-brand-green-700/10'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title="Contact Us — ExcelFromPDF"
        description="Get help with PDF to Excel conversion. Reach the ExcelFromPDF support team for questions, feedback, or technical issues."
        canonical="/contact"
      />
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        {/* Hero */}
        <div className="border-b border-gray-100 bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Support</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-950 tracking-tight mb-4">Get in touch</h1>
              <p className="text-base leading-7 text-gray-600 max-w-2xl">
                Have a question, need technical help, or want to talk about a Team plan? Send us a message and we'll address
                your query within 12 hours or at the earliest.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {contactInfo.map((info) => {
                const Icon = info.icon
                return (
                  <div key={info.title} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: 'linear-gradient(to bottom right, #166534, #0d9488)' }}>
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-950">{info.title}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{info.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{info.description}</p>
                    </div>
                  </div>
                )
              })}

              {/* FAQ CTA */}
              <div className="rounded-2xl border border-gray-100 bg-gray-950 p-5 text-white">
                <p className="text-sm font-semibold mb-1">Common questions</p>
                <p className="text-sm text-gray-400 mb-4">
                  Find quick answers in our FAQ before reaching out.
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gray-300 transition-colors"
                >
                  View FAQ <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Topic
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="enterprise">Enterprise / Team Sales</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className={`${inputClass} resize-none`}
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-green-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-800 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send message
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContactPage
