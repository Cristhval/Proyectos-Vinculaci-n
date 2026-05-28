import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Pillars from './components/Pillars'
import Convenios from './components/Convenios'
import Institucional from './components/Institucional'
import Footer from './components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Pillars />
        <Convenios />
        <Institucional />
      </main>
      <Footer />
    </div>
  )
}
