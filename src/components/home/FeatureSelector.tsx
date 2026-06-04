import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { toolItems, toolToneClasses } from '../layout/toolItems'

const FeatureSelector = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollTo({
      left: container.scrollLeft + (direction === 'left' ? -280 : 280),
      behavior: 'smooth',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mt-8"
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose another tool</h3>
        <p className="text-sm text-gray-500">PDF and Excel utilities with the same quick workflow.</p>
      </div>

      <div className="relative max-w-5xl mx-auto group/scroll">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-gray-50 -ml-5"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-gray-50 -mr-5"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>

        <div ref={scrollContainerRef} className="overflow-x-auto scroll-smooth scrollbar-visible pb-4">
          <div className="flex gap-4 min-w-max px-2">
            {toolItems.map((tool, index) => {
              const Icon = tool.icon
              const tone = toolToneClasses[tool.tone]

              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="flex-shrink-0 w-64"
                >
                  <Link
                    to={tool.path}
                    className={`block h-full rounded-xl border bg-white p-4 transition-all duration-200 hover:shadow-md ${tone.border} ${tone.card}`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 shadow-sm" style={tone.boxStyle}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{tool.title}</h4>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FeatureSelector
