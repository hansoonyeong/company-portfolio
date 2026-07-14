const REVEAL_SELECTORS = [
  'main section',
  'main .studio-intro__grid',
  'main .capabilities__item',
  'main .process__step',
  'main .testimonials__item',
  'main .home-cta__panel',
  'main .works-page__head',
  'main .works-page__filters',
  'main .works-page__grid > li',
  'main .case-study__hero',
  'main .case-study__block',
  'main .case-study__quote',
  'main .case-study__actions',
  'main .case-study__nav',
  'main .pricing__header',
  'main .pricing__pillar',
  'main .pricing__custom',
  'main .project-detail__hero',
  'main .project-detail__photos',
  'main .project-detail__nav',
  'main .news__row',
  'footer .footer__top',
]

const MAX_STAGGER = 5
const STAGGER_MS = 80

function collectRevealElements() {
  const seen = new Set()
  const elements = []

  for (const selector of REVEAL_SELECTORS) {
    document.querySelectorAll(selector).forEach((el) => {
      if (seen.has(el) || el.closest('.scroll-reveal-skip')) return
      seen.add(el)
      elements.push(el)
    })
  }

  return elements
}

function markVisibleInViewport(elements, observer) {
  const viewportLimit = window.innerHeight * 0.92

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.top < viewportLimit && rect.bottom > 0) {
      el.classList.add('scroll-reveal--visible')
      observer.unobserve(el)
    }
  })
}

export function initScrollReveal() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const elements = collectRevealElements()

  if (elements.length === 0) return () => {}

  if (reducedMotion) {
    elements.forEach((el) => {
      el.classList.add('scroll-reveal', 'scroll-reveal--visible')
    })
    return () => {}
  }

  elements.forEach((el) => {
    el.classList.remove('scroll-reveal--visible')
    el.classList.add('scroll-reveal')
  })

  const elementSet = new Set(elements)
  elements.forEach((el) => {
    const parent = el.parentElement
    if (!parent) return
    const siblings = [...parent.children].filter((child) => elementSet.has(child))
    const index = siblings.indexOf(el)
    el.style.setProperty('--reveal-delay', `${Math.min(Math.max(index, 0), MAX_STAGGER) * STAGGER_MS}ms`)
  })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('scroll-reveal--visible')
        observer.unobserve(entry.target)
      })
    },
    {
      root: null,
      rootMargin: '0px 0px -6% 0px',
      threshold: 0.06,
    },
  )

  elements.forEach((el) => observer.observe(el))

  requestAnimationFrame(() => {
    markVisibleInViewport(elements, observer)
  })

  return () => {
    observer.disconnect()
    elements.forEach((el) => {
      el.classList.remove('scroll-reveal', 'scroll-reveal--visible')
      el.style.removeProperty('--reveal-delay')
    })
  }
}
