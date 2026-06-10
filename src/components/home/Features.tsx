import { ArrowRight, FileText, Layers, MonitorSmartphone, Shield, Table2, Zap } from 'lucide-react'

const cellTones = [
  'bg-brand-green-50 text-brand-green-800',
  'bg-brand-teal-50 text-brand-teal-800',
  'bg-white text-gray-600',
]

const mockRows = [
  ['Invoice #', 'Date', 'Amount'],
  ['INV-2041', 'Mar 04', '1,240.00'],
  ['INV-2042', 'Mar 06', '980.50'],
  ['INV-2043', 'Mar 09', '2,310.75'],
]

const smallFeatures = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Hundreds of pages in seconds. Runs entirely in the cloud with no downloads and no waiting.',
    iconStyle: { background: 'linear-gradient(135deg, #d97706, #f59e0b)' },
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Files are protected during processing and are not stored for more than 24 hours.',
    iconStyle: { background: 'linear-gradient(135deg, #0e7490, #0d9488)' },
  },
  {
    icon: Layers,
    title: 'Batch Friendly',
    description: 'Drop several PDFs at once and convert them in a single pass — no repeating yourself.',
    iconStyle: { background: 'linear-gradient(135deg, #16a34a, #166534)' },
  },
  {
    icon: MonitorSmartphone,
    title: 'Works Everywhere',
    description: 'Nothing to install. Convert from any browser on desktop, tablet, or phone.',
    iconStyle: { background: 'linear-gradient(135deg, #166534, #0e7490)' },
  },
]

const Features = () => {
  return (
    <section className="relative py-24 bg-gray-50 border-t border-gray-100 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-brand-green-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-brand-teal-100/60 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="inline-flex items-center rounded-full border border-brand-green-100 bg-white px-3 py-1 text-xs font-semibold text-brand-green-700 uppercase tracking-widest mb-4 shadow-sm">
            Why ExcelfromPDF
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight">
            Built for precision, speed, <span className="gradient-text">and trust</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Showcase card: PDF -> Excel visual */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-green-700/5 md:col-span-2">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-green-600 via-brand-teal-600 to-brand-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, #166534, #0d9488)' }}
            >
              <Table2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-gray-900">Structured Table Conversion</h3>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-gray-500">
              Preserves table structures, merged cells, and headers so your data lands in a usable
              spreadsheet — not a wall of text.
            </p>

            <div className="flex items-center gap-3 sm:gap-5">
              {/* Mock PDF page */}
              <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <FileText className="h-3 w-3" /> PDF
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-3/4 rounded bg-gray-300" />
                  <div className="h-1.5 w-full rounded bg-gray-200" />
                  <div className="h-1.5 w-5/6 rounded bg-gray-200" />
                  <div className="h-1.5 w-full rounded bg-gray-200" />
                  <div className="h-1.5 w-2/3 rounded bg-gray-200" />
                </div>
              </div>

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-green-700 to-brand-teal-700 shadow-md transition-transform duration-300 group-hover:scale-110">
                <ArrowRight className="h-4 w-4 text-white" />
              </span>

              {/* Mock Excel sheet */}
              <div className="flex-1 rounded-xl border border-brand-green-100 bg-white p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-green-700">
                  <Table2 className="h-3 w-3" /> Excel
                </div>
                <div className="overflow-hidden rounded-md border border-gray-100">
                  {mockRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-3">
                      {row.map((cell, cellIndex) => (
                        <span
                          key={cellIndex}
                          className={`truncate border-b border-r border-gray-100 px-1.5 py-1 text-[9px] sm:text-[10px] ${
                            rowIndex === 0
                              ? 'bg-brand-green-700 font-semibold text-white'
                              : cellTones[rowIndex % cellTones.length]
                          }`}
                        >
                          {cell}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {smallFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-green-700/5"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-green-600 via-brand-teal-600 to-brand-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                  style={feature.iconStyle}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
