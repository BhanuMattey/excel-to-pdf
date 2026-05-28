import { motion } from 'framer-motion'

const companies = [
  { name: 'Acme Corp', style: 'font-bold' },
  { name: 'Globex', style: 'italic font-serif' },
  { name: 'Soylent', style: 'font-medium' },
  { name: 'Initech', style: 'font-semibold' },
  { name: 'Umbrella', style: 'font-bold flex items-center gap-1' },
]

const TrustedBy = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-8">
            Trusted by 10,000+ professionals
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {companies.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`text-gray-400 text-lg ${company.style}`}
              >
                {company.name === 'Umbrella' && (
                  <span className="w-4 h-4 bg-gray-400 rounded-full inline-block mr-1" />
                )}
                {company.name}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TrustedBy
