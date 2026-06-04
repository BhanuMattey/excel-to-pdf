import { FileSpreadsheet } from 'lucide-react'
import ConversionPage from '../components/shared/ConversionPage'
import { pdfService } from '../services/api'

const ExcelToPdfPage = () => (
  <ConversionPage
    title="Convert Excel to PDF"
    description="Convert your Excel spreadsheets (.xlsx, .xls, .xlsm) to PDF format with ease."
    Icon={FileSpreadsheet}
    color="green"
    serviceCall={pdfService.excelToPdf.bind(pdfService)}
    getOutputName={(name) => name.replace(/\.(xlsx|xls|xlsm)$/i, '_converted.pdf')}
    fileType="excel"
    maxSizeMB={10}
  />
)

export default ExcelToPdfPage
