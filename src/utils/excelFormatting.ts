import * as XLSX from 'xlsx-js-style'
import JSZip from 'jszip'

const WORKBOOK_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const cellBorder = {
  top: { style: 'thin', color: { rgb: 'D9E2EC' } },
  right: { style: 'thin', color: { rgb: 'D9E2EC' } },
  bottom: { style: 'thin', color: { rgb: 'D9E2EC' } },
  left: { style: 'thin', color: { rgb: 'D9E2EC' } },
}

const baseAlignment = {
  wrapText: true,
  vertical: 'top',
}

const bodyStyle = {
  border: cellBorder,
  alignment: baseAlignment,
}

const headerStyle = {
  border: cellBorder,
  alignment: baseAlignment,
  font: { bold: true, color: { rgb: '111827' } },
  fill: { fgColor: { rgb: 'F3F4F6' } },
}

function getTextWidth(value: unknown) {
  if (value == null) return 8
  const lines = String(value).split(/\r?\n/)
  return Math.max(...lines.map((line) => line.length), 8)
}

function styleWorksheet(sheet: XLSX.WorkSheet) {
  if (!sheet['!ref']) return

  const range = XLSX.utils.decode_range(sheet['!ref'])
  const widths = new Map<number, number>()
  const rowHeights = new Map<number, number>()

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const address = XLSX.utils.encode_cell({ r: row, c: col })
      const cell = sheet[address]
      if (!cell) continue

      const existingStyle = typeof cell.s === 'object' && cell.s ? cell.s : {}
      cell.s = {
        ...existingStyle,
        ...(row === range.s.r ? headerStyle : bodyStyle),
        alignment: {
          ...(existingStyle as { alignment?: object }).alignment,
          wrapText: true,
          vertical: 'top',
        },
      }

      widths.set(col, Math.max(widths.get(col) ?? 0, getTextWidth(cell.v)))

      const text = cell.v == null ? '' : String(cell.v)
      const estimatedLines = Math.max(text.split(/\r?\n/).length, Math.ceil(text.length / 34))
      if (estimatedLines > 1) {
        rowHeights.set(row, Math.max(rowHeights.get(row) ?? 18, Math.min(estimatedLines * 16, 72)))
      }
    }
  }

  const existingCols = sheet['!cols'] ?? []
  sheet['!cols'] = Array.from({ length: range.e.c - range.s.c + 1 }, (_, index) => {
    const col = range.s.c + index
    const existing = existingCols[col] ?? {}
    const wch = Math.min(Math.max(widths.get(col) ?? existing.wch ?? 12, 10), 42)
    return { ...existing, wch }
  })

  const existingRows = sheet['!rows'] ?? []
  sheet['!rows'] = Array.from({ length: range.e.r - range.s.r + 1 }, (_, index) => {
    const row = range.s.r + index
    const existing = existingRows[row] ?? {}
    const hpt = rowHeights.get(row)
    return hpt ? { ...existing, hpt } : existing
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
