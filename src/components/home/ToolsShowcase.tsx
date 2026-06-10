import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toolItems, toolToneClasses } from '../layout/toolItems'

const ToolsShowcase = () => {
  return (
    <section className="relative py-24 bg-white overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="inline-flex items-center rounded-full border border-brand-teal-100 bg-brand-teal-50 px-3 py-1 text-xs font-semibold text-brand-teal-700 uppercase tracking-widest mb-4 shadow-sm">
            The full toolkit
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight mb-4">
            One workspace, <span className="gradient-text">six tools</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-gray-500">
            Every utility shares the same quick workflow — upload, process, download. No installs,
            no learning curve.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {toolItems.map((tool) => {
            const Icon = tool.icon
            const tone = toolToneClasses[tool.tone]
            return (
              <Link
                key={tool.id}
                to={tool.path}
                className={`group relative flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-950/5 ${tone.border} ${tone.card}`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={tone.boxStyle}
                >
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <span className="min-w-0">
                  <span className="mb-1 block text-sm font-semibold text-gray-900">{tool.title}</span>
                  <span className="block text-sm leading-relaxed text-gray-500">{tool.description}</span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-gray-300 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-500 group-hover:opacity-100" />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ToolsShowcase
