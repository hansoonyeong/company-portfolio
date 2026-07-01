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

for (const name of SEED_FILES) {
  await ensureFile(name)
}
