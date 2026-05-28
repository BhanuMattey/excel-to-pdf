import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FileText, ScanLine, Zap, SplitSquareHorizontal, ChevronLeft, ChevronRight, AlignVerticalJustifyCenter, FileSpreadsheet, FileType } from 'lucide-react'
import { useRef } from 'react'

const features = [
  {
    id: 'pdf-to-excel',
    title: 'PDF to Excel',
    icon: FileText,
    description: 'Convert PDF tables to Excel',
    path: '/',
    color: 'primary'
  },
  {
    id: 'auto-correct',
    title: 'Auto Correct Pages',
    icon: ScanLine,
    description: 'Auto-detect and correct pages',
    path: '/auto-correct',
    color: 'purple'
  },
  {
    id: 'split-excel',
    title: 'Split Excel',
    icon: SplitSquareHorizontal,
    description: 'Split by column values',
    path: '/split-excel',
    color: 'green'
  },
  {
    id: 'auto-deskew',
    title: 'Auto Deskew Pages',
    icon: AlignVerticalJustifyCenter,
    description: 'Automatically deskew skewed pages',
    path: '/auto-deskew',
    color: 'purple'
  },
  {
    id: 'excel-to-pdf',
    title: 'Excel to PDF',
    icon: FileSpreadsheet,
    description: 'Convert Excel files to PDF',
    path: '/excel-to-pdf',
    color: 'blue'
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    icon: FileType,
    description: 'Convert PDF files to Word documents',
    path: '/pdf-to-word',
    color: 'green'
  },
]

const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-600',
    hover: 'hover:bg-primary-100',
    border: 'border-primary-200'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    hover: 'hover:bg-purple-100',
    border: 'border-purple-200'
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    hover: 'hover:bg-blue-100',
    border: 'border-blue-200'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    hover: 'hover:bg-green-100',
    border: 'border-green-200'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    hover: 'hover:bg-orange-100',
    border: 'border-orange-200'
  }
}

const FeatureSelector = () => {
  const scrollContainerRef = useRef(null)

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280 // Width of card + gap
      const newScrollPosition = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-8"
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Or choose another tool</h3>
        <p className="text-sm text-gray-500">Select from our suite of PDF and Excel tools</p>
      </div>

      <div className="relative max-w-5xl mx-auto group/scroll">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-gray-50 -ml-5"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-gray-50 -mr-5"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scroll-smooth scrollbar-visible pb-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="flex gap-4 min-w-max px-2">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colors = colorClasses[feature.color]
              
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  className="flex-shrink-0 w-64"
                >
                  <Link
                    to={feature.path}
                    className={`block p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.hover} transition-all duration-200 hover:shadow-md group h-full`}
                  >
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-500">{feature.description}</p>
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
