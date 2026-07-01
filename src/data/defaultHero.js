import { translations } from '../i18n/translations.js'

export function buildDefaultHero() {
  return {
    images: ['/hero.jpg'],
    headline: {
      ko: translations.ko.hero.headline,
      en: translations.en.hero.headline,
    },
    desc: {
      ko: translations.ko.hero.desc,
      en: translations.en.hero.desc,
    },
    cta: {
      ko: translations.ko.hero.cta,
      en: translations.en.hero.cta,
    },
    link: '/about',
  }
}
