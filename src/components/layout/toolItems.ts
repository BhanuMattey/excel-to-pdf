import {
  AlignVerticalJustifyCenter,
  FileSpreadsheet,
  FileText,
  FileType,
  ScanLine,
  SplitSquareHorizontal,
} from 'lucide-react'

export const toolItems = [
  {
    id: 'pdf-to-excel',
    title: 'PDF to Excel',
    description: 'Extract tables from PDFs',
    path: '/',
    icon: FileText,
    tone: 'blue',
  },
  {
    id: 'auto-correct',
    title: 'Auto Correct Pages',
    description: 'Fix page orientation',
    path: '/auto-correct',
    icon: ScanLine,
    tone: 'violet',
  },
  {
    id: 'auto-deskew',
    title: 'Auto Deskew Pages',
    description: 'Straighten tilted scans',
    path: '/auto-deskew',
    icon: AlignVerticalJustifyCenter,
    tone: 'cyan',
  },
  {
    id: 'split-excel',
    title: 'Split Excel',
    description: 'Split sheets by column',
    path: '/split-excel',
    icon: SplitSquareHorizontal,
    tone: 'emerald',
  },
  {
    id: 'excel-to-pdf',
    title: 'Excel to PDF',
    description: 'Export workbooks as PDFs',
    path: '/excel-to-pdf',
    icon: FileSpreadsheet,
    tone: 'green',
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Convert PDFs to DOCX',
    path: '/pdf-to-word',
    icon: FileType,
    tone: 'indigo',
  },
]

import type { CSSProperties } from 'react'

export const toolToneClasses: Record<string, { boxStyle: CSSProperties; card: string; border: string }> = {
  blue: {
    boxStyle: { background: 'linear-gradient(to bottom right, #0e7490, #0d9488)' },
    card: 'hover:bg-blue-50/70',
    border: 'border-blue-100',
  },
  violet: {
    boxStyle: { background: 'linear-gradient(to bottom right, #7c3aed, #6d28d9)' },
    card: 'hover:bg-violet-50/70',
    border: 'border-violet-100',
  },
  cyan: {
    boxStyle: { background: 'linear-gradient(to bottom right, #0891b2, #0e7490)' },
    card: 'hover:bg-cyan-50/70',
    border: 'border-cyan-100',
  },
  emerald: {
    boxStyle: { background: 'linear-gradient(to bottom right, #059669, #0d9488)' },
    card: 'hover:bg-emerald-50/70',
    border: 'border-emerald-100',
  },
  green: {
    boxStyle: { background: 'linear-gradient(to bottom right, #16a34a, #166534)' },
    card: 'hover:bg-green-50/70',
    border: 'border-green-100',
  },
  indigo: {
    boxStyle: { background: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)' },
    card: 'hover:bg-indigo-50/70',
    border: 'border-indigo-100',
  },
}
