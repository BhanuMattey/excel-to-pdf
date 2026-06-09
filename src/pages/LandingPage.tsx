import { Footer } from '../components/layout'
import PublicNavbar from '../components/layout/PublicNavbar'
import { Hero, Features, TrustedBy } from '../components/home'

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
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
