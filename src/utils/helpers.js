/**
 * Format file size to human readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Truncate filename if too long
 * @param {string} filename - File name to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated filename
 */
export const truncateFilename = (filename, maxLength = 30) => {
  if (filename.length <= maxLength) return filename
  
  const ext = filename.split('.').pop()
  const name = filename.slice(0, filename.lastIndexOf('.'))
  const truncatedName = name.slice(0, maxLength - ext.length - 4) + '...'
  
  return `${truncatedName}.${ext}`
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  return { valid: true, message: '' }
}

/**
 * Generate a random ID
 * @returns {string} Random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
