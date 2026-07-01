function parseLines(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function localizeHero(hero, lang) {
  if (!hero) return null

  return {
    images: Array.isArray(hero.images) ? hero.images : [],
    headline: hero.headline?.[lang] || hero.headline?.en || [],
    desc: hero.desc?.[lang] || hero.desc?.en || [],
    cta: hero.cta?.[lang] || hero.cta?.en || '',
    link: hero.link || '/about',
  }
}

export function heroToForm(hero) {
  return {
    headlineKo: (hero?.headline?.ko || []).join('\n'),
    headlineEn: (hero?.headline?.en || []).join('\n'),
    descKo: (hero?.desc?.ko || []).join('\n'),
    descEn: (hero?.desc?.en || []).join('\n'),
    ctaKo: hero?.cta?.ko || '',
    ctaEn: hero?.cta?.en || '',
    link: hero?.link || '/about',
  }
}

export function formToHeroContent(form) {
  return {
    headline: {
      ko: parseLines(form.headlineKo),
      en: parseLines(form.headlineEn),
    },
    desc: {
      ko: parseLines(form.descKo),
      en: parseLines(form.descEn),
    },
    cta: {
      ko: form.ctaKo.trim(),
      en: form.ctaEn.trim(),
    },
    link: form.link.trim() || '/about',
  }
}

export function isExternalLink(href) {
  return /^https?:\/\//i.test(String(href || ''))
}
