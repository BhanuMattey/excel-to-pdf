import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            <span className="text-xl font-bold text-gray-900">
              Excelfrompdf
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="link-nav">
              Home
            </Link>
            <Link to="/pricing" className="link-nav">
              Pricing
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="link-nav">
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="link-nav"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="link-nav">
                Login
              </Link>
            )}
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/signup" className="btn-primary">
                Sign Up
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-gray-100"
          >
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="link-nav"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/pricing"
                className="link-nav"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="link-nav"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="link-nav text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="link-nav"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn-primary text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="btn-primary text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar
