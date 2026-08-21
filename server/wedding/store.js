import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const RSVP_FILE = path.join(__dirname, '..', 'data', 'wedding-rsvps.json')

let writeQueue = Promise.resolve()

function enqueue(fn) {
  const next = writeQueue.then(fn, fn)
  writeQueue = next.catch(() => {})
  return next
}

export async function readRsvps() {
  try {
    const raw = await fs.readFile(RSVP_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(path.dirname(RSVP_FILE), { recursive: true })
      await fs.writeFile(RSVP_FILE, '[]')
      return []
    }
    throw err
  }
}

async function writeRsvpsRaw(rsvps) {
  const tmp = `${RSVP_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(rsvps, null, 2))
  await fs.rename(tmp, RSVP_FILE)
}

export function withRsvpTransaction(fn) {
  return enqueue(async () => {
    const rsvps = await readRsvps()
    const result = await fn(rsvps)
    if (result?.rsvps) {
      await writeRsvpsRaw(result.rsvps)
    }
    return result?.value
  })
}

export async function findRsvpByToken(token) {
  const rsvps = await readRsvps()
  return rsvps.find((r) => r.editToken === token) ?? null
}

export async function findRsvpById(id) {
  const rsvps = await readRsvps()
  return rsvps.find((r) => r.id === id) ?? null
}
