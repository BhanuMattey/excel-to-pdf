const EXCEL_ADVERTISING_SUFFIX = '-excelfrompdf.com'

export function withExcelAdvertisingSuffix(fileName: string): string {
  const extensionMatch = fileName.match(/\.(xlsx|xls)$/i)
  if (!extensionMatch) return fileName

  const extension = extensionMatch[0]
  const baseName = fileName.slice(0, -extension.length)
  if (baseName.toLowerCase().endsWith(EXCEL_ADVERTISING_SUFFIX)) return fileName

  return `${baseName}${EXCEL_ADVERTISING_SUFFIX}${extension}`
}
