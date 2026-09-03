import { useEffect, useState } from 'react'
import { weddingImages } from '../config/weddingImages.js'

const LINKS = [
  { href: '#about', label: 'about' },
  { href: '#place', label: 'place' },
  { href: '#rsvp', label: 'rsvp' },
]

export default function WeddingNav({ onRsvpClick }) {
  const [active, setActive] = useState('')

  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1))
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return undefined

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) setActive(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    )

    sections.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const handleRsvp = (event) => {
    event.preventDefault()
    onRsvpClick?.()
  }

  return (
    <header className="w-nav-pillbar">
      <a className="w-nav-pillbar__logo" href="#top" aria-label="Top">
        <img src={weddingImages.doodles.mark} alt="" width={28} height={28} />
      </a>
      <nav className="w-nav-pills" aria-label="Primary">
        {LINKS.map((link) => {
          const id = link.href.slice(1)
          const isRsvp = id === 'rsvp'
          const className = `w-nav-pills__link${active === id ? ' is-active' : ''}`

          if (isRsvp) {
            return (
              <a key={link.href} href={link.href} className={className} onClick={handleRsvp}>
                {link.label}
              </a>
            )
          }

          return (
            <a key={link.href} href={link.href} className={className}>
              {link.label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}
