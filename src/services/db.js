import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://153.75.250.227:8000'

const http = axios.create({ baseURL: API_URL, timeout: 15000 })

// Attach JWT from localStorage to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const handle = (promise) =>
  promise.then((r) => r.data).catch((e) => {
    throw new Error(e.response?.data?.detail || e.response?.data?.message || e.message)
  })

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authService = {
  async signUp(email, password, fullName) {
    const data = await handle(http.post('/api/auth/register', { email, password, full_name: fullName }))
    if (data.token) localStorage.setItem('auth_token', data.token)
    return data
  },

  async signIn(email, password) {
    const data = await handle(http.post('/api/auth/login', { email, password }))
    if (data.token) localStorage.setItem('auth_token', data.token)
    return data
  },

  async signOut() {
    localStorage.removeItem('auth_token')
  },

  async getSession() {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    try {
      const data = await handle(http.get('/api/auth/me'))
      return { user: data }
    } catch {
      localStorage.removeItem('auth_token')
      return null
    }
  },
}

// ─── Conversions ─────────────────────────────────────────────────────────────

export const conversionService = {
  createConversion: (userId, fileName) =>
    handle(http.post('/api/conversions', { user_id: userId, file_name: fileName, status: 'processing' })),

  updateConversionStatus: (id, status, outputUrl = null) =>
    handle(http.patch(`/api/conversions/${id}`, { status, output_url: outputUrl })),

  getUserConversions: (userId) =>
    handle(http.get(`/api/conversions?user_id=${userId}`)),

  getConversionCount: (userId) =>
    handle(http.get(`/api/conversions/count?user_id=${userId}`)).then((d) => d.count ?? 0),
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileService = {
  getProfile: (userId) =>
    handle(http.get(`/api/profiles/${userId}`)).catch(() => null),

  updateProfile: (userId, updates) =>
    handle(http.put(`/api/profiles/${userId}`, updates)),
}
