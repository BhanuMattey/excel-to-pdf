import { AlignVerticalJustifyCenter } from 'lucide-react'
import ConversionPage from '../components/shared/ConversionPage'
import { pdfService } from '../services/api'

const AutoDeskewPage = () => (
  <ConversionPage
    title="Auto Deskew PDFs"
    description="Automatically detect skewed pages in PDFs and correct them with one click."
    Icon={AlignVerticalJustifyCenter}
    color="blue"
    serviceCall={pdfService.autoDeskewPdf.bind(pdfService)}
    getOutputName={(name) => name.replace(/\.pdf$/i, '_deskewed.pdf')}
  />
)

export default AutoDeskewPage
