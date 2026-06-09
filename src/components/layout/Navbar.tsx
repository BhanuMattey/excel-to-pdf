import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { toolItems, toolToneClasses } from './toolItems'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 navbar-slide-in"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-64.webp" alt="ExcelfromPDF" className="h-16 w-auto" width="64" height="64" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <div
              className="relative"
              onMouseEnter={() => setIsToolsOpen(true)}
              onMouseLeave={() => setIsToolsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsToolsOpen((open) => !open)}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isToolsOpen && (
                <div className="absolute left-1/2 top-full pt-4 w-[540px] -translate-x-1/2">
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-gray-950/10">
                    {toolItems.map((tool) => {
                      const Icon = tool.icon
                      const tone = toolToneClasses[tool.tone]
                      return (
                        <Link
                          key={tool.path}
                          to={tool.path}
                          onClick={() => setIsToolsOpen(false)}
                          className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${tone.card}`}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg shadow-sm" style={tone.boxStyle}>
                            <Icon className="h-4 w-4 text-white" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-gray-900">{tool.title}</span>
                            <span className="block text-xs text-gray-500">{tool.description}</span>
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link to="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 bg-brand-green-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-green-800 transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div
            className="md:hidden py-4 border-t border-gray-100"
          >
            <div className="grid grid-cols-1 gap-1 pb-4">
              {toolItems.map((tool) => {
                const Icon = tool.icon
                const tone = toolToneClasses[tool.tone]
                return (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className={`flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-gray-700 ${tone.card}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm" style={tone.boxStyle}>
                      <Icon className="h-4 w-4 text-white" />
                    </span>
                    <span>
                      <span className="block font-medium text-gray-900">{tool.title}</span>
                      <span className="block text-xs text-gray-500">{tool.description}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
            <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
              <Link to="/pricing" className="text-sm text-gray-600" onClick={() => setIsMenuOpen(false)}>
                Pricing
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="text-sm text-gray-600" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="text-sm text-gray-600 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-gray-600" onClick={() => setIsMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-brand-green-700 text-white text-sm font-semibold rounded-lg text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
