import Hero from '../components/Hero'
import Projects from '../components/Projects'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Projects showMore carousel limit={8} />
    </>
  )
}
