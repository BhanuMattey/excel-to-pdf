import React from 'react'
import { FileSpreadsheet, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: FileSpreadsheet,
    title: 'Structured Table Conversion',
    description: 'Preserves table structures, merged cells, and headers so your data lands in a usable spreadsheet.',
    iconStyle: { background: 'linear-gradient(to bottom right, #166534, #0d9488)' } as React.CSSProperties,
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Files are protected during processing and are not stored for more than 24 hours.',
    iconStyle: { background: 'linear-gradient(to bottom right, #0e7490, #0d9488)' } as React.CSSProperties,
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Hundreds of pages in seconds. Runs entirely in the cloud with no downloads and no waiting.',
    iconStyle: { background: 'linear-gradient(to bottom right, #d97706, #f59e0b)' } as React.CSSProperties,
  },
]

const Features = () => {
  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">WHY EXCELFROM PDF</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight">
            Built for precision, speed, and trust
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm" style={feature.iconStyle}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
