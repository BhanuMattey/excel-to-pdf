import { Navbar, Footer } from '../components/layout'
import { Hero, Features, TrustedBy } from '../components/home'
import SEO from '../components/SEO'

const schema = {
  '@type': 'WebApplication',
  name: 'ExcelFromPDF',
  url: 'https://www.excelfrompdf.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'Free online PDF to Excel converter. Extract tables from any PDF into editable .xlsx files. No signup required.',
}

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Free PDF to Excel Converter Online — ExcelFromPDF"
        description="Convert PDF to Excel in seconds. Extract tables from any PDF into editable .xlsx files. Free, no signup needed. Files deleted in 24 hours."
        canonical="/"
        schema={schema}
      />
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <TrustedBy />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
