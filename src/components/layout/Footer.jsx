import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6h16M4 10h12M4 14h16M4 18h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">ExcelfromPDF</span>
            </Link>
            <span className="text-sm text-gray-500">
              © {new Date().getFullYear()} ExcelfromPDF. All rights reserved.
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              to="/privacy"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/contact"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
