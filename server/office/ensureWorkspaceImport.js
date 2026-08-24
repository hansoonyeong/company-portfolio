/**
 * One-shot safe import on server boot when marker file is absent.
 * Never deletes; never touches DOS; skips duplicates.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { DATA_DIR } from './jsonStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MARKER = 'office-import-real-workspace-v1.json'

export async function ensureRealWorkspaceImported() {
  const markerPath = path.join(DATA_DIR, MARKER)
  try {
    await fs.access(markerPath)
    return { skipped: true, reason: 'already_imported' }
  } catch {
    // continue
  }

  // Dynamic import keeps boot light if script missing
  const { spawn } = await import('child_process')
  const script = path.join(__dirname, '..', '..', 'scripts', 'import-office-workspace.mjs')

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => {
      out += d
    })
    child.stderr.on('data', (d) => {
      err += d
    })
    child.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error(err || out || `import exit ${code}`))
    })
  })

  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(
    markerPath,
    `${JSON.stringify({ importedAt: new Date().toISOString(), version: 1 }, null, 2)}\n`,
    'utf8',
  )
  return { skipped: false, imported: true }
}
