/**
 * Peekabrew hero.mp4 용량 줄이기 (웹용)
 * 사용: npm run compress:peekabrew-hero
 *
 * - 오디오 제거 (히어로는 muted autoplay)
 * - 최대 너비 1280px
 * - H.264 CRF 28 (화질·용량 균형)
 * - faststart (스트리밍에 유리)
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const input = path.join(rootDir, 'public/projects/peekabrew/hero.mp4')
const output = path.join(rootDir, 'public/projects/peekabrew/hero-compressed.mp4')
const backup = path.join(rootDir, 'public/projects/peekabrew/hero-original.mp4')

async function getFfmpeg() {
  try {
    const mod = await import('ffmpeg-static')
    const bin = mod.default
    if (bin && fs.existsSync(bin)) return bin
  } catch {
    // fallback to system ffmpeg
  }
  return 'ffmpeg'
}

function sizeMb(filePath) {
  if (!fs.existsSync(filePath)) return 0
  return (fs.statSync(filePath).size / (1024 * 1024)).toFixed(1)
}

if (!fs.existsSync(input)) {
  console.error('Missing:', input)
  process.exit(1)
}

const ffmpeg = await getFfmpeg()
console.log('Input:', input, `(${sizeMb(input)} MB)`)
console.log('Using ffmpeg:', ffmpeg)

const args = [
  '-y',
  '-i',
  input,
  '-an',
  '-vf',
  "scale='min(1280,iw)':-2",
  '-c:v',
  'libx264',
  '-preset',
  'slow',
  '-crf',
  '28',
  '-movflags',
  '+faststart',
  '-pix_fmt',
  'yuv420p',
  output,
]

const result = spawnSync(ffmpeg, args, { stdio: 'inherit' })

if (result.status !== 0) {
  console.error('\nffmpeg failed. Install: brew install ffmpeg')
  console.error('Or run: npm install (ffmpeg-static is included as devDependency)')
  process.exit(result.status ?? 1)
}

if (!fs.existsSync(backup)) {
  fs.copyFileSync(input, backup)
  console.log('Backup → hero-original.mp4')
}

fs.renameSync(output, input)
console.log('\nDone. hero.mp4:', `${sizeMb(input)} MB (was ${sizeMb(backup)} MB if backed up)`)
