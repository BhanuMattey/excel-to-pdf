export const FREE_PDF_SIZE_LIMIT = 5 * 1024 * 1024
export const FREE_EXCEL_SIZE_LIMIT = 5 * 1024 * 1024
export const DEFAULT_PRO_PDF_SIZE_LIMIT = 50 * 1024 * 1024
// Above this total size, show a "this can take a few minutes" notice during processing.
export const LARGE_FILE_NOTICE_THRESHOLD = 8 * 1024 * 1024

export const getPdfMaxSize = (isPro: boolean): number => {
  if (isPro) {
    return parseInt(import.meta.env.VITE_MAX_FILE_SIZE || String(DEFAULT_PRO_PDF_SIZE_LIMIT))
  }
  return FREE_PDF_SIZE_LIMIT
}

export const getExcelMaxSize = (isPro: boolean): number => {
  if (isPro) {
    return parseInt(import.meta.env.VITE_MAX_FILE_SIZE || String(DEFAULT_PRO_PDF_SIZE_LIMIT))
  }
  return FREE_EXCEL_SIZE_LIMIT
}
