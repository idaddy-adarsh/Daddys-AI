import { Navbar } from '../app/components/Navbar'
import { Hero } from '../app/components/Hero'
import { Features } from '../app/components/Features'
import { StockVisualization } from '../app/components/StockVisualization'
import { Testimonials } from '../app/components/Testimonials'
import { CTA } from '../app/components/CTA'
import { Footer } from '../app/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <StockVisualization />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
