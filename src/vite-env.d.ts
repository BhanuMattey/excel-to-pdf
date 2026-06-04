/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_API_URL?: string
  readonly VITE_NEON_AUTH_URL: string
  readonly VITE_NEON_DATA_API_URL?: string
  readonly VITE_RAZORPAY_KEY_ID: string
  readonly VITE_FREE_CONVERSION_LIMIT: string
  readonly VITE_DATABASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
