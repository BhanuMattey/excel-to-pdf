import { motion } from 'framer-motion'
import { Navbar, Footer } from '../components/layout'

const TermsPage = () => {
  const lastUpdated = 'January 1, 2026'

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing or using ExcelfromPDF ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.

These Terms apply to all users, including visitors, registered users, and paying customers.`,
    },
    {
      title: '2. Description of Service',
      content: `ExcelfromPDF provides an AI-powered platform for converting PDF documents to Excel spreadsheets. The Service includes:

• Web-based file upload and conversion
• API access for programmatic conversion (Pro and Team plans)
• Cloud storage for conversion history
• Support and documentation`,
    },
    {
      title: '3. User Accounts',
      content: `To access certain features, you must create an account. You agree to:

• Provide accurate and complete information
• Maintain the security of your password
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized use

We reserve the right to suspend or terminate accounts that violate these Terms.`,
    },
    {
      title: '4. Acceptable Use',
      content: `You agree not to use the Service to:

• Upload malicious files or malware
• Violate any applicable laws or regulations
• Infringe on intellectual property rights
• Attempt to gain unauthorized access to our systems
• Overload or disrupt the Service
• Use the Service for illegal activities`,
    },
    {
      title: '5. Subscription & Payments',
      content: `Paid plans are billed monthly or annually in advance. By subscribing, you authorize us to charge your payment method.

• Prices are subject to change with 30 days notice
• Refunds are available within 30 days of purchase
• Cancellations take effect at the end of the billing period
• We use Stripe for secure payment processing`,
    },
    {
      title: '6. Intellectual Property',
      content: `The Service and its original content, features, and functionality are owned by ExcelfromPDF and are protected by international copyright, trademark, and other intellectual property laws.

You retain all rights to the files you upload and the converted outputs.`,
    },
    {
      title: '7. Privacy & Data',
      content: `Your use of the Service is also governed by our Privacy Policy. Key points:

• Uploaded files are encrypted and automatically deleted after 1 hour
• We do not access or view your file contents
• Account data is stored securely and can be deleted on request`,
    },
    {
      title: '8. Limitation of Liability',
      content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.

Our total liability shall not exceed the amount you paid us in the past 12 months.`,
    },
    {
      title: '9. Changes to Terms',
      content: `We may modify these Terms at any time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance of the new Terms.`,
    },
    {
      title: '10. Contact',
      content: `For questions about these Terms, contact us at:

Email: legal@excelfromspdf.com
Address: 123 Tech Street, San Francisco, CA 94105`,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

            <p className="text-lg text-gray-600 mb-8">
              Please read these Terms of Service carefully before using ExcelfromPDF. 
              These terms govern your access to and use of our service.
            </p>

            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.section
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    {section.title}
                  </h2>
                  <div className="text-gray-600 whitespace-pre-line">
                    {section.content}
                  </div>
                </motion.section>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TermsPage
