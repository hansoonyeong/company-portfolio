import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const dataDir = path.join(rootDir, 'server/data')
const seedDir = path.join(rootDir, 'server/data-seed')

const SEED_FILES = ['projects.json', 'news.json', 'hero.json']

async function ensureFile(name) {
  const dest = path.join(dataDir, name)
  const src = path.join(seedDir, name)

  try {
    await fs.access(dest)
    return
  } catch {
    // missing — seed from repo snapshot
  }

  try {
    await fs.mkdir(dataDir, { recursive: true })
    await fs.copyFile(src, dest)
    console.log(`[bootstrap] Seeded server/data/${name}`)
  } catch (err) {
    console.warn(`[bootstrap] Could not seed ${name}:`, err.message)
  }
}

async function syncProjectsCaseStudies() {
  const dest = path.join(dataDir, 'projects.json')
  const src = path.join(seedDir, 'projects.json')

  try {
    const [destRaw, srcRaw] = await Promise.all([
      fs.readFile(dest, 'utf-8'),
      fs.readFile(src, 'utf-8'),
    ])
    const projects = JSON.parse(destRaw)
    const seed = JSON.parse(srcRaw)
    const seedBySlug = Object.fromEntries(
      seed.filter((p) => p.slug).map((p) => [p.slug, p]),
    )

    let changed = false
    for (const project of projects) {
      const seedProject = seedBySlug[project.slug]
      if (!seedProject?.caseStudy) continue

      const next = JSON.stringify(seedProject.caseStudy)
      const prev = JSON.stringify(project.caseStudy)
      if (next !== prev) {
        project.caseStudy = seedProject.caseStudy
        changed = true
      }
    }

    if (changed) {
      await fs.writeFile(dest, JSON.stringify(projects, null, 2))
      console.log('[bootstrap] Synced caseStudy fields from data-seed')
    }
  } catch (err) {
    console.warn('[bootstrap] Could not sync caseStudy:', err.message)
  }
}

for (const name of SEED_FILES) {
  await ensureFile(name)
}

await syncProjectsCaseStudies()
