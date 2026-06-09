import { ArrowRight, BadgeCheck, CheckCircle2, FileSpreadsheet, FileText, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import LazyUploadBox from '../upload/LazyUploadBox'

const steps = [
  { label: 'Upload PDF', icon: FileText },
  { label: 'Convert tables', icon: BadgeCheck },
  { label: 'Download Excel', icon: FileSpreadsheet },
]

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-14 sm:pb-16 lg:min-h-screen">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#eef2f7_1px,transparent_1px),linear-gradient(to_bottom,#eef2f7_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12 lg:pt-20 lg:items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 text-xs font-semibold mb-7"
            >
              <BadgeCheck className="w-3.5 h-3.5 text-brand-green-700" />
              Fast PDF table conversion
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-950 tracking-tight leading-[1.05] mb-6"
            >
              Turn messy PDFs into clean Excel sheets.
            </h1>

            <p
              className="max-w-2xl text-base sm:text-lg text-gray-500 leading-7 sm:leading-8 mb-8"
            >
              Upload scanned or digital PDFs and extract tables into editable spreadsheets in seconds.
              Built for invoices, reports, bank statements, and operational data.
            </p>

            <div
              className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10"
            >
              <Link to="/signup" className="btn-primary gap-2">
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                View pricing
              </Link>
            </div>

            <div
              className="grid sm:grid-cols-3 gap-3 max-w-2xl"
            >
              {steps.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white/80 px-4 py-3 shadow-sm">
                    <Icon className="w-4 h-4 text-brand-teal-700" />
                    <span className="text-sm font-medium text-gray-700">{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="relative"
          >
            <div className="absolute -inset-3 rounded-[1.75rem] bg-gray-100 sm:-inset-4 sm:rounded-[2rem]" />
            <div className="relative rounded-[1.25rem] border border-gray-200 bg-white p-3 shadow-2xl shadow-gray-950/10 sm:rounded-[1.5rem] sm:p-4">
              <LazyUploadBox />
              <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-gray-500 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <LockKeyhole className="w-3.5 h-3.5 text-gray-400" />
                  Files removed within 24 hours
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-600" />
                  No install needed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
