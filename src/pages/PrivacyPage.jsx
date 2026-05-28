import { motion } from 'framer-motion'
import { Navbar, Footer } from '../components/layout'

const PrivacyPage = () => {
  const lastUpdated = 'January 1, 2026'

  const sections = [
    {
      title: 'Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, upload files, or contact us for support. This includes:
      
• Account information (email address, name, password)
• Files you upload for conversion
• Usage data and conversion history
• Payment information (processed securely by Stripe)
• Communications with our support team`,
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process your file conversions
• Send you technical notices and support messages
• Respond to your comments and questions
• Monitor and analyze trends and usage
• Detect and prevent fraudulent activity`,
    },
    {
      title: 'File Security & Deletion',
      content: `Your uploaded files are encrypted using 256-bit SSL during transfer and at rest. We take the security of your data seriously:

• Files are automatically deleted 1 hour after processing
• We never access or view your file contents
• Files are processed in isolated, secure environments
• No data is shared with third parties for advertising`,
    },
    {
      title: 'Data Retention',
      content: `We retain your account information for as long as your account is active. Conversion history and metadata are retained for 90 days. You can request deletion of your account and all associated data at any time by contacting support.`,
    },
    {
      title: 'Cookies & Tracking',
      content: `We use cookies and similar technologies to:

• Keep you logged in
• Remember your preferences
• Understand how you use our service
• Improve our product

You can control cookies through your browser settings.`,
    },
    {
      title: 'Third-Party Services',
      content: `We use trusted third-party services to operate our platform:

• Supabase for authentication and database
• Stripe for payment processing
• Analytics tools for usage insights

These services have their own privacy policies and are GDPR compliant.`,
    },
    {
      title: 'Your Rights',
      content: `You have the right to:

• Access your personal data
• Correct inaccurate data
• Delete your account and data
• Export your data
• Opt out of marketing communications

Contact us at privacy@excelfromspdf.com to exercise these rights.`,
    },
    {
      title: 'Contact Us',
      content: `If you have questions about this Privacy Policy, please contact us at:

Email: privacy@excelfromspdf.com
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

            <p className="text-lg text-gray-600 mb-8">
              At ExcelfromPDF, we take your privacy seriously. This policy describes how we 
              collect, use, and protect your personal information when you use our service.
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

export default PrivacyPage
