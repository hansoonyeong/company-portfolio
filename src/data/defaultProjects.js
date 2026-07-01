import { translations } from '../i18n/translations.js'

export function buildDefaultProjects() {
  const enItems = translations.en.projects.items
  const koItems = translations.ko.projects.items

  return enItems.map((item, index) => {
    const ko = koItems[index]
    return {
      id: item.id,
      tag: { en: item.tag, ko: ko.tag },
      title: item.title,
      subtitle: item.subtitle,
      date: item.date,
      client: item.client,
      location: item.location,
      description: { en: item.description, ko: ko.description },
      scope: { en: item.scope, ko: ko.scope },
      ...(item.thumb ? { thumb: item.thumb } : {}),
      ...(item.gallery ? { gallery: item.gallery } : {}),
    }
  })
}
