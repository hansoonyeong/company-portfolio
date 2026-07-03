import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../context/ProjectsContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getProjectPath } from '../lib/projects'
import { buildProjectImageAlt } from '../lib/imageSeo'
import './Projects.css'

const HOME_PREVIEW_LIMIT = 3
const SLIDE_INTERVAL_MS = 5000

function getSlidesPerView(width) {
  if (width <= 540) return 1
  if (width <= 900) return 2
  return 3
}

function ProjectCard({ project }) {
  return (
    <Link to={getProjectPath(project)} className="projects__card">
      <div className="projects__thumb">
        {project.thumb ? (
          <img
            src={project.thumb}
            alt={buildProjectImageAlt({
              title: project.title,
              subtitle: project.subtitle,
              tag: project.tag,
            })}
            className="projects__thumb-img"
          />
        ) : (
          <span>{project.title.charAt(0)}</span>
        )}
      </div>
      <div className="projects__info">
        <span className="projects__tag">{project.tag}</span>
        <span className="projects__date">{project.date}</span>
        <h3 className="projects__title">{project.subtitle || project.title}</h3>
        <p className="projects__client">{project.title}</p>
      </div>
    </Link>
  )
}

function ProjectsCarousel({ items }) {
  const [index, setIndex] = useState(0)
  const [perView, setPerView] = useState(() => getSlidesPerView(window.innerWidth))
  const [paused, setPaused] = useState(false)

  const maxIndex = Math.max(0, items.length - perView)
  const canSlide = items.length > perView
  const slideStep = 100 / perView

  const goTo = useCallback(
    (next) => {
      if (!canSlide) return
      setIndex((prev) => {
        if (typeof next === 'number') return Math.min(Math.max(next, 0), maxIndex)
        return prev >= maxIndex ? 0 : prev + 1
      })
    },
    [canSlide, maxIndex],
  )

  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex))
  }, [maxIndex])

  useEffect(() => {
    const handleResize = () => setPerView(getSlidesPerView(window.innerWidth))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!canSlide || paused) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const timer = window.setInterval(() => goTo(), SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [canSlide, paused, goTo])

  return (
    <div
      className="projects__carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="projects__viewport">
        <ul
          className="projects__track"
          style={{ transform: `translate3d(-${index * slideStep}%, 0, 0)` }}
        >
          {items.map((project) => (
            <li key={project.id} className="projects__slide" style={{ flexBasis: `${slideStep}%` }}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </div>

      {canSlide && (
        <div className="projects__controls">
          <button
            type="button"
            className="projects__nav"
            aria-label="Previous projects"
            onClick={() => setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))}
          >
            ‹
          </button>
          <div className="projects__dots" role="tablist" aria-label="Project slides">
            {Array.from({ length: maxIndex + 1 }, (_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                role="tab"
                className={`projects__dot ${dotIndex === index ? 'projects__dot--active' : ''}`}
                aria-selected={dotIndex === index}
                aria-label={`Slide ${dotIndex + 1}`}
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>
          <button
            type="button"
            className="projects__nav"
            aria-label="Next projects"
            onClick={() => goTo()}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

export default function Projects({ limit = HOME_PREVIEW_LIMIT, showMore = false }) {
  const { t } = useTranslation()
  const { projects } = useProjects()
  const items = showMore ? projects : projects.slice(0, limit)

  return (
    <section className="projects section" id="works">
      <div className="container">
        <div className="section-header">
          <h2>{t.projects.title}</h2>
          {showMore && <Link to="/works">{t.projects.more}</Link>}
        </div>

        {showMore ? (
          <ProjectsCarousel items={items} />
        ) : (
          <ul className="projects__grid">
            {items.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
