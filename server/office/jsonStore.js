import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')

/** @type {Map<string, Promise<unknown>>} */
const writeQueues = new Map()

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

function filePath(name) {
  return path.join(DATA_DIR, name)
}

async function readRaw(name) {
  const full = filePath(name)
  try {
    const raw = await fs.readFile(full, 'utf-8')
    if (!raw.trim()) return null
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return null
    if (err instanceof SyntaxError) {
      console.error(`[office/jsonStore] Invalid JSON in ${name}:`, err.message)
      return null
    }
    throw err
  }
}

async function writeRaw(name, data) {
  await ensureDir()
  const full = filePath(name)
  const tmp = `${full}.${process.pid}.${Date.now()}.tmp`
  const payload = `${JSON.stringify(data, null, 2)}\n`
  await fs.writeFile(tmp, payload, 'utf-8')
  await fs.rename(tmp, full)
}

/**
 * Read JSON array/object. If missing/empty/invalid, initialize with defaultValue and return it.
 */
export async function readJson(name, defaultValue) {
  const existing = await readRaw(name)
  if (existing === null) {
    const value = typeof defaultValue === 'function' ? defaultValue() : structuredClone(defaultValue)
    await enqueueWrite(name, async () => {
      const again = await readRaw(name)
      if (again !== null) return again
      await writeRaw(name, value)
      return value
    })
    const after = await readRaw(name)
    return after ?? value
  }
  return existing
}

function enqueueWrite(name, job) {
  const prev = writeQueues.get(name) || Promise.resolve()
  const next = prev.then(job, job)
  writeQueues.set(
    name,
    next.then(
      () => undefined,
      () => undefined,
    ),
  )
  return next
}

/**
 * Atomically update JSON via mutator. Serializes writes per filename.
 */
export async function updateJson(name, defaultValue, mutator) {
  return enqueueWrite(name, async () => {
    let current = await readRaw(name)
    if (current === null) {
      current = typeof defaultValue === 'function' ? defaultValue() : structuredClone(defaultValue)
    }
    const next = await mutator(structuredClone(current))
    await writeRaw(name, next)
    return next
  })
}

export async function writeJson(name, data) {
  return enqueueWrite(name, async () => {
    await writeRaw(name, data)
    return data
  })
}

export { DATA_DIR }
