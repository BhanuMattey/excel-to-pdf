import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-64.webp" alt="ExcelfromPDF" className="h-10 w-auto" width="64" height="64" />
            <span className="text-sm text-gray-400">&copy; {new Date().getFullYear()}</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Pricing</Link>
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Terms</Link>
            <Link to="/contact" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
