import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHero } from '../context/HeroContext'
import { isExternalLink } from '../lib/hero'
import './Hero.css'

const SLIDE_INTERVAL_MS = 5500

function HeroCta({ href, className, children }) {
  if (isExternalLink(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}

export default function Hero() {
  const { hero } = useHero()
  const images = hero.images
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const hasMultiple = images.length > 1

  const goTo = useCallback(
    (next) => {
      if (!hasMultiple) return
      setIndex((prev) => {
        if (typeof next === 'number') return next
        return (prev + 1) % images.length
      })
    },
    [hasMultiple, images.length],
  )

  useEffect(() => {
    setIndex(0)
  }, [images])

  useEffect(() => {
    if (!hasMultiple || paused) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const timer = window.setInterval(() => goTo(), SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [goTo, hasMultiple, paused])

  if (images.length === 0) return null

  return (
    <section className="hero">
      <div
        className="hero__media"
        aria-hidden="true"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="hero__slider">
          <div
            className="hero__track"
            style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
          >
            {images.map((src) => (
              <img key={src} src={src} alt="" className="hero__slide" />
            ))}
          </div>
        </div>
        <div className="hero__scrim" />

        {hasMultiple && (
          <div className="hero__controls">
            <div className="hero__dots" role="tablist" aria-label="Hero slides">
              {images.map((src, dotIndex) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  className={`hero__dot ${dotIndex === index ? 'hero__dot--active' : ''}`}
                  aria-selected={dotIndex === index}
                  aria-label={`Slide ${dotIndex + 1}`}
                  onClick={() => goTo(dotIndex)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hero__inner container">
        <div className="hero__text">
          <h1 className="hero__headline">
            {hero.headline.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <div className="hero__desc">
            {hero.desc.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <HeroCta href={hero.link} className="link-arrow hero__cta">
            {hero.cta}
          </HeroCta>
        </div>
      </div>
    </section>
  )
}
