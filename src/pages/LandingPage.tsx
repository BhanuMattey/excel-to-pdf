import { Navbar, Footer } from '../components/layout'
import { Hero, Features, TrustedBy } from '../components/home'

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
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
