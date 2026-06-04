import { FileType } from 'lucide-react'
import ConversionPage from '../components/shared/ConversionPage'
import { pdfService } from '../services/api'

const PdfToWordPage = () => (
  <ConversionPage
    title="PDF to Word Converter"
    description="Convert your PDF files to editable Word documents with one click."
    Icon={FileType}
    color="blue"
    serviceCall={pdfService.pdfToWord.bind(pdfService)}
    getOutputName={(name) => name.replace(/\.pdf$/i, '.docx')}
  />
)

export default PdfToWordPage
