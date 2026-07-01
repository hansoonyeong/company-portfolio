import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useProjects } from '../context/ProjectsContext'
import { initScrollReveal } from '../lib/scrollReveal'

export default function ScrollRevealManager() {
  const location = useLocation()
  const { loading } = useProjects()

  useEffect(() => {
    let cleanup = () => {}

    const timer = window.setTimeout(() => {
      cleanup = initScrollReveal()
    }, 60)

    return () => {
      window.clearTimeout(timer)
      cleanup()
    }
  }, [location.pathname, location.hash, loading])

  return null
}
