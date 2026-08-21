import { useEffect, useState } from 'react'

const LEFT_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#place', label: 'Place' },
]

export default function WeddingNav({ overlay = false, onRsvpClick }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!overlay) return undefined

    const onScroll = () => setScrolled(window.scrollY > 72)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overlay])

  const handleRsvp = (event) => {
    event.preventDefault()
    setOpen(false)
    onRsvpClick?.()
  }

  const navClass = [
    'w-nav',
    overlay ? 'w-nav--overlay' : '',
    overlay && scrolled ? 'w-nav--solid' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={navClass}>
      <div className="w-nav__inner">
        <div className="w-nav__side w-nav__side--left">
          <button
            type="button"
            className="w-nav__burger"
            aria-expanded={open}
            aria-controls="wedding-mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
          <nav className="w-nav__links w-nav__links--left" aria-label="Primary">
            {LEFT_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="w-nav__side w-nav__side--right">
          <nav className="w-nav__links w-nav__links--right" aria-label="RSVP">
            <a href="#rsvp" onClick={handleRsvp}>
              RSVP
            </a>
          </nav>
        </div>
      </div>

      {open && (
        <div className="w-nav__overlay" role="presentation" onClick={() => setOpen(false)} />
      )}

      <nav
        id="wedding-mobile-nav"
        className={`w-nav__panel${open ? ' is-open' : ''}`}
        aria-label="Mobile"
        aria-hidden={!open}
      >
        <button type="button" className="w-nav__close" onClick={() => setOpen(false)} aria-label="Close">
          ×
        </button>
        <ul className="w-nav__panel-list">
          {LEFT_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#rsvp" onClick={handleRsvp}>
              RSVP
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
