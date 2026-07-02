function pickLocalized(field, lang) {
  if (field && typeof field === 'object' && (field.en || field.ko)) {
    return field[lang] || field.en || field.ko || ''
  }
  return field ?? ''
}

function localizeCaseStudy(caseStudy, lang) {
  if (!caseStudy) return null

  const pick = (field) => pickLocalized(field, lang)
  const pickList = (field) => {
    if (Array.isArray(field?.[lang])) return field[lang]
    if (Array.isArray(field?.en)) return field.en
    if (Array.isArray(field?.ko)) return field.ko
    return Array.isArray(field) ? field : []
  }

  const media = [
    caseStudy.hero?.video || null,
    caseStudy.hero?.video ? null : caseStudy.hero?.image,
    ...(caseStudy.logo?.cells?.flatMap((cell) => [cell.video, cell.image].filter(Boolean)) || []),
    caseStudy.businessCard?.mainVideo,
    caseStudy.businessCard?.mainImage,
    ...(caseStudy.businessCard?.miniImages || []),
  ].filter(Boolean)

  return {
    accent: caseStudy.accent || '#111111',
    media: [...new Set(media)],
    hero: {
      eyebrow: pick(caseStudy.hero?.eyebrow),
      headline: pick(caseStudy.hero?.headline),
      lead: pick(caseStudy.hero?.lead),
      image: caseStudy.hero?.poster || caseStudy.hero?.image || '',
      video: caseStudy.hero?.video || '',
      poster: caseStudy.hero?.poster || caseStudy.hero?.image || '',
      meta: (caseStudy.hero?.meta || []).map((item) => ({
        label: pick(item.label),
        value: pick(item.value),
      })),
    },
    overview: {
      label: pick(caseStudy.overview?.label),
      title: pick(caseStudy.overview?.title),
      paragraphs: pickList(caseStudy.overview?.paragraphs),
    },
    process: {
      label: pick(caseStudy.process?.label),
      title: pick(caseStudy.process?.title),
      steps: (caseStudy.process?.steps || []).map((step) => ({
        tag: pick(step.tag),
        title: pick(step.title),
        body: pick(step.body),
      })),
    },
    logo: {
      label: pick(caseStudy.logo?.label),
      title: pick(caseStudy.logo?.title),
      text: pick(caseStudy.logo?.text),
      cells: (caseStudy.logo?.cells || []).map((cell) => ({
        image: cell.image || '',
        video: cell.video || '',
        poster: cell.poster || cell.image || '',
        tag: pick(cell.tag),
        variant: cell.variant || 'dark',
      })),
    },
    businessCard:
      caseStudy.businessCard?.mainImage || caseStudy.businessCard?.mainVideo
        ? {
            layout: caseStudy.businessCard.layout || 'cards',
            label: pick(caseStudy.businessCard?.label),
            title: pick(caseStudy.businessCard?.title),
            text: pick(caseStudy.businessCard?.text),
            mainImage: caseStudy.businessCard.mainImage || '',
            mainVideo: caseStudy.businessCard.mainVideo || '',
            mainPoster: caseStudy.businessCard.mainPoster || caseStudy.businessCard.mainImage || '',
            footnote: pick(caseStudy.businessCard?.footnote),
            miniImages: caseStudy.businessCard?.miniImages || [],
          }
        : null,
    touchpoints: caseStudy.touchpoints
      ? {
          label: pick(caseStudy.touchpoints.label),
          title: pick(caseStudy.touchpoints.title),
          text: pick(caseStudy.touchpoints.text),
          cards: (caseStudy.touchpoints.cards || []).map((card) => ({
            title: pick(card.title),
            text: pick(card.text),
            linkUrl: card.linkUrl || '',
            linkLabel: pick(card.linkLabel),
            items: (card.items || []).map((item) => ({
              label: item.label || '',
              text: pick(item.text),
            })),
          })),
        }
      : null,
    quote: caseStudy.quote
      ? {
          text: pick(caseStudy.quote.text),
          cite: pick(caseStudy.quote.cite),
        }
      : null,
  }
}

export function localizeProject(item, lang) {
  if (!item) return null

  const pick = (field) => pickLocalized(field, lang)
  const caseStudy = localizeCaseStudy(item.caseStudy, lang)

  return {
    id: item.id,
    slug: item.slug || '',
    assetVersion: item.updatedAt || '',
    tag: pick(item.tag),
    title: pick(item.title),
    subtitle: pick(item.subtitle),
    date: item.date,
    client: pick(item.client),
    location: pick(item.location),
    description: pick(item.description),
    scope: Array.isArray(item.scope?.[lang])
      ? item.scope[lang]
      : Array.isArray(item.scope)
        ? item.scope
        : item.scope?.en || item.scope?.ko || [],
    thumb: item.thumb || '',
    gallery: item.gallery || [],
    caseStudy,
  }
}

export function getProjectSlug(project) {
  if (!project) return ''
  if (project.slug) return project.slug
  return String(project.id)
}

export function getProjectPath(project) {
  return `/work/${getProjectSlug(project)}`
}

export function getProjectSortKey(date) {
  if (!date) return 0
  const [yearPart, monthPart] = String(date).split('.')
  const year = Number(yearPart) || 0
  const month = Number(monthPart) || 0
  return year * 100 + month
}

export function sortProjectsByDate(projects) {
  return [...projects].sort((a, b) => {
    const diff = getProjectSortKey(b.date) - getProjectSortKey(a.date)
    if (diff !== 0) return diff
    return b.id - a.id
  })
}

export function isPhotographyProject(tag) {
  return getProjectFilterKey(tag) === 'photography'
}

export function getProjectFilterKey(tag) {
  const map = {
    Marketing: 'marketing',
    마케팅: 'marketing',
    Design: 'design',
    디자인: 'design',
    Content: 'content',
    콘텐츠: 'content',
    Photography: 'photography',
    촬영: 'photography',
  }
  return map[tag] ?? 'all'
}

export function findProject(projects, identifier) {
  if (!identifier) return null
  const value = String(identifier)
  const numId = Number(value)
  if (Number.isFinite(numId)) {
    const byId = projects.find((p) => p.id === numId)
    if (byId) return byId
  }

  return projects.find((p) => p.slug === value) ?? null
}

export function getProjectNeighbors(projects, identifier) {
  const current = findProject(projects, identifier)
  if (!current) return { prev: null, next: null }
  const index = projects.findIndex((p) => p.id === current.id)
  if (index < 0) return { prev: null, next: null }

  return {
    prev: index > 0 ? projects[index - 1] : null,
    next: index < projects.length - 1 ? projects[index + 1] : null,
  }
}

export function projectCartId(projectId) {
  return `project-${projectId}`
}

export function projectToCartItem(project, priceLabel) {
  return {
    id: projectCartId(project.id),
    section: 'Project',
    category: project.subtitle,
    name: `${project.title} — ${project.subtitle}`,
    price: priceLabel,
  }
}
