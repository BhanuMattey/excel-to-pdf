import * as XLSX from 'xlsx-js-style'
import JSZip from 'jszip'
export { withExcelAdvertisingSuffix } from './fileNames'

const WORKBOOK_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const cellBorder = {
  top: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
}

const baseFont = { name: 'Arial', sz: 9, color: { rgb: '000000' } }

const dataCellStyle = {
  border: cellBorder,
  alignment: { horizontal: 'center', wrapText: true, vertical: 'center' },
  font: baseFont,
}

const headerCellStyle = {
  border: cellBorder,
  alignment: { horizontal: 'center', wrapText: true, vertical: 'center' },
  font: { name: 'Arial', sz: 9, bold: true, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'D9E1F2' }, patternType: 'solid' },
}

const titleCellStyle = {
  border: cellBorder,
  alignment: { horizontal: 'center', wrapText: true, vertical: 'center' },
  font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '000000' } },
}

function getTextWidth(value: unknown) {
  if (value == null) return 8
  const lines = String(value).split(/\r?\n/)
  return Math.max(...lines.map((line) => line.length), 8)
}

function detectHeaderRows(sheet: XLSX.WorkSheet, range: XLSX.Range): Set<number> {
  const headerRows = new Set<number>()

  for (let row = range.s.r; row <= Math.min(range.s.r + 10, range.e.r); row++) {
    let hasText = false
    let hasNumbers = false
    let allCaps = true

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })]
      if (!cell || cell.v == null) continue
      const val = String(cell.v).trim()
      if (!val) continue
      hasText = true
      if (typeof cell.v === 'number' && col > 0) hasNumbers = true
      if (val !== val.toUpperCase()) allCaps = false
    }

    if (hasText && !hasNumbers && allCaps) {
      headerRows.add(row)
    }
  }

  return headerRows
}

function styleWorksheet(sheet: XLSX.WorkSheet) {
  if (!sheet['!ref']) return

  const range = XLSX.utils.decode_range(sheet['!ref'])
  const widths = new Map<number, number>()
  const headerRows = detectHeaderRows(sheet, range)

  // The first data header row is typically the last consecutive header row block
  const maxHeaderRow = headerRows.size > 0 ? Math.max(...headerRows) : range.s.r

  for (let row = range.s.r; row <= range.e.r; row++) {
    const isHeader = headerRows.has(row)
    const isTitle = row < maxHeaderRow && isHeader

    for (let col = range.s.c; col <= range.e.c; col++) {
      const address = XLSX.utils.encode_cell({ r: row, c: col })
      const cell = sheet[address]
      if (!cell) continue

      const existingStyle = typeof cell.s === 'object' && cell.s ? cell.s : {}
      const numFmt = 'numFmt' in existingStyle ? { numFmt: existingStyle.numFmt } : {}

      if (isTitle) {
        cell.s = { ...numFmt, ...titleCellStyle }
      } else if (isHeader) {
        cell.s = { ...numFmt, ...headerCellStyle }
      } else {
        cell.s = { ...numFmt, ...dataCellStyle }
      }

      widths.set(col, Math.max(widths.get(col) ?? 0, getTextWidth(cell.v)))
    }
  }

  const existingCols = sheet['!cols'] ?? []
  sheet['!cols'] = Array.from({ length: range.e.c - range.s.c + 1 }, (_, index) => {
    const col = range.s.c + index
    const existing = existingCols[col] ?? {}
    const wch = Math.min(Math.max(existing.wch ?? widths.get(col) ?? 10, 10), 40)
    return { ...existing, wch }
  })

  const existingRows = sheet['!rows'] ?? []
  sheet['!rows'] = Array.from({ length: range.e.r - range.s.r + 1 }, (_, index) => {
    const row = range.s.r + index
    const existing = existingRows[row] ?? {}
    let hpt: number
    if (headerRows.has(row) && row === maxHeaderRow) {
      hpt = existing.hpt ?? 52
    } else if (headerRows.has(row)) {
      hpt = existing.hpt ?? 30
    } else {
      hpt = existing.hpt ?? 20
    }
    return { ...existing, hpt }
  })
}

export async function formatExcelWorkbook(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true })

  for (const sheetName of workbook.SheetNames) {
    styleWorksheet(workbook.Sheets[sheetName])
  }

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true,
  })

  return new Blob([output], { type: WORKBOOK_MIME })
}

export async function formatExcelFilesInZip(blob: Blob): Promise<Blob> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const outZip = new JSZip()

  const fileEntries = Object.entries(zip.files).filter(([, f]) => !f.dir)

  await Promise.all(
    fileEntries.map(async ([name, file]) => {
      const data = await file.async('arraybuffer')
      const lowerName = name.toLowerCase()

      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const formatted = await formatExcelWorkbook(new Blob([data]))
        outZip.file(name.replace(/\.xls$/i, '.xlsx'), await formatted.arrayBuffer())
      } else {
        outZip.file(name, data)
      }
    })
  )

  return outZip.generateAsync({ type: 'blob' })
}
