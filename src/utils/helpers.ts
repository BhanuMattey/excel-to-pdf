export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const truncateFilename = (filename: string | undefined | null, maxLength = 30): string => {
  if (!filename) return ''
  if (filename.length <= maxLength) return filename
  const ext = filename.split('.').pop() ?? ''
  const name = filename.slice(0, filename.lastIndexOf('.'))
  const truncatedName = name.slice(0, maxLength - ext.length - 4) + '...'
  return `${truncatedName}.${ext}`
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  return { valid: true, message: '' }
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15)
}

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
