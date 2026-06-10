import { ArrowRight, BadgeCheck, CheckCircle2, FileSpreadsheet, FileText, LockKeyhole, Sparkles, Table2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import LazyUploadBox from '../upload/LazyUploadBox'

const steps = [
  { label: 'Upload PDF', icon: FileText, gradient: 'linear-gradient(135deg, #166534, #16a34a)' },
  { label: 'Convert tables', icon: BadgeCheck, gradient: 'linear-gradient(135deg, #0e7490, #0d9488)' },
  { label: 'Download Excel', icon: FileSpreadsheet, gradient: 'linear-gradient(135deg, #16a34a, #0d9488)' },
]

const Hero = () => {
  return (
    <section id="convert" className="relative overflow-hidden bg-white pt-20 pb-14 sm:pb-16 lg:min-h-screen">
      {/* Layered backdrop: grid, radial tint, aurora blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#eef2f7_1px,transparent_1px),linear-gradient(to_bottom,#eef2f7_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(34,197,94,0.08),transparent_70%)]" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-green-200/40 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-teal-200/40 blur-3xl animate-blob-slow" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-amber-100/50 blur-3xl animate-blob" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12 lg:pt-20 lg:items-center">
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-green-100 bg-gradient-to-r from-brand-green-50 to-brand-teal-50 shadow-sm text-gray-700 text-xs font-semibold mb-7">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green-600" />
              </span>
              Fast PDF table conversion
              <Sparkles className="w-3.5 h-3.5 text-brand-amber-500" />
            </div>

            {/* No entrance animation here: this is the LCP element and must paint immediately */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-950 tracking-tight leading-[1.05] mb-6">
              Turn messy PDFs into{' '}
              <span className="gradient-text">clean Excel sheets.</span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-gray-500 leading-7 sm:leading-8 mb-8">
              Upload scanned or digital PDFs and extract tables into editable spreadsheets in seconds.
              Built for invoices, reports, bank statements, and operational data.
            </p>

            <div className="animate-fade-up anim-delay-300 flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
              <Link
                to="/signup"
                className="btn-shine group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-green-700 to-brand-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-green-700/25 transition-all duration-300 hover:shadow-xl hover:shadow-brand-green-700/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:ring-offset-2"
              >
                Get started free
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                View pricing
              </Link>
            </div>

            <div className="animate-fade-up anim-delay-400 grid sm:grid-cols-3 gap-3 max-w-2xl">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.label}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-green-200 hover:shadow-md"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{ background: step.gradient }}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      <span className="mr-1.5 text-xs font-semibold text-gray-300">0{index + 1}</span>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="animate-fade-up anim-delay-300 relative">
            {/* Gradient glow frame */}
            <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-brand-green-200/60 via-brand-teal-200/50 to-brand-amber-100/60 blur-md sm:-inset-4 sm:rounded-[2rem]" />
            <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-brand-green-100 via-white to-brand-teal-100 sm:-inset-4 sm:rounded-[2rem]" />

            {/* Floating accents */}
            <div className="pointer-events-none absolute -left-12 top-10 z-10 hidden items-center gap-2 rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-lg backdrop-blur animate-float xl:flex">
              <Table2 className="h-3.5 w-3.5 text-brand-teal-700" />
              Tables detected
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-green-600" />
            </div>
            <div className="pointer-events-none absolute -right-10 -bottom-5 z-10 hidden items-center gap-2 rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-lg backdrop-blur animate-float [animation-delay:2s] xl:flex">
              <FileSpreadsheet className="h-3.5 w-3.5 text-brand-green-700" />
              report.xlsx ready
            </div>

            {/* App-window framed upload card */}
            <div className="relative rounded-[1.25rem] border border-gray-200 bg-white shadow-2xl shadow-gray-950/10 sm:rounded-[1.5rem]">
              <div className="flex items-center gap-2 rounded-t-[1.25rem] border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 sm:rounded-t-[1.5rem]">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                <span className="ml-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 shadow-sm">
                  <FileSpreadsheet className="h-3 w-3 text-brand-green-700" />
                  excelfrompdf — convert
                </span>
              </div>
              <div className="p-3 sm:p-4">
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
      </div>
    </section>
  )
}

export default Hero
