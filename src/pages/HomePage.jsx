import Hero from '../components/Hero'
import News from '../components/News'
import Projects from '../components/Projects'

export default function HomePage() {
  return (
    <>
      <Hero />
      <News showMore />
      <Projects showMore />
    </>
  )
}
