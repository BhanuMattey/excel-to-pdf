/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            50:  '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#166534',
            800: '#14532d',
            900: '#052e16',
          },
          teal: {
            50:  '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
          },
          amber: {
            50:  '#fffbeb',
            100: '#fef3c7',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            800: '#92400e',
          },
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
        'upload': '0 0 0 3px rgba(22, 101, 52, 0.12)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  safelist: [
    'bg-brand-green-50', 'bg-brand-green-100', 'bg-brand-green-700', 'bg-brand-green-800',
    'bg-brand-teal-50', 'bg-brand-teal-100', 'bg-brand-teal-700', 'bg-brand-teal-800',
    'bg-brand-amber-100',
    'text-brand-green-600', 'text-brand-green-700', 'text-brand-green-800',
    'text-brand-teal-700', 'text-brand-amber-600',
    'border-brand-green-100', 'border-brand-green-300', 'border-brand-green-700',
    'border-brand-teal-100', 'border-brand-teal-300',
    'bg-primary-50', 'bg-primary-100', 'bg-primary-500', 'bg-primary-600', 'bg-primary-700',
    'text-primary-600', 'text-primary-700',
    'hover:bg-brand-green-800', 'hover:bg-brand-teal-800',
  ],
  plugins: [],
}
