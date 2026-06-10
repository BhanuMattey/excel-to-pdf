import React from 'react'
import { ArrowRight, Clock, FileSpreadsheet, ShieldCheck, Unlock } from 'lucide-react'
import { Link } from 'react-router-dom'

const trustPoints = [
  {
    icon: ShieldCheck,
    title: '256-bit SSL encryption',
    description: 'All files transferred and stored with bank-level security.',
    iconStyle: { background: 'linear-gradient(135deg, #166534, #0d9488)' } as React.CSSProperties,
  },
  {
    icon: Clock,
    title: 'Auto-deleted in 24 h',
    description: 'Uploaded files are permanently removed within 24 hours.',
    iconStyle: { background: 'linear-gradient(135deg, #0e7490, #0d9488)' } as React.CSSProperties,
  },
  {
    icon: Unlock,
    title: 'No sign-up required to try',
    description: 'Upload a PDF and get your Excel file — no account needed.',
    iconStyle: { background: 'linear-gradient(135deg, #16a34a, #166534)' } as React.CSSProperties,
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel-ready output',
    description: 'Tables, headers, and merged cells exported cleanly every time.',
    iconStyle: { background: 'linear-gradient(135deg, #166534, #0e7490)' } as React.CSSProperties,
  },
]

const TrustedBy = () => {
  return (
    <section className="py-20 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="inline-flex items-center rounded-full border border-brand-green-100 bg-white px-3 py-1 text-xs font-semibold text-brand-green-700 uppercase tracking-widest mb-4 shadow-sm">
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
                className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-950/5"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                  style={point.iconStyle}
                >
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

        {/* Final CTA band */}
        <div className="relative mt-16 overflow-hidden rounded-3xl bg-gray-950 px-6 py-16 text-center sm:px-12">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
          <div className="pointer-events-none absolute -top-28 left-1/4 h-72 w-72 rounded-full bg-brand-green-600/30 blur-3xl animate-blob" />
          <div className="pointer-events-none absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-brand-teal-600/30 blur-3xl animate-blob-slow" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Ready to free your data from PDFs?
            </h2>
            <p className="mx-auto max-w-xl text-base text-gray-400 mb-9">
              Convert your first PDF in seconds — no account needed to try, no credit card, nothing
              to install.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#convert"
                className="btn-shine group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-950 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-950"
              >
                Convert a PDF now
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors duration-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-950"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrustedBy
