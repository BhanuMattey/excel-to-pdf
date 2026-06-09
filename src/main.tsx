import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { PlanProvider } from './context/PlanContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <PlanProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#1f2937',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                borderRadius: '0.75rem',
                padding: '1rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </PlanProvider>
      </AuthProvider>
    </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
