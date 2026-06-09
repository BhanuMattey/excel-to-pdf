import React from 'react'
import { ShieldCheck, Clock, FileSpreadsheet, Unlock } from 'lucide-react'

const trustPoints = [
  {
    icon: ShieldCheck,
    title: '256-bit SSL encryption',
    description: 'All files transferred and stored with bank-level security.',
    iconStyle: { background: 'linear-gradient(to bottom right, #166534, #0d9488)' } as React.CSSProperties,
  },
  {
    icon: Clock,
    title: 'Auto-deleted in 24 h',
    description: 'Uploaded files are permanently removed within 24 hours.',
    iconStyle: { background: 'linear-gradient(to bottom right, #0e7490, #0d9488)' } as React.CSSProperties,
  },
  {
    icon: Unlock,
    title: 'No sign-up required to try',
    description: 'Upload a PDF and get your Excel file — no account needed.',
    iconStyle: { background: 'linear-gradient(to bottom right, #16a34a, #166534)' } as React.CSSProperties,
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel-ready output',
    description: 'Tables, headers, and merged cells exported cleanly every time.',
    iconStyle: { background: 'linear-gradient(to bottom right, #166534, #0e7490)' } as React.CSSProperties,
  },
]

const TrustedBy = () => {
  return (
    <section className="py-20 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Why teams use ExcelfromPDF
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
            Built for documents that matter.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustPoints.map((point) => {
            const Icon = point.icon
            return (
              <div
                key={point.title}
                className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm" style={point.iconStyle}>
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-950 mb-1">{point.title}</p>
                  <p className="text-sm leading-6 text-gray-500">{point.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TrustedBy
