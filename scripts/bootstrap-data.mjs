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

function syncProjectFields(project, seedProject) {
  let changed = false

  for (const field of ['slug', 'thumb', 'gallery']) {
    if (seedProject[field] === undefined) continue
    const next = JSON.stringify(seedProject[field])
    const prev = JSON.stringify(project[field])
    if (next !== prev) {
      project[field] = seedProject[field]
      changed = true
    }
  }

  if (seedProject.caseStudy) {
    const next = JSON.stringify(seedProject.caseStudy)
    const prev = JSON.stringify(project.caseStudy)
    if (next !== prev) {
      project.caseStudy = seedProject.caseStudy
      changed = true
    }
  }

  return changed
}

async function syncProjectsFromSeed() {
  const dest = path.join(dataDir, 'projects.json')
  const src = path.join(seedDir, 'projects.json')

  try {
    const [destRaw, srcRaw] = await Promise.all([
      fs.readFile(dest, 'utf-8'),
      fs.readFile(src, 'utf-8'),
    ])
    const projects = JSON.parse(destRaw)
    const seed = JSON.parse(srcRaw)
    const seedById = Object.fromEntries(seed.map((item) => [Number(item.id), item]))

    let changed = false
    for (const project of projects) {
      const seedProject = seedById[Number(project.id)]
      if (!seedProject) continue
      if (syncProjectFields(project, seedProject)) changed = true
    }

    if (changed) {
      await fs.writeFile(dest, `${JSON.stringify(projects, null, 2)}\n`)
      console.log('[bootstrap] Synced project slugs, media paths, and case studies from data-seed')
    }
  } catch (err) {
    console.warn('[bootstrap] Could not sync projects:', err.message)
  }
}

for (const name of SEED_FILES) {
  await ensureFile(name)
}

await syncProjectsFromSeed()
