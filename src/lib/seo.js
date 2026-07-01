import { company } from '../data/config.js'

export const SITE_URL = (import.meta.env.VITE_SITE_URL || company.siteUrl).replace(/\/$/, '')

export function absoluteUrl(path = '/') {
  if (!path || path === '/') return SITE_URL
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function upsertMeta(selector, attributes) {
  const { key, value, ...rest } = attributes
  const attrName = key.startsWith('og:') || key.startsWith('twitter:') ? 'property' : 'name'
  let el = document.head.querySelector(`meta[${attrName}="${key}"]`)

  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, key)
    document.head.appendChild(el)
  }

  if (value != null) el.setAttribute('content', value)
  Object.entries(rest).forEach(([name, attrValue]) => el.setAttribute(name, attrValue))
}

export function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)

  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }

  el.setAttribute('href', href)
}

export function applyPageSeo({
  title,
  description,
  path = '/',
  image = `${company.logoSrc}`,
  type = 'website',
  noindex = false,
}) {
  const url = absoluteUrl(path)
  const imageUrl = image?.startsWith('http') ? image : absoluteUrl(image)

  document.title = title
  upsertLink('canonical', url)
  upsertMeta({ key: 'description', value: description })
  upsertMeta({ key: 'robots', value: noindex ? 'noindex, nofollow' : 'index, follow' })

  upsertMeta({ key: 'og:type', value: type })
  upsertMeta({ key: 'og:site_name', value: company.name })
  upsertMeta({ key: 'og:title', value: title })
  upsertMeta({ key: 'og:description', value: description })
  upsertMeta({ key: 'og:url', value: url })
  upsertMeta({ key: 'og:image', value: imageUrl })
  upsertMeta({ key: 'og:locale', value: document.documentElement.lang === 'ko' ? 'ko_AU' : 'en_AU' })

  upsertMeta({ key: 'twitter:card', value: 'summary_large_image' })
  upsertMeta({ key: 'twitter:title', value: title })
  upsertMeta({ key: 'twitter:description', value: description })
  upsertMeta({ key: 'twitter:image', value: imageUrl })
}
