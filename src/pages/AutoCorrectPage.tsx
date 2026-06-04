import { ScanLine } from 'lucide-react'
import ConversionPage from '../components/shared/ConversionPage'
import { pdfService } from '../services/api'

const AutoCorrectPage = () => (
  <ConversionPage
    title="Auto Correct PDF"
    description="Automatically detect rotated and flipped pages in PDFs and correct them with one click."
    Icon={ScanLine}
    color="purple"
    serviceCall={pdfService.autoCorrectPdf.bind(pdfService)}
    getOutputName={(name) => name.replace(/\.pdf$/i, '_corrected.pdf')}
  />
)

export default AutoCorrectPage
