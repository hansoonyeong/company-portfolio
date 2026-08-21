import { useEffect, useState } from 'react'

import WeddingPhoto from './WeddingPhoto.jsx'

const INTERVAL_MS = 4800
const FADE_MS = 1200

export default function HeroSlideshow({ images, ratio = '3 / 4' }) {
  const slides = images?.filter((image) => image?.src) ?? []
  const [index, setIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return undefined

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [reduceMotion, slides.length])

  if (!slides.length) return null

  return (
    <figure
      className="w-hero__slides w-lookbook__frame w-lookbook__frame--hero"
      style={{ '--look-ratio': ratio, '--hero-fade-ms': `${FADE_MS}ms` }}
      aria-label="Wedding photos"
    >
      {slides.map((image, slideIndex) => (
        <WeddingPhoto
          key={image.src}
          image={image}
          className={`w-hero__slide${slideIndex === index ? ' is-active' : ''}`}
          sizes="100vw"
          loading={slideIndex === 0 ? 'eager' : 'lazy'}
          fetchPriority={slideIndex === 0 ? 'high' : undefined}
        />
      ))}
    </figure>
  )
}
