import { Clock, FileSpreadsheet, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LoginForm } from '../components/auth'
import SEO from '../components/SEO'

const highlights = [
  { icon: ShieldCheck, text: 'Bank-level 256-bit SSL encryption' },
  { icon: Clock, text: 'Files auto-deleted within 24 hours' },
  { icon: FileSpreadsheet, text: 'Clean, Excel-ready exports every time' },
]

const LoginPage = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <SEO
        title="Sign In — ExcelFromPDF"
        description="Sign in to your ExcelFromPDF account to access your conversion history and Pro features."
        canonical="/login"
        noindex={true}
      />

      {/* Brand panel */}
      <div className="relative hidden lg:flex lg:w-[44%] flex-col justify-between overflow-hidden bg-gray-950 p-12 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-green-600/25 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-teal-600/25 blur-3xl animate-blob-slow" />

        <Link to="/" className="relative inline-flex w-fit items-center rounded-2xl bg-white px-3 py-2 shadow-lg">
          <img src="/logo-64.webp" alt="ExcelfromPDF" className="h-10 w-auto" width="64" height="64" />
        </Link>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
            Welcome back to cleaner{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-green-400 to-brand-teal-400">
              spreadsheets.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-gray-400">
            Pick up where you left off — your conversion history, plan, and tools are waiting.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.text} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-brand-green-400" />
                  </span>
                  {item.text}
                </li>
              )
            })}
          </ul>
        </div>

        <p className="relative text-xs text-gray-500">&copy; {new Date().getFullYear()} ExcelfromPDF</p>
      </div>

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-brand-green-100/70 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-brand-teal-100/70 blur-3xl animate-blob-slow" />

        <div className="relative w-full max-w-md">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-brand-green-200/50 via-white to-brand-teal-200/50 blur-sm" />
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-950/5 p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
