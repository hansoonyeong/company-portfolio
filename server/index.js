import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { buildDefaultProjects } from '../src/data/defaultProjects.js'
import { buildDefaultHero } from '../src/data/defaultHero.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, 'data', 'quotes.json')
const NEWS_FILE = path.join(__dirname, 'data', 'news.json')
const PROJECTS_FILE = path.join(__dirname, 'data', 'projects.json')
const HERO_FILE = path.join(__dirname, 'data', 'hero.json')
const PUBLIC_ROOT = path.join(__dirname, '..', 'public')
const PROJECTS_PUBLIC = path.join(PUBLIC_ROOT, 'projects')
const HERO_PUBLIC = path.join(PUBLIC_ROOT, 'hero')
// Persist admin uploads on the Render disk (server/data), not ephemeral public/
const PROJECTS_UPLOAD = path.join(__dirname, 'data', 'uploads', 'projects')
const HERO_UPLOAD = path.join(__dirname, 'data', 'uploads', 'hero')
const PORT = process.env.PORT || 3001
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'soono2026'
const SITE_URL = (process.env.SITE_URL || 'https://soono.au').replace(/\/$/, '')
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8

const sessions = new Map()

export const app = express()
app.use(cors())
app.use(express.json())

async function readQuotes() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
      await fs.writeFile(DATA_FILE, '[]')
      return []
    }
    throw err
  }
}

async function writeQuotes(quotes) {
  await fs.writeFile(DATA_FILE, JSON.stringify(quotes, null, 2))
}

async function readNews() {
  try {
    const raw = await fs.readFile(NEWS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(path.dirname(NEWS_FILE), { recursive: true })
      await fs.writeFile(NEWS_FILE, '[]')
      return []
    }
    throw err
  }
}

async function writeNews(news) {
  await fs.writeFile(NEWS_FILE, JSON.stringify(news, null, 2))
}

function parseNewsPayload(body) {
  const { category, title, content, date, document } = body ?? {}

  const categoryKo = category?.ko?.trim()
  const categoryEn = category?.en?.trim()
  const titleKo = title?.ko?.trim()
  const titleEn = title?.en?.trim()
  const contentKo = content?.ko?.trim() || ''
  const contentEn = content?.en?.trim() || ''
  const dateStr = date?.trim()

  if (!categoryKo || !categoryEn || !titleKo || !titleEn || !dateStr) {
    return { error: 'Missing required fields' }
  }

  const item = {
    category: { ko: categoryKo, en: categoryEn },
    title: { ko: titleKo, en: titleEn },
    content: { ko: contentKo, en: contentEn },
    date: dateStr,
  }

  if (document !== undefined) {
    const docHref = document?.href?.trim()
    if (docHref) {
      item.document = {
        href: docHref,
        label: {
          ko: document?.label?.ko?.trim() || '',
          en: document?.label?.en?.trim() || '',
        },
      }
    }
  }

  return { item, omitDocument: document !== undefined && !document?.href?.trim() }
}

async function readProjects() {
  try {
    const raw = await fs.readFile(PROJECTS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    if (Array.isArray(data) && data.length > 0) return data
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }

  const defaults = buildDefaultProjects()
  await writeProjects(defaults)
  return defaults
}

async function writeProjects(projects) {
  await fs.mkdir(path.dirname(PROJECTS_FILE), { recursive: true })
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2))
}

async function readHero() {
  try {
    const raw = await fs.readFile(HERO_FILE, 'utf-8')
    const data = JSON.parse(raw)
    if (data && Array.isArray(data.images)) return data
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }

  const defaults = buildDefaultHero()
  await writeHero(defaults)
  return defaults
}

async function writeHero(hero) {
  await fs.mkdir(path.dirname(HERO_FILE), { recursive: true })
  await fs.writeFile(HERO_FILE, JSON.stringify(hero, null, 2))
}

function resolvePublicPath(webPath) {
  if (!webPath?.startsWith('/')) return null
  const full = path.normalize(path.join(PUBLIC_ROOT, webPath.slice(1)))
  if (!full.startsWith(PUBLIC_ROOT)) return null
  return full
}

async function removePublicFile(webPath) {
  if (!webPath?.startsWith('/')) return
  if (webPath.startsWith('/hero/')) {
    const relative = webPath.replace(/^\/hero\//, '')
    await fs.unlink(path.join(HERO_UPLOAD, relative)).catch(() => {})
    await fs.unlink(path.join(HERO_PUBLIC, relative)).catch(() => {})
    return
  }
  const filePath = resolvePublicPath(webPath)
  if (!filePath) return
  await fs.unlink(filePath).catch(() => {})
}

function normalizeHeroContent(body, existing) {
  const headline = body.headline ?? existing.headline
  const desc = body.desc ?? existing.desc
  const cta = body.cta ?? existing.cta
  const link = body.link?.trim() || existing.link || '/about'

  const headlineKo = headline?.ko
  const headlineEn = headline?.en
  const descKo = desc?.ko
  const descEn = desc?.en
  const ctaKo = cta?.ko?.trim()
  const ctaEn = cta?.en?.trim()

  if (!headlineKo?.length || !headlineEn?.length || !descKo?.length || !descEn?.length || !ctaKo || !ctaEn) {
    return { error: 'Missing required fields' }
  }

  return {
    headline: {
      ko: headlineKo.map((line) => String(line).trim()).filter(Boolean),
      en: headlineEn.map((line) => String(line).trim()).filter(Boolean),
    },
    desc: {
      ko: descKo.map((line) => String(line).trim()).filter(Boolean),
      en: descEn.map((line) => String(line).trim()).filter(Boolean),
    },
    cta: { ko: ctaKo, en: ctaEn },
    link,
  }
}

const heroUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdir(HERO_UPLOAD, { recursive: true })
        .then(() => cb(null, HERO_UPLOAD))
        .catch(cb)
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.-]+/g, '-').toLowerCase()
      cb(null, `${Date.now()}-${safe}`)
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\//.test(file.mimetype))
  },
})

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function parseLines(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function getProjectSlug(project) {
  if (project?.slug) return project.slug
  const imagePath = project?.thumb || project?.gallery?.[0]
  if (!imagePath) return null
  const match = String(imagePath).match(/^\/projects\/([^/]+)\//)
  return match ? match[1] : null
}

function getProjectPath(project) {
  return `/work/${getProjectSlug(project) || project.id}`
}

async function removeProjectFolder(slug) {
  if (!slug) return
  await fs.rm(path.join(PROJECTS_UPLOAD, slug), { recursive: true, force: true })
  // Keep git-tracked assets in public/projects; only wipe upload copies.
}

async function removeProjectImage(imagePath) {
  if (!imagePath?.startsWith('/projects/')) return
  const relative = imagePath.replace(/^\/projects\//, '')
  await fs.unlink(path.join(PROJECTS_UPLOAD, relative)).catch(() => {})
  await fs.unlink(path.join(PROJECTS_PUBLIC, relative)).catch(() => {})
}

function parseRemoveGallery(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return parseLines(value)
  }
}

function buildProjectPayload(body, slug, files, existing = null) {
  const {
    tagKo,
    tagEn,
    title,
    subtitle,
    date,
    client,
    location,
    descriptionKo,
    descriptionEn,
    scopeKo,
    scopeEn,
    removeGalleryPaths,
  } = body ?? {}

  if (!tagKo?.trim() || !tagEn?.trim() || !title?.trim() || !subtitle?.trim() || !date?.trim()) {
    return { error: 'Missing required fields' }
  }

  const toPublicPath = (filename) => `/projects/${slug}/${filename}`
  const thumbFile = files?.thumb?.[0]
  const galleryFiles = files?.gallery || []
  const removeGallery = parseRemoveGallery(removeGalleryPaths)

  let thumb = existing?.thumb
  let gallery = [...(existing?.gallery || [])]

  if (removeGallery.length > 0) {
    gallery = gallery.filter((item) => !removeGallery.includes(item))
  }

  if (thumbFile) {
    const nextThumb = toPublicPath(thumbFile.filename)
    if (existing?.thumb && existing.thumb !== nextThumb && !gallery.includes(existing.thumb)) {
      gallery.unshift(existing.thumb)
    }
    thumb = nextThumb
  }

  if (galleryFiles.length > 0) {
    gallery.push(...galleryFiles.map((file) => toPublicPath(file.filename)))
  }

  const project = {
    ...(existing || {}),
    tag: { ko: tagKo.trim(), en: tagEn.trim() },
    title: title.trim(),
    subtitle: subtitle.trim(),
    date: date.trim(),
    client: (client || title).trim(),
    location: (location || 'Sydney').trim(),
    description: {
      ko: descriptionKo?.trim() || '',
      en: descriptionEn?.trim() || '',
    },
    scope: {
      ko: parseLines(scopeKo),
      en: parseLines(scopeEn),
    },
    slug,
    updatedAt: new Date().toISOString(),
  }

  if (thumb) project.thumb = thumb
  else delete project.thumb

  if (gallery.length > 0) project.gallery = gallery
  else delete project.gallery

  return { project, removeGallery, replacedThumb: Boolean(thumbFile) }
}

function runMulter(middleware, req, res) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

function createProjectUpload(slug) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dir = path.join(PROJECTS_UPLOAD, slug)
        fs.mkdir(dir, { recursive: true })
          .then(() => cb(null, dir))
          .catch(cb)
      },
      filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^\w.-]+/g, '-').toLowerCase()
        cb(null, `${Date.now()}-${safe}`)
      },
    }),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const isImage = /^image\//.test(file.mimetype)
      const isVideo = /^video\//.test(file.mimetype)

      if (file.fieldname === 'thumb') {
        cb(null, isImage)
        return
      }

      if (file.fieldname === 'gallery') {
        cb(null, isImage || isVideo)
        return
      }

      cb(null, false)
    },
  })
}

function createToken() {
  return crypto.randomBytes(32).toString('hex')
}

function isValidSession(token) {
  const session = sessions.get(token)
  if (!session) return false
  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return false
  }
  return true
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token || !isValidSession(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body ?? {}
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' })
  }
  const token = createToken()
  sessions.set(token, { expiresAt: Date.now() + TOKEN_TTL_MS })
  res.json({ token })
})

app.post('/api/quotes', async (req, res) => {
  const { name, email, company, service, budget, timeline, message, items } = req.body ?? {}
  const cartItems = Array.isArray(items) ? items : []

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!message?.trim() && cartItems.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const quote = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim(),
    company: company?.trim() || '',
    service: service?.trim() || '',
    budget: budget?.trim() || '',
    timeline: timeline?.trim() || '',
    message: message?.trim() || '',
    items: cartItems,
    status: 'new',
    createdAt: new Date().toISOString(),
  }

  const quotes = await readQuotes()
  quotes.unshift(quote)
  await writeQuotes(quotes)

  res.status(201).json({ ok: true })
})

app.get('/api/quotes', authMiddleware, async (_req, res) => {
  const quotes = await readQuotes()
  res.json(quotes)
})

app.patch('/api/quotes/:id', authMiddleware, async (req, res) => {
  const { status } = req.body ?? {}
  const allowed = ['new', 'contacted', 'closed']
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const quotes = await readQuotes()
  const index = quotes.findIndex((q) => q.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' })
  }

  quotes[index] = { ...quotes[index], status, updatedAt: new Date().toISOString() }
  await writeQuotes(quotes)
  res.json(quotes[index])
})

app.get('/api/news', async (_req, res) => {
  const news = await readNews()
  res.json(news)
})

app.post('/api/news', authMiddleware, async (req, res) => {
  const parsed = parseNewsPayload(req.body)
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error })
  }

  const item = {
    id: crypto.randomUUID(),
    ...parsed.item,
    createdAt: new Date().toISOString(),
  }

  const news = await readNews()
  news.unshift(item)
  await writeNews(news)

  res.status(201).json(item)
})

app.patch('/api/news/:id', authMiddleware, async (req, res) => {
  const news = await readNews()
  const index = news.findIndex((n) => n.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' })
  }

  const parsed = parseNewsPayload(req.body)
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error })
  }

  const existing = news[index]
  const updated = {
    ...existing,
    ...parsed.item,
    id: existing.id,
    createdAt: existing.createdAt,
  }

  if (parsed.omitDocument) {
    delete updated.document
  }

  news[index] = updated
  await writeNews(news)

  res.json(updated)
})

app.delete('/api/news/:id', authMiddleware, async (req, res) => {
  const news = await readNews()
  const index = news.findIndex((n) => n.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' })
  }

  news.splice(index, 1)
  await writeNews(news)
  res.json({ ok: true })
})

app.get('/api/projects', async (_req, res) => {
  const projects = await readProjects()
  res.json(projects)
})

app.post('/api/projects', authMiddleware, async (req, res) => {
  try {
    const slug = slugify(req.headers['x-project-slug']) || `project-${Date.now()}`
    const upload = createProjectUpload(slug)

    try {
      await runMulter(
        upload.fields([
          { name: 'thumb', maxCount: 1 },
          { name: 'gallery', maxCount: 30 },
        ]),
        req,
        res,
      )
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' })
    }

    const payload = buildProjectPayload(req.body, slug, req.files)
    if (payload.error) {
      return res.status(400).json({ error: payload.error })
    }

    const { project } = payload

    const projects = await readProjects()
    const nextId = projects.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1

    const created = {
      id: nextId,
      ...project,
      createdAt: new Date().toISOString(),
    }

    projects.unshift(created)
    await writeProjects(projects)
    res.status(201).json(created)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Create failed' })
  }
})

app.patch('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const projectId = Number(req.params.id)
    const projects = await readProjects()
    const index = projects.findIndex((item) => Number(item.id) === projectId)
    if (index === -1) {
      return res.status(404).json({ error: 'Not found' })
    }

    const existing = projects[index]
    const slug =
      slugify(req.headers['x-project-slug']) ||
      getProjectSlug(existing) ||
      `project-${existing.id}`

    const upload = createProjectUpload(slug)
    try {
      await runMulter(
        upload.fields([
          { name: 'thumb', maxCount: 1 },
          { name: 'gallery', maxCount: 30 },
        ]),
        req,
        res,
      )
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' })
    }

    const payload = buildProjectPayload(req.body, slug, req.files, existing)
    if (payload.error) {
      return res.status(400).json({ error: payload.error })
    }

    const { project, removeGallery, replacedThumb } = payload

    if (replacedThumb && existing.thumb && existing.thumb !== project.thumb) {
      const stillUsed = project.gallery?.includes(existing.thumb)
      if (!stillUsed) {
        await removeProjectImage(existing.thumb)
      }
    }

    for (const imagePath of removeGallery) {
      await removeProjectImage(imagePath)
    }

    const updated = {
      ...existing,
      ...project,
      id: existing.id,
      createdAt: existing.createdAt,
    }

    projects[index] = updated
    await writeProjects(projects)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Update failed' })
  }
})

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  const projectId = Number(req.params.id)
  const projects = await readProjects()
  const index = projects.findIndex((item) => Number(item.id) === projectId)
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' })
  }

  const removed = projects[index]
  const slug = getProjectSlug(removed)

  projects.splice(index, 1)
  await writeProjects(projects)
  await removeProjectFolder(slug)

  res.json({ ok: true })
})

app.get('/api/hero', async (_req, res) => {
  const hero = await readHero()
  res.json(hero)
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.patch('/api/hero', authMiddleware, async (req, res) => {
  try {
    const hero = await readHero()
    const content = normalizeHeroContent(req.body, hero)
    if (content.error) {
      return res.status(400).json({ error: content.error })
    }

    const images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : hero.images
    if (images.length === 0) {
      return res.status(400).json({ error: 'At least one hero image is required' })
    }

    const updated = {
      ...hero,
      ...content,
      images,
      updatedAt: new Date().toISOString(),
    }

    await writeHero(updated)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Update failed' })
  }
})

app.post('/api/hero/images', authMiddleware, (req, res, next) => {
  heroUpload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' })
    }
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' })
    }

    const hero = await readHero()
    const imagePath = `/hero/${req.file.filename}`
    const updated = {
      ...hero,
      images: [...hero.images, imagePath],
      updatedAt: new Date().toISOString(),
    }

    await writeHero(updated)
    res.status(201).json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Upload failed' })
  }
})

app.delete('/api/hero/images', authMiddleware, async (req, res) => {
  try {
    const { path: imagePath } = req.body ?? {}
    if (!imagePath) {
      return res.status(400).json({ error: 'Missing image path' })
    }

    const hero = await readHero()
    if (!hero.images.includes(imagePath)) {
      return res.status(404).json({ error: 'Not found' })
    }

    if (hero.images.length <= 1) {
      return res.status(400).json({ error: 'At least one hero image is required' })
    }

    const updated = {
      ...hero,
      images: hero.images.filter((item) => item !== imagePath),
      updatedAt: new Date().toISOString(),
    }

    await writeHero(updated)
    if (imagePath.startsWith('/hero/')) {
      await removePublicFile(imagePath)
    }

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Delete failed' })
  }
})

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const projects = await readProjects()
    const staticPaths = ['/', '/about', '/works', '/news', '/services', '/contact', '/privacy', '/terms']
    const projectPaths = projects.map((project) => getProjectPath(project))
    const urls = [...staticPaths, ...projectPaths]
    const lastmod = new Date().toISOString().slice(0, 10)

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (pathname) => `  <url>
    <loc>${SITE_URL}${pathname === '/' ? '/' : pathname}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>`

    res.type('application/xml').send(body)
  } catch (err) {
    res.status(500).type('text/plain').send('Failed to generate sitemap')
  }
})

app.get('/works/:slug', async (req, res) => {
  const { slug } = req.params

  if (/^\d+$/.test(slug)) {
    const projects = await readProjects()
    const project = projects.find((item) => Number(item.id) === Number(slug))
    if (!project) {
      return res.redirect(301, '/works')
    }
    return res.redirect(301, getProjectPath(project))
  }

  return res.redirect(301, `/work/${slug}`)
})

app.use('/projects', express.static(PROJECTS_UPLOAD))
app.use('/projects', express.static(PROJECTS_PUBLIC))
app.use('/hero', express.static(HERO_UPLOAD))
app.use('/hero', express.static(HERO_PUBLIC))
app.use(express.static(PUBLIC_ROOT))

const distPath = path.join(__dirname, '..', 'dist')
if (process.env.SERVE_STATIC === '1') {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (req, res) => {
    // Missing asset files should 404 — not fall through to the SPA shell.
    if (path.extname(req.path)) {
      return res.status(404).send('Not found')
    }
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}
