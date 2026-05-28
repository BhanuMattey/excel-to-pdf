import { motion } from 'framer-motion'
import { Sparkles, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Extraction',
    description:
      'Our advanced AI recognizes table structures, merged cells, and headers, ensuring your data is perfectly formatted.',
    color: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description:
      'Your files are processed securely using 256-bit SSL encryption and automatically deleted after 1 hour.',
    color: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Convert hundreds of pages in seconds. No software installation required, works directly in your browser.',
    color: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
]

const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card hover:shadow-lg transition-shadow duration-300"
            >
              <div
                className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}
              >
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
