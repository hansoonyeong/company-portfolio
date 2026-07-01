/** Client logo paths for About page marquee. Files live in public/clients/ */
export const CLIENT_LOGO_BY_SLUG = {
  'kimchi-house-au': '/projects/kimchi-house-au/logo-white.jpg',
  peekabrew: '/clients/peekabrew.png',
  'choi-co': '/clients/choiandco.png',
}

export const CLIENT_LOGO_BY_NAME = {
  'Bornga Australia': '/clients/bornga-australia.png',
  GMGP: '/clients/gmgp.png',
  'DOS Taekwondo': '/clients/dos-taekwondo.png',
}

/** Visual scale tweaks — logos with extra padding or compact marks */
export const CLIENT_LOGO_SCALE_BY_SLUG = {
  'kimchi-house-au': 1.3,
}

export const CLIENT_LOGO_SCALE_BY_NAME = {
  'Bornga Australia': 1.35,
  GMGP: 1.4,
}

/** Wide wordmarks — size by width, not square max-height */
export const CLIENT_LOGO_STYLE_BY_SLUG = {
  peekabrew: {
    maxWidth: 'clamp(240px, 30vw, 360px)',
    maxHeight: 'clamp(44px, 6vw, 68px)',
    scale: 1.05,
  },
  'choi-co': {
    maxWidth: 'clamp(200px, 24vw, 300px)',
    maxHeight: 'clamp(36px, 5vw, 54px)',
    scale: 1,
  },
}

export function getClientLogoPath({ slug, name }) {
  if (slug && CLIENT_LOGO_BY_SLUG[slug]) return CLIENT_LOGO_BY_SLUG[slug]
  return CLIENT_LOGO_BY_NAME[name] || ''
}

export function getClientLogoScale({ slug, name }) {
  const style = getClientLogoStyle({ slug, name })
  if (style.scale) return style.scale
  if (slug && CLIENT_LOGO_SCALE_BY_SLUG[slug]) return CLIENT_LOGO_SCALE_BY_SLUG[slug]
  if (CLIENT_LOGO_SCALE_BY_NAME[name]) return CLIENT_LOGO_SCALE_BY_NAME[name]
  return 1
}

export function getClientLogoStyle({ slug, name }) {
  if (slug && CLIENT_LOGO_STYLE_BY_SLUG[slug]) return CLIENT_LOGO_STYLE_BY_SLUG[slug]
  return {}
}

export function getUniqueClients(projects) {
  const seen = new Map()

  for (const project of projects) {
    const name = (project.client || project.title || '').trim()
    if (!name || seen.has(name)) continue

    seen.set(name, {
      name,
      id: project.id,
      slug: project.slug || '',
      logo: getClientLogoPath({ slug: project.slug, name }),
      logoScale: getClientLogoScale({ slug: project.slug, name }),
      logoStyle: getClientLogoStyle({ slug: project.slug, name }),
    })
  }

  return [...seen.values()]
}
