import Footer from '../components/layout/Footer'
import PublicNavbar from '../components/layout/PublicNavbar'
import { Hero, Features, TrustedBy, ToolsShowcase } from '../components/home'

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <ToolsShowcase />
        <TrustedBy />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
